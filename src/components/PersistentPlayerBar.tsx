import React, { useState, useEffect } from 'react';
import { TrackConfig, PlaybackContext } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { audioEngine } from '../services/audioEngine';
import { getContextualPlaybackInfo } from '../services/playbackContext';

interface PersistentPlayerBarProps {
  track: TrackConfig | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackContext?: PlaybackContext | null;
  onOpenPlayer: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const PersistentPlayerBar: React.FC<PersistentPlayerBarProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  playbackContext,
  onOpenPlayer,
  onNext,
  onPrev
}) => {
  if (!track) return null;

  const [volume, setVolume] = useState(audioEngine.getState().volume);
  const [isMuted, setIsMuted] = useState(audioEngine.getState().isMuted);

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setVolume(state.volume);
      setIsMuted(state.isMuted);
    });
    return unsubscribe;
  }, []);

  const activeContext = playbackContext ?? audioEngine.getPlaybackContext();
  const contextInfo = getContextualPlaybackInfo(activeContext);

  const playbackRatio = duration > 0 ? currentTime / duration : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <aside
      aria-label="Audio Playback Bar"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-4rem)] max-w-[1700px] z-30 bg-[var(--player-bar-bg)] backdrop-blur-xl border hairline-border shadow-2xl px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 font-sans-clean select-none text-[var(--text-primary)] overflow-hidden"
    >
      {/* Micro Progress Bar across top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[var(--hairline-color)]/20 overflow-hidden">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-150 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, playbackRatio * 100))}%` }}
        />
      </div>

      {/* Single Cohesive Horizontal Control Surface */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full min-w-0">
        {/* 1. Track Information (Flexible Width) */}
        <div
          onClick={onOpenPlayer}
          className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer group"
          title="Click to open immersive player"
        >
          {/* Artwork Thumbnail */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 border hairline-border shrink-0 bg-[var(--bg-chip)] overflow-hidden relative flex items-center justify-center">
            <img
              src={track.artwork}
              alt={track.title}
              onError={(e) => {
                console.error('[ARTWORK LOAD FAILED]', track.slug, track.artwork);
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-[var(--accent-primary)]/30 flex items-center justify-center pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-highlight)] animate-ping"></span>
              </div>
            )}
          </div>

          {/* Two-line Information Hierarchy */}
          <div className="min-w-0 flex-1">
            {/* Line 1: Track Number & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] sm:text-[11px] text-[var(--accent-primary)] font-semibold shrink-0">
                {track.number}
              </span>
              <h4 className="font-heading-jost text-sm sm:text-base text-[var(--text-primary)] font-medium truncate group-hover:text-[var(--accent-primary)] transition-colors">
                {track.title}
              </h4>
            </div>

            {/* Line 2: Subtitle + Contextual Playback Indicator (Never vertically clipped) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs leading-normal py-0.5">
              {track.subtitle && (
                <>
                  <span className="font-subtitle-outfit text-[11px] sm:text-xs text-[var(--text-secondary)] truncate shrink-0 hidden sm:inline-block max-w-[100px] md:max-w-[160px] xl:max-w-[240px]">
                    {track.subtitle}
                  </span>
                  <span className="opacity-25 text-xs select-none shrink-0 hidden sm:inline-block">|</span>
                </>
              )}
              {/* Subtle Contextual Indication */}
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-wider uppercase text-[var(--text-muted)] min-w-0 shrink select-none"
                title={contextInfo.nextTrackTitle ? `Next: ${contextInfo.nextTrackTitle}` : undefined}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    contextInfo.mode === 'contextual'
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--text-muted)]/60'
                  }`}
                />
                <span className="text-[var(--text-primary)] font-semibold shrink-0 whitespace-nowrap">
                  {contextInfo.badge}
                </span>
                <span className="opacity-40 shrink-0">·</span>
                <span className="truncate text-[var(--text-secondary)] whitespace-nowrap">
                  {contextInfo.statusText}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Visualizer (Controlled Responsive Width) */}
        <div className="hidden sm:block w-20 md:w-28 lg:w-36 xl:w-44 h-7 sm:h-8 shrink-0">
          <AudioVisualizer
            mode="spectral-bars"
            height={30}
            accentColor="currentColor"
            playbackRatio={playbackRatio}
          />
        </div>

        {/* 3. Player Transport Controls (Grouped Together) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={onPrev}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1.5 rounded-sm"
              title="Previous Track"
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => audioEngine.togglePlay()}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border hairline-border rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 transition-opacity shadow-md shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1.5 rounded-sm"
              title="Next Track"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block font-mono text-[10px] sm:text-[11px] tabular-nums text-[var(--text-muted)] tracking-wider whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 4. Secondary Actions & Immersive Player (Compact Grouped Cluster) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-1.5 text-[var(--text-secondary)]">
            <button
              onClick={() => audioEngine.toggleMute()}
              className="p-1 hover:text-[var(--accent-primary)] transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => audioEngine.setVolume(parseFloat(e.target.value))}
              className="w-14 xl:w-16 h-1 bg-[var(--text-muted)]/20 accent-[var(--accent-primary)] cursor-pointer"
              title="Volume"
              aria-label="Volume Slider"
            />
          </div>

          {/* Immersive Player Action */}
          <button
            onClick={onOpenPlayer}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[var(--bg-chip)] border hairline-border text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] hover:border-[var(--accent-primary)] transition-colors text-[10px] sm:text-xs uppercase tracking-widest font-semibold shrink-0 whitespace-nowrap shadow-sm"
            title="Open Immersive Player"
          >
            <span className="hidden sm:inline">IMMERSIVE PLAYER</span>
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
};

