import React from 'react';
import { TrackConfig } from '../types';
import { Play, Radio, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentTrack: TrackConfig | null;
  isPlaying: boolean;
  onOpenPlayer: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTrack,
  isPlaying,
  onOpenPlayer,
  activeSection,
  onNavigate,
  theme,
  onToggleTheme
}) => {
  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-[var(--bg-surface-translucent)] backdrop-blur-xl border-b hairline-border py-4 transition-all duration-300">
      <div className="editorial-container flex justify-between items-center">
        {/* Brand / Logo */}
      <button
        onClick={() => onNavigate('intro')}
        className="text-left font-heading-jost text-xl md:text-2xl text-[var(--text-primary)] tracking-tight hover:opacity-80 transition-opacity font-semibold"
      >
        SONOVERSE
      </button>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-[11px] font-sans-clean tracking-widest uppercase text-[var(--text-secondary)]">
        <button
          onClick={() => onNavigate('intro')}
          className={`pb-0.5 border-b transition-colors ${
            activeSection === 'intro'
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
        >
          INTRO
        </button>
        <button
          onClick={() => onNavigate('collection')}
          className={`pb-0.5 border-b transition-colors ${
            activeSection === 'collection'
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
        >
          THE COLLECTION
        </button>
        <button
          onClick={() => onNavigate('closing')}
          className={`pb-0.5 border-b transition-colors ${
            activeSection === 'closing'
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
        >
          ARCHIVE INDEX
        </button>
      </div>

      {/* Trailing Controls: Active Song Pill & Dark/Light Switch */}
      <div className="flex items-center gap-3">
        {currentTrack && (
          <button
            onClick={onOpenPlayer}
            className="group flex items-center gap-2.5 px-3.5 py-1.5 border hairline-border bg-[var(--bg-chip)] hover:bg-[var(--accent-primary)] hover:text-[#10110E] hover:border-[var(--accent-primary)] transition-all duration-300 text-xs font-sans-clean shadow-sm"
            title="Open Immersive Visualizer & Synchronized Lyrics"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] group-hover:bg-[#10110E] animate-pulse"></span>
            <span className="font-mono text-[10px] text-[var(--accent-primary)] group-hover:text-[#10110E] font-semibold">
              {currentTrack.number}
            </span>
            <span className="font-medium tracking-tight truncate max-w-[130px] sm:max-w-[200px] text-[var(--text-primary)] group-hover:text-[#10110E]">
              {currentTrack.title}
            </span>
            {isPlaying ? (
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-primary)] group-hover:text-[#10110E] flex items-center gap-1">
                <Radio className="w-3 h-3 animate-spin" />
              </span>
            ) : (
              <Play className="w-3 h-3 text-[var(--accent-primary)] group-hover:text-[#10110E]" />
            )}
          </button>
        )}

        {/* Theme Toggle Switch: Dark Mode / Light Mode */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="relative z-50 pointer-events-auto flex items-center gap-2 px-3 py-1.5 border hairline-border bg-[var(--bg-chip)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] transition-all duration-200 text-xs font-sans-clean cursor-pointer select-none group"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-[var(--accent-secondary)] transition-transform duration-200 group-hover:-rotate-12" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[var(--accent-primary)] transition-transform duration-200 group-hover:rotate-45" />
          )}

          {/* Compact Horizontal Toggle Switch Pill */}
          <div
            aria-hidden="true"
            className="relative w-8 h-4 rounded-full border hairline-border bg-[var(--bg-surface)] p-0.5 flex items-center transition-colors"
          >
            <div
              className={`w-3 h-3 rounded-full bg-[var(--accent-primary)] transition-all duration-200 ease-out ${
                theme === 'dark' ? 'translate-x-0' : 'translate-x-3.5'
              }`}
            />
          </div>

          <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-secondary)] font-medium">
            {theme === 'dark' ? 'DARK' : 'LIGHT'}
          </span>
        </button>
      </div>
      </div>
    </nav>
  );
};
