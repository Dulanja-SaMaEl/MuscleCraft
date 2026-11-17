import { NextRequest, NextResponse } from 'next/server';
import { VideoService } from '@/lib/services/video-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddVideoSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { deleteFromR2 } from '@/lib/storage/cloudflare-r2';
import { db } from '@/lib/db/mock-db';
import fs from 'fs';
import path from 'path';
import { ExerciseVideo, User } from '@/lib/types';

async function resolveCaller(userId?: string | null): Promise<User> {
  if (userId) {
    const localUser = AuthService.getCurrentUser(userId);
    if (localUser) return localUser;

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: profile } = await supabaseServer
          .from('profiles')
          .select('id, email, name, role, tier, status, joined_at')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          return {
            id: profile.id,
            email: profile.email || '',
            name: profile.name || 'Athlete',
            role: (profile.role as User['role']) || 'client',
            tier: profile.tier || 'none',
            status: (profile.status as User['status']) || 'active',
            joinedAt: profile.joined_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Supabase caller profile lookup failed:', err);
      }
    }
  }

  // Fail closed to least privilege — never escalate unknown callers to admin
  return {
    id: userId || 'anon_client',
    email: '',
    name: '',
    role: 'client',
    tier: 'none',
    status: 'active',
    joinedAt: new Date().toISOString(),
  };
}

function isVideoVisibleToClient(v: ExerciseVideo, caller: User): boolean {
  const isPrivateClientVideo =
    v.accessLevel === 'client_specific' ||
    v.targetScope === 'specific_client' ||
    Boolean(v.targetClientId);

  if (isPrivateClientVideo) {
    return Boolean(v.targetClientId && v.targetClientId === caller.id);
  }

  // Defensive guard for any historical rows that saved target_client_name with null target_client_id
  if (v.targetClientName && !v.targetClientId) {
    return Boolean(caller.name && v.targetClientName.toLowerCase().trim() === caller.name.toLowerCase().trim());
  }

  if (v.accessLevel === 'coaching_90' || v.targetScope === 'coaching_90_vip') {
    return caller.tier === 'coaching_90';
  }

  return v.accessLevel === 'common';
}

function extractStorageKey(urlOrKey?: string | null, prefix?: 'vault_' | 'thumb_'): string | null {
  if (!urlOrKey) return null;
  if (prefix && urlOrKey.startsWith(prefix)) return urlOrKey;

  if (urlOrKey.includes('key=')) {
    try {
      const u = new URL(urlOrKey, 'http://localhost');
      const k = u.searchParams.get('key');
      if (k && (!prefix || k.startsWith(prefix))) return k;
    } catch (_) {}
  }

  const regex = prefix ? new RegExp(`${prefix}[a-zA-Z0-9_\\-\\.]+`) : /vault_[a-zA-Z0-9_\-\.]+/;
  const match = urlOrKey.match(regex);
  if (match) return match[0];

  if (urlOrKey.includes('.r2.dev') || urlOrKey.includes('.r2.cloudflarestorage.com')) {
    try {
      const parsed = new URL(urlOrKey);
      const pathnameKey = parsed.pathname.replace(/^\/+/, '');
      if (pathnameKey && (!prefix || pathnameKey.startsWith(prefix))) return pathnameKey;
    } catch (_) {}
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = await resolveCaller(userId);

    let videos: ExerciseVideo[] = [];

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        let query = supabaseServer.from('exercise_videos').select('*').order('created_at', { ascending: false });
        if (caller.role === 'client') {
          query = query.or(
            `target_client_id.eq.${caller.id},and(target_client_id.is.null,access_level.in.(common,coaching_90))`
          );
        }
        const { data, error } = await query;
        if (!error && data) {
          const mapped: ExerciseVideo[] = data.map((v: any) => {
            const accessLevel = v.access_level as ExerciseVideo['accessLevel'];
            const targetScope =
              accessLevel === 'client_specific' || Boolean(v.target_client_id)
                ? 'specific_client'
                : accessLevel === 'coaching_90'
                ? 'coaching_90_vip'
                : 'all_members';

            return {
              id: v.id,
              title: v.title,
              category: v.category,
              duration: v.duration,
              accessLevel,
              targetScope,
              targetClientId: v.target_client_id || undefined,
              targetClientName: v.target_client_name || undefined,
              cfStreamId: v.cf_stream_id || 'stream_default',
              videoUrl: v.video_url,
              thumbnailUrl: v.thumbnail_url,
              description: v.description,
              instructorName: v.instructor_name || 'Coach Adeesha',
              createdAt: v.created_at,
            };
          });

          videos = caller.role === 'client' ? mapped.filter((v) => isVideoVisibleToClient(v, caller)) : mapped;
        }
      } catch (sbErr) {
        console.warn('Supabase videos fetch failed, using local vault:', sbErr);
      }
    } else {
      videos = VideoService.getPermittedVideos(caller);
    }

    return NextResponse.json({
      videos,
      userTier: caller.tier,
      hasVipAccess: caller.tier === 'coaching_90' || caller.role !== 'client',
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = await resolveCaller(userId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden: Only coaches and administrators can publish session videos.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = AddVideoSchema.parse(body);

    if (validated.targetScope === 'specific_client' && !validated.targetClientId) {
      return NextResponse.json(
        { error: 'Please select a specific athlete before publishing a client-specific video.' },
        { status: 400 }
      );
    }

    // Resolve client details from Supabase if targetClientId isn't in local mock cache
    let resolvedClientName = validated.targetClientName;
    if (validated.targetClientId && !resolvedClientName && isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: targetProfile } = await supabaseServer
          .from('profiles')
          .select('name')
          .eq('id', validated.targetClientId)
          .maybeSingle();
        if (targetProfile?.name) resolvedClientName = targetProfile.name;
      } catch (_) {}
    }

    const video = VideoService.addVideo(caller, {
      ...validated,
      targetClientName: resolvedClientName,
    });

    if (isServerSupabaseConfigured && supabaseServer) {
      const insertPayload = {
        title: video.title,
        category: video.category,
        duration: video.duration,
        access_level: video.accessLevel,
        target_client_id: video.targetClientId || null,
        target_client_name: video.targetClientName || null,
        cf_stream_id: video.cfStreamId,
        video_url: video.videoUrl,
        thumbnail_url: video.thumbnailUrl,
        description: video.description,
        instructor_id: caller.id || null,
        instructor_name: caller.name,
        created_at: new Date().toISOString(),
      };

      const { data: insertedRow, error: insertErr } = await supabaseServer
        .from('exercise_videos')
        .insert(insertPayload)
        .select('*')
        .maybeSingle();

      if (insertErr) {
        console.error('Supabase video insert failed:', insertErr);
        return NextResponse.json(
          { error: `Failed to save video to database: ${insertErr.message}` },
          { status: 400 }
        );
      }

      if (insertedRow) {
        video.id = insertedRow.id;
      }
    }

    return NextResponse.json({ success: true, video }, { status: 201 });
  } catch (error: any) {
    let cleanMessage = error.message;
    if (error.errors && Array.isArray(error.errors)) {
      cleanMessage = error.errors.map((e: any) => e.message || `${e.path?.join('.')}: invalid`).join('. ');
    } else if (typeof cleanMessage === 'string' && cleanMessage.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleanMessage);
        if (Array.isArray(parsed)) {
          cleanMessage = parsed.map((e: any) => e.message || `${e.path?.join('.')}: invalid`).join('. ');
        }
      } catch (_) {}
    }
    return NextResponse.json({ error: cleanMessage || 'Failed to add session video.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const videoId = searchParams.get('videoId');
    const caller = await resolveCaller(userId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Only administrators and coaches can delete videos.' }, { status: 403 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // 1. Locate video metadata before deleting to identify R2 video & custom thumbnail keys
    let videoUrl: string | undefined = undefined;
    let thumbnailUrl: string | undefined = undefined;
    let cfStreamId: string | undefined = undefined;

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: sbRow } = await supabaseServer
          .from('exercise_videos')
          .select('video_url, thumbnail_url, cf_stream_id')
          .eq('id', videoId)
          .maybeSingle();
        if (sbRow) {
          videoUrl = sbRow.video_url;
          thumbnailUrl = sbRow.thumbnail_url;
          cfStreamId = sbRow.cf_stream_id;
        }
      } catch (findErr) {
        console.warn('Could not query video from Supabase before deletion:', findErr);
      }
    }

    if (!videoUrl) {
      const localVid = db.videos.find((v) => v.id === videoId);
      if (localVid) {
        videoUrl = localVid.videoUrl;
        thumbnailUrl = localVid.thumbnailUrl;
        cfStreamId = localVid.cfStreamId;
      }
    }

    // 2. Extract Cloudflare R2 video object key (e.g. vault_179..._name.mp4)
    let r2Deleted = false;
    let r2Key: string | null = null;

    if (cfStreamId && (cfStreamId.startsWith('vault_') || !cfStreamId.startsWith('cf_stream_'))) {
      r2Key = cfStreamId;
    } else {
      r2Key = extractStorageKey(videoUrl);
    }

    // 3. Delete physical video object from Cloudflare R2 & local filesystem
    if (r2Key) {
      try {
        const r2Res = await deleteFromR2(r2Key);
        r2Deleted = r2Res.success;
      } catch (r2DelErr) {
        console.warn('[Cloudflare R2] Deletion failed:', r2DelErr);
      }

      try {
        const localPath = path.join(process.cwd(), 'public', 'uploads', 'videos', r2Key);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (_) {}
    }

    // Also delete custom uploaded thumbnail if it belongs to our R2 / local thumbnails folder
    const thumbKey = extractStorageKey(thumbnailUrl, 'thumb_');
    if (thumbKey) {
      try {
        await deleteFromR2(thumbKey);
      } catch (_) {}
      try {
        const localThumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', thumbKey);
        if (fs.existsSync(localThumbPath)) {
          fs.unlinkSync(localThumbPath);
        }
      } catch (_) {}
    }

    // 4. Delete from Supabase PostgreSQL cloud database if active
    let supabaseDeleted = false;
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { error } = await supabaseServer.from('exercise_videos').delete().eq('id', videoId);
        if (!error) {
          supabaseDeleted = true;
        } else {
          console.warn('Supabase video delete warning:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase video delete failed:', err.message);
      }
    }

    // 5. Also remove from local in-memory cache
    VideoService.deleteVideo(caller, videoId);

    return NextResponse.json({
      success: true,
      supabaseDeleted,
      r2Deleted,
      r2Key,
      videoId,
      message: r2Deleted
        ? `Video and Cloudflare R2 storage object (${r2Key}) permanently deleted.`
        : `Video record deleted from database.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
