import { db } from '../db/mock-db';
import { ExerciseVideo, User } from '../types';

export class VideoService {
  // Return allowed videos strictly enforcing access tiers
  static getPermittedVideos(caller: User): ExerciseVideo[] {
    // Admins, Instructors, and 90-Day VIP members get full access
    if (
      caller.role === 'admin' ||
      caller.role === 'instructor' ||
      caller.tier === 'coaching_90'
    ) {
      return db.videos;
    }

    // Monthly members only receive common access videos
    return db.videos.filter((v) => v.accessLevel === 'common');
  }

  // Add new video (Cloudflare Stream metadata)
  static addVideo(
    caller: User,
    data: {
      title: string;
      category: 'Warmup' | 'Hypertrophy' | 'Powerlifting' | 'Mobility' | 'Coaching Clinic';
      duration: string;
      accessLevel: 'common' | 'coaching_90';
      cfStreamId: string;
      videoUrl?: string;
      thumbnailUrl: string;
      description: string;
    }
  ): ExerciseVideo {
    if (caller.role !== 'instructor' && caller.role !== 'admin') {
      throw new Error('Forbidden: Only instructors and administrators can upload session videos.');
    }

    const video: ExerciseVideo = {
      id: `vid_${Date.now()}`,
      title: data.title,
      category: data.category,
      duration: data.duration,
      accessLevel: data.accessLevel,
      cfStreamId: data.cfStreamId,
      videoUrl: data.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: data.thumbnailUrl,
      description: data.description,
      instructorName: caller.name,
    };

    db.videos.unshift(video);

    // Audit log
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'VIDEO_UPLOADED',
      targetType: 'video',
      targetId: video.id,
      details: `Uploaded video "${video.title}" with access level ${video.accessLevel}.`,
      timestamp: new Date().toISOString(),
    });

    return video;
  }
}
