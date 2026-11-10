'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Gauge,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface MuscleCraftVideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

// Helper to extract YouTube video ID
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Helper to extract Vimeo video ID
function getVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:vimeo)\.com(?:\/channels\/(?:\w+\/)?|\/groups\/(?:[^\/]*)\/videos\/|\/(?:album\/(?:\d+)\/video\/|video\/|))(\d+)/);
  return match ? match[1] : null;
}

// Format seconds into MM:SS
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function MuscleCraftVideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  className = '',
  onEnded,
}: MuscleCraftVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check providers
  const cleanSrc = src || '';
  const youtubeId = getYouTubeId(cleanSrc);
  const vimeoId = getVimeoId(cleanSrc);

  // HTML5 Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Handle Autoplay and user interactions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || youtubeId || vimeoId) return;

    if (autoPlay) {
      // Browsers allow autoplay if muted
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [autoPlay, youtubeId, vimeoId, src]);

  // Auto-hide controls when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Playback prevented:', err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const targetTime = parseFloat(e.target.value);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // 1. YouTube Embed Provider
  if (youtubeId) {
    return (
      <div
        className={`relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-crimson-800/40 shadow-2xl ${className}`}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
          title={title || 'MuscleCraft Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  // 2. Vimeo Embed Provider
  if (vimeoId) {
    return (
      <div
        className={`relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-crimson-800/40 shadow-2xl ${className}`}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}&color=ba1a1a&title=0&byline=0`}
          title={title || 'MuscleCraft Video'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  // 3. Native / Cloudflare R2 / S3 HTML5 Video Player
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-crimson-900/40 shadow-2xl group select-none ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
          setIsLoading(false);
          setHasError(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-20">
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/60 border border-white/10">
            <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
            <span className="text-[11px] font-mono text-gray-300">Buffering Workout Stream...</span>
          </div>
        </div>
      )}

      {/* Error Fallback Card */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d12] p-6 text-center z-20">
          <div className="p-3 bg-crimson-950/80 border border-crimson-800/60 rounded-full text-crimson-400 mb-3 shadow-[0_0_15px_rgba(186,26,26,0.4)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="text-white font-bold text-sm sm:text-base">Unable to Stream Video</h4>
          <p className="text-gray-400 text-xs mt-1 max-w-md leading-relaxed">
            The video source could not be played directly by the browser. If this is a private Cloudflare R2 bucket, verify Public Access or download the video directly.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  setIsLoading(true);
                  setHasError(false);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Direct Stream
            </a>
          </div>
        </div>
      )}

      {/* Big Center Play Overlay (when paused) */}
      {!isPlaying && !isLoading && !hasError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/35 cursor-pointer z-10 transition-opacity"
        >
          <button
            type="button"
            aria-label="Play video"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-crimson-600/90 hover:bg-crimson-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(186,26,26,0.6)] transform hover:scale-110 transition-all cursor-pointer border border-white/20"
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
          </button>
        </div>
      )}

      {/* Custom Video Control Bar */}
      {!hasError && (
        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pb-3 pt-8 z-30 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress / Scrub Bar */}
          <div className="relative group/scrub mb-2.5 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Video seek scrubber"
              className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-crimson-500 transition-all"
              style={{
                background: `linear-gradient(to right, #ba1a1a ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-2 text-white text-xs">
            {/* Left Controls: Play, Skips, Timestamp */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* 10s Backward */}
              <button
                type="button"
                onClick={() => skipTime(-10)}
                aria-label="Skip 10 seconds back"
                title="Skip back 10s"
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center gap-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">10</span>
              </button>

              {/* 10s Forward */}
              <button
                type="button"
                onClick={() => skipTime(10)}
                aria-label="Skip 10 seconds forward"
                title="Skip forward 10s"
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center gap-0.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">10</span>
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-1 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume slider"
                  className="w-14 sm:w-18 h-1 bg-white/20 rounded appearance-none accent-crimson-500 cursor-pointer hidden sm:block"
                />
              </div>

              {/* Time display */}
              <div className="font-mono text-[11px] text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Playback Speed, Fullscreen */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Coach Speed Controller (0.5x, 0.75x, 1x, 1.25x, 1.5x) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  aria-label="Playback speed"
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-gray-200 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Gauge className="w-3 h-3 text-crimson-400" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 py-1.5 bg-[#121217] border border-white/15 rounded-xl shadow-2xl flex flex-col min-w-[90px] z-40">
                    <span className="text-[9px] font-mono uppercase text-gray-400 px-3 py-1 font-bold">
                      Coach Speed
                    </span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => changeSpeed(speed)}
                        className={`px-3 py-1 text-left text-xs font-mono transition-colors cursor-pointer ${
                          playbackRate === speed
                            ? 'bg-crimson-600 text-white font-bold'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {speed === 1 ? '1.0x (Normal)' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
