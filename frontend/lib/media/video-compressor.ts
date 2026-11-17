'use client';

import {
  Input,
  Output,
  Conversion,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  MP4,
  QTFF,
  MATROSKA,
  WEBM,
  OGG,
  MPEG_TS,
  Quality,
  canEncodeVideo,
} from 'mediabunny';

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.mov', '.webm', '.mkv', '.ogv', '.ogg', '.ts'] as const;

export const UNIVERSAL_DIRECT_EXTENSIONS = ['.mp4', '.m4v', '.mov', '.webm'] as const;

export const SUPPORTED_VIDEO_ACCEPT = [
  'video/mp4',
  'video/x-m4v',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/ogg',
  'video/mp2t',
  '.mp4',
  '.m4v',
  '.mov',
  '.webm',
  '.mkv',
  '.ogv',
  '.ogg',
  '.ts',
].join(',');

export type CompressionPreset = 'visually_lossless' | 'balanced';

export interface VideoCompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
  savedBytes: number;
  savedPercent: number;
  durationSeconds: number;
  resolution?: string;
  skippedReason?: string;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[idx]}`;
}

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function toEven(n: number): number {
  const rounded = Math.round(n);
  return rounded % 2 === 0 ? Math.max(2, rounded) : Math.max(2, rounded - 1);
}

/**
 * Compresses & normalizes coach videos client-side into faststart H.264 MP4
 * using hardware-accelerated WebCodecs (via Mediabunny) before uploading to Cloudflare R2.
 * Falls back safely to the original file if WebCodecs is unavailable or the file
 * is already optimally compressed.
 */
export async function compressVideoForVault(
  file: File,
  options?: {
    preset?: CompressionPreset;
    onProgress?: (percent: number, stageLabel: string) => void;
  }
): Promise<VideoCompressionResult> {
  const preset: CompressionPreset = options?.preset || 'visually_lossless';
  const onProgress = options?.onProgress;
  const ext = getFileExtension(file.name);
  const originalSize = file.size;

  if (typeof window === 'undefined' || typeof VideoEncoder === 'undefined') {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize,
      savedBytes: 0,
      savedPercent: 0,
      durationSeconds: 0,
      skippedReason: 'WebCodecs hardware video compression is unavailable in this browser; uploading original file.',
    };
  }

  let input: Input | null = null;
  let conversion: Conversion | null = null;

  try {
    onProgress?.(3, 'Inspecting video codec, resolution & bitrate...');

    input = new Input({
      formats: [MP4, QTFF, MATROSKA, WEBM, OGG, MPEG_TS],
      source: new BlobSource(file),
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds: 0,
        skippedReason: 'No video track detected in file; uploading original.',
      };
    }

    const canDecodeInput = await videoTrack.canDecode();
    if (!canDecodeInput) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds: 0,
        skippedReason: `Browser cannot decode input codec (${videoTrack.codec || ext}); uploading original.`,
      };
    }

    const durationSeconds = await videoTrack.computeDuration().catch(() => 0);
    const displayW = await videoTrack.getDisplayWidth();
    const displayH = await videoTrack.getDisplayHeight();
    const packetStats = await videoTrack.computePacketStats(120).catch(() => null);
    const inputCodec = await videoTrack.getCodec();
    const avgBitrate = packetStats?.averageBitrate && Number.isFinite(packetStats.averageBitrate)
      ? packetStats.averageBitrate
      : durationSeconds > 0
      ? (originalSize * 8) / durationSeconds
      : 0;

    // Target parameters by quality preset
    const maxEdgePx = preset === 'balanced' ? 1280 : 1920;
    const qualityScalar = preset === 'balanced' ? 0.58 : 0.76; // 0.76 ~= visually lossless H.264 (CRF ~21)
    const skipThresholdBps = preset === 'balanced' ? 1_400_000 : 2_200_000;

    const longestEdge = Math.max(displayW, displayH);
    const needsResize = longestEdge > maxEdgePx;
    const isUniversalMp4 = (ext === '.mp4' || ext === '.m4v') && inputCodec === 'avc';

    // Smart Pass-Through: skip re-encoding if file is already compact H.264 MP4 within target resolution & bitrate
    if (isUniversalMp4 && !needsResize && (originalSize < 1_500_000 || (avgBitrate > 0 && avgBitrate <= skipThresholdBps))) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds,
        resolution: `${displayW}x${displayH}`,
        skippedReason: `Already compact H.264 MP4 (${displayW}x${displayH}); kept original to avoid re-encoding.`,
      };
    }

    // Compute scaled even dimensions preserving portrait/landscape orientation
    let targetWidth: number | undefined;
    let targetHeight: number | undefined;
    let outW = toEven(displayW);
    let outH = toEven(displayH);

    if (needsResize) {
      const scale = maxEdgePx / longestEdge;
      outW = toEven(displayW * scale);
      outH = toEven(displayH * scale);
      if (displayW >= displayH) {
        targetWidth = outW;
      } else {
        targetHeight = outH;
      }
    }

    const canEncodeH264 = await canEncodeVideo('avc', {
      width: outW,
      height: outH,
      quality: new Quality({ quality: qualityScalar, bitrateMode: 'variable' }),
    });

    if (!canEncodeH264) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds,
        resolution: `${displayW}x${displayH}`,
        skippedReason: 'Device H.264 hardware encoder unavailable; uploading original file.',
      };
    }

    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target,
    });

    conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: {
        codec: 'avc',
        quality: new Quality({ quality: qualityScalar, bitrateMode: 'variable' }),
        forceTranscode: true,
        keyFrameInterval: 2,
        ...(targetWidth ? { width: targetWidth } : {}),
        ...(targetHeight ? { height: targetHeight } : {}),
        ...(packetStats?.averagePacketRate && packetStats.averagePacketRate > 35 ? { frameRate: 30 } : {}),
      },
      audio: {
        // Keep AAC untouched when already compatible; otherwise transcode cleanly at 128 kbps
        quality: new Quality({ bitrate: 128_000, bitrateMode: 'variable' }),
      },
      showWarnings: false,
    });

    if (!conversion.isValid) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds,
        resolution: `${displayW}x${displayH}`,
        skippedReason: 'Stream format requires direct passthrough; uploading original file.',
      };
    }

    conversion.onProgress = (progress) => {
      const pct = Math.max(5, Math.min(99, Math.round(progress * 100)));
      onProgress?.(pct, `Optimizing H.264 MP4 (${outW}×${outH})... ${pct}%`);
    };

    await conversion.execute();

    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds,
        resolution: `${displayW}x${displayH}`,
        skippedReason: 'Compression returned empty buffer; uploading original file.',
      };
    }

    const compressedSize = buffer.byteLength;
    const isAlreadyCompatibleExt = UNIVERSAL_DIRECT_EXTENSIONS.includes(ext as any) && inputCodec === 'avc';

    // Guard against pointless compression on already-efficient files
    if (compressedSize >= originalSize * 0.93 && isAlreadyCompatibleExt) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
        durationSeconds,
        resolution: `${displayW}x${displayH}`,
        skippedReason: 'Original file was already near-optimal size; preserving original quality.',
      };
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const optimizedFile = new File([buffer], `${baseName}.mp4`, {
      type: 'video/mp4',
      lastModified: Date.now(),
    });

    const savedBytes = Math.max(0, originalSize - optimizedFile.size);
    const savedPercent = originalSize > 0 ? Math.max(0, Math.round((savedBytes / originalSize) * 100)) : 0;

    onProgress?.(100, `Optimized: ${formatBytes(originalSize)} → ${formatBytes(optimizedFile.size)} (-${savedPercent}%)`);

    return {
      file: optimizedFile,
      compressed: true,
      originalSize,
      finalSize: optimizedFile.size,
      savedBytes,
      savedPercent,
      durationSeconds,
      resolution: `${outW}×${outH}`,
    };
  } catch (err: any) {
    console.warn('Client video compression fallback to original file:', err);
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize,
      savedBytes: 0,
      savedPercent: 0,
      durationSeconds: 0,
      skippedReason: `Direct upload fallback (${err?.message || 'encoder unsupported for this file'}).`,
    };
  } finally {
    try {
      input?.dispose();
    } catch (_) {}
  }
}
