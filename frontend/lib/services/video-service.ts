import { db } from '../db/mock-db';
import { ExerciseVideo, User, VideoTargetScope } from '../types';

export class VideoService {
  // Return allowed videos strictly enforcing access tiers
  static getPermittedVideos(caller: User): ExerciseVideo[] {
    // Admins and Instructors get full access to all videos
    if (caller.role === 'admin' || caller.role === 'instructor') {
      return db.videos;
    }

    // Clients get videos targeted to them personally, or broadcast to all members
    return db.videos.filter((v) => {
      // 1. Direct client-specific assignment
      if (v.targetClientId === caller.id) {
        return true;
      }

      // 2. 90-Day VIP content
      if (v.accessLevel === 'coaching_90' || v.targetScope === 'coaching_90_vip') {
        return caller.tier === 'coaching_90';
      }

      // 3. Common / all members library
      return v.accessLevel === 'common' || v.targetScope === 'all_members';
    });
  }

  // Get all videos for administrative management
  static getAllVideos(caller: User): ExerciseVideo[] {
    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      throw new Error('Forbidden: Only administrators and coaches can access the video vault.');
    }
    return db.videos;
  }

  // Add new video (Broadcast or Client-Specific)
  static addVideo(
    caller: User,
    data: {
      title: string;
      category: 'Warmup' | 'Hypertrophy' | 'Powerlifting' | 'Mobility' | 'Coaching Clinic' | 'Technique Review' | 'Personalized Session';
      duration: string;
      accessLevel?: 'common' | 'coaching_90';
      targetScope?: VideoTargetScope;
      targetClientId?: string;
      targetClientName?: string;
      cfStreamId?: string;
      videoUrl?: string;
      thumbnailUrl: string;
      description: string;
    }
  ): ExerciseVideo {
    if (caller.role !== 'instructor' && caller.role !== 'admin') {
      throw new Error('Forbidden: Only instructors and administrators can upload session videos.');
    }

    // Lookup client name if clientId is supplied
    let clientName = data.targetClientName;
    if (data.targetClientId && !clientName) {
      const foundUser = db.users.find((u) => u.id === data.targetClientId);
      clientName = foundUser ? foundUser.name : 'Targeted Client';
    }

    const video: ExerciseVideo = {
      id: `vid_${Date.now()}`,
      title: data.title,
      category: data.category,
      duration: data.duration,
      accessLevel: data.accessLevel || 'common',
      targetScope: data.targetScope || (data.targetClientId ? 'specific_client' : 'all_members'),
      targetClientId: data.targetClientId,
      targetClientName: clientName,
      cfStreamId: data.cfStreamId || 'cf_stream_local',
      videoUrl:
        data.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: data.thumbnailUrl,
      description: data.description,
      instructorName: caller.name,
      createdAt: new Date().toISOString(),
    };

    db.videos.unshift(video);

    // Audit log
    const targetDesc = video.targetClientId
      ? `client ${video.targetClientName} (${video.targetClientId})`
      : 'all members & clients';

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'VIDEO_SUBMITTED',
      targetType: 'video',
      targetId: video.id,
      details: `Submitted video "${video.title}" targeted for ${targetDesc} [Category: ${video.category}].`,
      timestamp: new Date().toISOString(),
    });

    return video;
  }

  // Delete a video from library
  static deleteVideo(caller: User, videoId: string): boolean {
    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      throw new Error('Forbidden: Only administrators and coaches can delete videos.');
    }

    const index = db.videos.findIndex((v) => v.id === videoId);
    if (index === -1) {
      throw new Error('Video not found.');
    }

    const [removed] = db.videos.splice(index, 1);

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'VIDEO_DELETED',
      targetType: 'video',
      targetId: videoId,
      details: `Removed video "${removed.title}".`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
