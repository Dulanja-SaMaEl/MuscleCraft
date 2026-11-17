import { db } from '../db/mock-db';
import { ExerciseVideo, User, VideoTargetScope } from '../types';

export class VideoService {
  // Return allowed videos strictly enforcing access tiers
  static getPermittedVideos(caller: User): ExerciseVideo[] {
    // Admins and Instructors get full access to all videos
    if (caller.role === 'admin' || caller.role === 'instructor') {
      return db.videos;
    }

    // Clients get ONLY videos assigned to them specifically, OR broadcast to their permitted tier
    return db.videos.filter((v) => {
      const isPrivateClientVideo =
        v.accessLevel === 'client_specific' ||
        v.targetScope === 'specific_client' ||
        Boolean(v.targetClientId);

      // 1. Strictly isolate private client-specific videos so other clients NEVER see them
      if (isPrivateClientVideo) {
        return Boolean(v.targetClientId && v.targetClientId === caller.id);
      }

      // Defensive guard for legacy rows with targetClientName but missing targetClientId
      if (v.targetClientName) {
        return Boolean(caller.name && v.targetClientName.toLowerCase() === caller.name.toLowerCase());
      }

      // 2. 90-Day VIP broadcast content
      if (v.accessLevel === 'coaching_90' || v.targetScope === 'coaching_90_vip') {
        return caller.tier === 'coaching_90';
      }

      // 3. Common / all-members broadcast library
      return v.accessLevel === 'common';
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
      accessLevel?: 'common' | 'coaching_90' | 'client_specific';
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

    // Determine strict target scope and access level
    const isClientSpecific =
      data.targetScope === 'specific_client' ||
      data.accessLevel === 'client_specific' ||
      Boolean(data.targetClientId);

    const normalizedScope: VideoTargetScope = isClientSpecific
      ? 'specific_client'
      : data.targetScope === 'coaching_90_vip' || data.accessLevel === 'coaching_90'
      ? 'coaching_90_vip'
      : 'all_members';

    const normalizedAccessLevel: 'common' | 'coaching_90' | 'client_specific' = isClientSpecific
      ? 'client_specific'
      : normalizedScope === 'coaching_90_vip'
      ? 'coaching_90'
      : 'common';

    // Lookup client name if clientId is supplied
    let clientName = isClientSpecific ? data.targetClientName : undefined;
    if (isClientSpecific && data.targetClientId && !clientName) {
      const foundUser = db.users.find((u) => u.id === data.targetClientId);
      clientName = foundUser ? foundUser.name : 'Targeted Client';
    }

    const video: ExerciseVideo = {
      id: `vid_${Date.now()}`,
      title: data.title,
      category: data.category,
      duration: data.duration,
      accessLevel: normalizedAccessLevel,
      targetScope: normalizedScope,
      targetClientId: isClientSpecific ? data.targetClientId : undefined,
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
    let removedTitle = 'Session Video';
    if (index !== -1) {
      const [removed] = db.videos.splice(index, 1);
      removedTitle = removed.title;
    }

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'VIDEO_DELETED',
      targetType: 'video',
      targetId: videoId,
      details: `Removed video "${removedTitle}".`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
