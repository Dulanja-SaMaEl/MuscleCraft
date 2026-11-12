import { NextRequest, NextResponse } from 'next/server';
import { VideoService } from '@/lib/services/video-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddVideoSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { deleteFromR2 } from '@/lib/storage/cloudflare-r2';
import { db } from '@/lib/db/mock-db';
import fs from 'fs';
import path from 'path';
import { ExerciseVideo } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin', tier: 'sole_1y' } as any);

    let videos = VideoService.getPermittedVideos(caller);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        let query = supabaseServer.from('exercise_videos').select('*').order('created_at', { ascending: false });
        if (caller.role === 'client') {
          query = query.or(`access_level.eq.common,target_client_id.eq.${caller.id}`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          videos = data.map((v: any) => ({
            id: v.id,
            title: v.title,
            category: v.category,
            duration: v.duration,
            accessLevel: v.access_level,
            targetClientId: v.target_client_id,
            targetClientName: v.target_client_name,
            cfStreamId: v.cf_stream_id || 'stream_default',
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url,
            description: v.description,
            instructorId: v.instructor_id,
            instructorName: v.instructor_name,
            createdAt: v.created_at,
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase videos fetch failed, using local vault:', sbErr);
      }
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
    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    const body = await req.json();
    const validated = AddVideoSchema.parse(body);

    const video = VideoService.addVideo(caller, validated);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('exercise_videos').insert({
          title: video.title,
          category: video.category,
          duration: video.duration,
          access_level: video.accessLevel,
          target_client_id: video.targetClientId && video.targetClientId.includes('-') ? video.targetClientId : null,
          target_client_name: video.targetClientName,
          cf_stream_id: video.cfStreamId,
          video_url: video.videoUrl,
          thumbnail_url: video.thumbnailUrl,
          description: video.description,
          instructor_id: caller.id && caller.id.includes('-') ? caller.id : null,
          instructor_name: caller.name,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase video insert failed, cached locally:', err);
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
    const caller = (userId ? AuthService.getCurrentUser(userId) : null) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Only administrators and coaches can delete videos.' }, { status: 403 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // 1. Locate video metadata before deleting to identify R2 object key
    let videoUrl: string | undefined = undefined;
    let cfStreamId: string | undefined = undefined;

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: sbRow } = await supabaseServer
          .from('exercise_videos')
          .select('video_url, cf_stream_id')
          .eq('id', videoId)
          .maybeSingle();
        if (sbRow) {
          videoUrl = sbRow.video_url;
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
        cfStreamId = localVid.cfStreamId;
      }
    }

    // 2. Extract Cloudflare R2 object key (e.g. vault_179..._name.mp4)
    let r2Deleted = false;
    let r2Key: string | null = null;

    if (cfStreamId && (cfStreamId.startsWith('vault_') || !cfStreamId.startsWith('cf_stream_'))) {
      r2Key = cfStreamId;
    } else if (videoUrl) {
      if (videoUrl.includes('key=')) {
        try {
          const u = new URL(videoUrl, 'http://localhost');
          r2Key = u.searchParams.get('key');
        } catch (_) {}
      }
      if (!r2Key) {
        const match = videoUrl.match(/vault_[a-zA-Z0-9_\-\.]+/);
        if (match) {
          r2Key = match[0];
        } else if (videoUrl.includes('.r2.dev') || videoUrl.includes('.r2.cloudflarestorage.com')) {
          try {
            const parsed = new URL(videoUrl);
            r2Key = parsed.pathname.replace(/^\/+/, '');
          } catch (_) {}
        }
      }
    }

    // 3. Delete physical object file from Cloudflare R2 bucket
    if (r2Key) {
      try {
        const r2Res = await deleteFromR2(r2Key);
        r2Deleted = r2Res.success;
      } catch (r2DelErr) {
        console.warn('[Cloudflare R2] Deletion failed:', r2DelErr);
      }

      // Also clean up local file if stored on server filesystem
      try {
        const localPath = path.join(process.cwd(), 'public', 'uploads', 'videos', r2Key);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
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
    const success = VideoService.deleteVideo(caller, videoId);

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
