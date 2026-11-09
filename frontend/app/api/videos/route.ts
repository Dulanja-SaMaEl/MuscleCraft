import { NextRequest, NextResponse } from 'next/server';
import { VideoService } from '@/lib/services/video-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddVideoSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const videoId = searchParams.get('videoId');
    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const success = VideoService.deleteVideo(caller, videoId);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('exercise_videos').delete().eq('id', videoId);
      } catch (err) {
        console.warn('Supabase video delete failed:', err);
      }
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
