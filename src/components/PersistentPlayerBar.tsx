import React from 'react';
import { TrackConfig } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { audioEngine } from '../services/audioEngine';

interface PersistentPlayerBarProps {
  track: TrackConfig | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onOpenPlayer: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const PersistentPlayerBar: React.FC<PersistentPlayerBarProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onOpenPlayer,
  onNext,
  onPrev
}) => {
  if (!track) return null;

  const playbackRatio = duration > 0 ? currentTime / duration : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <aside aria-label="Audio Playback Bar" className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-[1700px] z-30 bg-[var(--player-bar-bg)] backdrop-blur-xl border hairline-border shadow-2xl p-3 sm:px-6 sm:py-3 transition-all duration-300 font-sans-clean select-none text-[var(--text-primary)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Artwork & Metadata */}
        <div
          onClick={onOpenPlayer}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-11 h-11 border hairline-border shrink-0 bg-[var(--bg-chip)] overflow-hidden relative flex items-center justify-center">
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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[var(--accent-primary)] font-semibold">
                {track.number}
              </span>
              <h4 className="font-heading-jost text-sm sm:text-base text-[var(--text-primary)] font-medium truncate group-hover:text-[var(--accent-primary)] transition-colors">
                {track.title}
              </h4>
            </div>
            <p className="font-subtitle-outfit text-xs text-[var(--text-secondary)] truncate hidden sm:block">
              {track.subtitle || track.concept}
            </p>
          </div>
        </div>

        {/* Center: Live Waveform & Transport */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="hidden lg:block w-40 h-8">
            <AudioVisualizer
              mode="spectral-bars"
              height={32}
              accentColor="currentColor"
              playbackRatio={playbackRatio}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onPrev}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => audioEngine.togglePlay()}
              className="w-9 h-9 flex items-center justify-center border hairline-border rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 transition-opacity shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Right: Expand to Immersive Mode */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPlayer}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-chip)] border hairline-border text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] hover:border-[var(--accent-primary)] transition-colors text-xs uppercase tracking-widest font-semibold"
          >
            <span className="hidden sm:inline">IMMERSIVE PLAYER</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
