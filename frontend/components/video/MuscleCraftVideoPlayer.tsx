'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
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
  Pin,
  PinOff,
} from 'lucide-react';

export interface MuscleCraftVideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  dockedControls?: boolean;
  initialPinned?: boolean;
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
  dockedControls = false,
  initialPinned = true,
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
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [audioToast, setAudioToast] = useState<string | null>(null);

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
      // Browsers require autoplay to start muted
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [autoPlay, youtubeId, vimeoId, src]);

  // Auto-hide controls when playing (only if unpinned)
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isPinned && !dockedControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isPinned && !dockedControls) {
      setShowControls(false);
      setShowSpeedMenu(false);
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

  const unmuteAndPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    const targetVol = volume > 0 ? volume : 0.85;
    video.volume = targetVol;
    setVolume(targetVol);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
    setAudioToast(`🔊 Sound ON (${Math.round(targetVol * 100)}%)`);
    setTimeout(() => setAudioToast(null), 2500);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted || volume === 0) {
      unmuteAndPlay();
    } else {
      video.muted = true;
      setIsMuted(true);
      setAudioToast('🔇 Sound Muted');
      setTimeout(() => setAudioToast(null), 2000);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = false;
        }
        setVolume(newVol);
        setIsMuted(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          if (newVol === 0) videoRef.current.muted = true;
        }
        setVolume(newVol);
        setIsMuted(newVol === 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, duration]);

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

  // Renders the bottom control deck (can be docked or overlay)
  const renderControlsDeck = (isDocked: boolean) => (
    <div
      className={`${
        isDocked
          ? 'w-full bg-[#0c0c14] border-t border-white/10 px-4 py-3 z-30 select-none'
          : `absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent backdrop-blur-md px-4 pb-3 pt-8 z-30 transition-opacity duration-300 border-t border-white/[0.04] ${
              isPinned || !isPlaying || showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-white text-xs">
        {/* Left Controls: Play, Skips, Volume Deck, Timestamp */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center justify-center"
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

          {/* Dedicated Sound & Volume Suite (Always Accessible) */}
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? 'Unmute video' : 'Mute video'}
              title={isMuted || volume === 0 ? 'Sound is OFF (Click to Unmute)' : 'Mute Audio'}
              className={`p-1 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                isMuted || volume === 0
                  ? 'bg-crimson-600 text-white shadow-[0_0_12px_rgba(186,26,26,0.8)] animate-pulse'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Volume Slider - Visible on all devices */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume slider"
              className="w-14 sm:w-20 h-1.5 bg-white/20 rounded appearance-none accent-crimson-500 cursor-pointer"
            />

            {/* Numeric Volume Percent */}
            <span className="text-[10.5px] font-mono font-bold text-gray-300 min-w-[28px] text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>

            {/* Quick Status Button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`hidden md:inline-block px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                isMuted || volume === 0
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
              }`}
            >
              {isMuted || volume === 0 ? 'Unmute' : 'Audio On'}
            </button>
          </div>

          {/* Time display */}
          <div className="font-mono text-[11px] text-gray-200 bg-black/60 px-2.5 py-1 rounded-md border border-white/10 shadow-sm select-none flex items-center">
            <span className="font-semibold text-white">{formatTime(currentTime)}</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Pin Controls, Speed, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pin Controls Toggle (Prevents auto-hide) */}
          {!isDocked && (
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              aria-label={isPinned ? 'Unpin controls (auto-hide)' : 'Pin controls permanently'}
              title={isPinned ? 'Controls Pinned (Will not hide)' : 'Auto-hide active (Click to pin)'}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[10px]">{isPinned ? 'Pinned' : 'Auto'}</span>
            </button>
          )}

          {/* Coach Speed Controller */}
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
              <div className="absolute bottom-full right-0 mb-2 py-1.5 bg-[#121217] border border-white/15 rounded-xl shadow-2xl flex flex-col min-w-[110px] z-50">
                <span className="text-[9px] font-mono uppercase text-gray-400 px-3 py-1 font-bold">
                  Coach Speed
                </span>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => changeSpeed(speed)}
                    className={`px-3 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                      playbackRate === speed
                        ? 'bg-crimson-600 text-white font-bold'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{speed === 1 ? '1.0x Normal' : `${speed}x`}</span>
                    {playbackRate === speed && <span className="text-[10px]">✓</span>}
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
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  // 3. Native / Cloudflare R2 / S3 HTML5 Video Player
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full bg-black rounded-2xl overflow-hidden border border-crimson-900/40 shadow-2xl group select-none flex flex-col ${className}`}
    >
      {/* Video Viewport Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
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

        {/* Floating Sound Action Pill (Shown when video is playing or muted) */}
        {(isMuted || volume === 0) && !hasError && !isLoading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unmuteAndPlay();
            }}
            aria-label="Turn on sound"
            title="Click to unmute and enable audio"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-crimson-600/95 hover:bg-crimson-500 text-white text-xs font-bold shadow-[0_0_25px_rgba(186,26,26,0.9)] border border-white/30 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 animate-pulse cursor-pointer"
          >
            <VolumeX className="w-4 h-4 animate-bounce" />
            <span className="tracking-wide uppercase font-mono text-[11px]">Turn On Sound</span>
          </button>
        )}

        {/* Audio Status Floating Notification */}
        {audioToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-black/90 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in duration-200">
            <span>{audioToast}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
            <Loader2 className="w-10 h-10 text-crimson-500 animate-spin mb-2" />
            <span className="text-xs font-mono text-gray-300 tracking-wider">
              STREAMING CLOUDFLARE R2 VAULT...
            </span>
          </div>
        )}

        {/* Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d12]/95 p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Workout Stream Unavailable</h4>
            <p className="text-xs text-gray-400 max-w-sm mb-4">
              Unable to load media directly. The video object may be processing or restricted.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(console.warn);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Stream
              </button>
              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Direct URL
                </a>
              )}
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

        {/* Non-docked overlay controls */}
        {!dockedControls && !hasError && renderControlsDeck(false)}
      </div>

      {/* Docked controls deck (placed below video viewport) */}
      {dockedControls && !hasError && renderControlsDeck(true)}
    </div>
  );
}