import React from 'react';
import { TrackConfig, PlayTrackOptions } from '../types';
import { Play, Sparkles, ArrowDown } from 'lucide-react';

interface HeroCoverProps {
  tracks: TrackConfig[];
  onPlayTrack: (track: TrackConfig, options?: PlayTrackOptions) => void;
  onExploreCollection: () => void;
}

export const HeroCover: React.FC<HeroCoverProps> = ({
  tracks,
  onPlayTrack,
  onExploreCollection
}) => {
  const featuredTrack = tracks[0];

  return (
    <section
      id="intro"
      className="relative min-h-[92vh] w-full pt-28 sm:pt-32 pb-16 sm:pb-20 border-b hairline-border overflow-hidden bg-[var(--bg-main)] transition-colors duration-300 flex flex-col justify-between"
    >
      <div className="editorial-container flex flex-col justify-between flex-1 w-full relative z-10">
        {/* Editorial Watermark / Coordinates */}
        <div className="absolute top-0 right-0 text-right font-sans-clean text-[10px] uppercase tracking-widest text-[var(--text-muted)] space-y-1 select-none pointer-events-none hidden sm:block">
          <div className="border hairline-border px-2.5 py-0.5 inline-block font-mono text-[var(--text-primary)] bg-[var(--bg-chip)]">
            ARCHIVE REF: SV-2026-VI
          </div>
          <div>AI MUSIC ARCHIVE / HANOI & GLOBAL</div>
          <div className="opacity-60">LATENT HARMONIC EXPLORATION</div>
        </div>

        {/* Main Editorial Hero Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start my-auto z-10 py-6 lg:py-10">
          {/* Left Headline & Philosophy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 w-full max-w-4xl xl:max-w-5xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[11px] font-sans-clean tracking-widest uppercase text-[var(--accent-primary)] font-semibold border-b border-[var(--accent-primary)]/40 pb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AN AI MUSIC COLLECTION / 2026</span>
            </div>

            {/* Primary Exhibition Display Headline */}
            <h1 className="font-heading-jost text-5xl sm:text-7xl lg:text-8xl xl:text-[96px] 2xl:text-[104px] leading-[0.93] tracking-tight text-[var(--text-primary)]">
              COLLECTED<br />
              <span className="font-normal text-[var(--text-heading-sub)]">SOUNDS.</span>
            </h1>

            {/* Supporting Poetic Manifesto */}
            <div className="space-y-3 font-sans-clean max-w-xl lg:max-w-2xl xl:max-w-3xl text-[var(--text-secondary)]">
              <p className="font-subtitle-outfit text-xl sm:text-2xl xl:text-3xl text-[var(--text-primary)] font-normal leading-snug">
                Six songs. Six states of mind. One collection of machine-assisted imagination.
              </p>
              <p className="text-sm sm:text-[15px] xl:text-base leading-relaxed pt-2 text-[var(--text-secondary)]">
                An experimental digital music exhibition presenting six original AI-assisted songs.
                Traversing glitch pop, ethereal ambient sanctuaries, hyperpop digital traps, and intimate Vietnamese spoken-word reflections.
              </p>
            </div>

            {/* Direct CTA Affordances */}
            <div className="flex flex-wrap items-center gap-4 pt-2 sm:pt-4 font-sans-clean">
              <button
                onClick={() =>
                  onPlayTrack(featuredTrack, {
                    source: 'hero',
                    sourceType: 'CATALOG',
                    activeFilters: {},
                    activeSort: 'default',
                    queue: tracks,
                  })
                }
                className="group flex items-center gap-3 px-6 py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 transition-all duration-300 shadow-md font-semibold cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                <span className="text-xs uppercase tracking-widest font-semibold">
                  BEGIN EXHIBITION (01 / {featuredTrack.title})
                </span>
              </button>

              <button
                onClick={onExploreCollection}
                className="flex items-center gap-2 px-5 py-3.5 border hairline-border text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors text-xs uppercase tracking-widest font-medium bg-[var(--bg-chip)] cursor-pointer"
              >
                <span>EXPLORE ALL 6 ARTIFACTS</span>
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Floating Gallery Composition (5 cols) */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center mt-8 lg:mt-0">
            <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
              {/* Primary Framed Artwork (01 Cốt Cách 5.0) */}
              <div
                onClick={() => onPlayTrack(featuredTrack)}
                className="group cursor-pointer relative border hairline-border p-3 sm:p-4 bg-[var(--bg-surface)] shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent-primary)]"
              >
                <div className="w-full aspect-[4/5] overflow-hidden bg-black/40 relative">
                  <img
                    src={featuredTrack.artwork}
                    alt={featuredTrack.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[var(--accent-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 bg-[var(--bg-main)]/90 text-[var(--text-primary)] text-[10px] font-mono px-2 py-1 uppercase tracking-widest border hairline-border">
                    PLAY ARTIFACT 01
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-3 font-sans-clean">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--accent-primary)] font-semibold block">01 / {String(tracks.length).padStart(2, '0')}</span>
                    <h3 className="font-heading-jost text-lg sm:text-xl text-[var(--text-primary)] font-medium">{featuredTrack.title}</h3>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-mono">{featuredTrack.genre?.[0] || featuredTrack.contentType || 'SONG'}</span>
                </div>
              </div>

              {/* Secondary Floating Offset Accent Frame (02 Utopia preview) */}
              {tracks[1] && (
                <div
                  onClick={() => onPlayTrack(tracks[1])}
                  className="hidden sm:block absolute -bottom-10 -right-6 lg:-right-8 w-44 lg:w-52 border hairline-border p-2 bg-[var(--bg-surface)] shadow-2xl cursor-pointer hover:border-[var(--accent-primary)] transition-all hover:scale-105"
                >
                  <div className="w-full aspect-square overflow-hidden bg-black/40">
                    <img
                      src={tracks[1].artwork}
                      alt={tracks[1].title}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                  <div className="pt-1.5 flex justify-between items-center text-[9px] font-sans-clean uppercase tracking-wider">
                    <span className="font-mono text-[var(--accent-primary)] font-semibold">02 {tracks[1].title}</span>
                    <span className="text-[var(--text-secondary)]">{tracks[1].mood?.[0] || tracks[1].genre?.[0] || ''}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Footnote Indicator Bar */}
        <div className="w-full pt-10 sm:pt-12 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-sans-clean uppercase tracking-widest text-[var(--text-muted)] border-t hairline-border gap-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[var(--text-primary)] font-semibold">01 / {String(tracks.length).padStart(2, '0')} TRACKS</span>
            <span className="opacity-40">•</span>
            <span>BILINGUAL SYNCHRONIZED POETRY</span>
            <span className="opacity-40">•</span>
            <span>NEURAL HARMONICS</span>
          </div>

          <button
            onClick={onExploreCollection}
            className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors text-[10px] uppercase tracking-widest text-[var(--text-secondary)] cursor-pointer"
          >
            <span>SCROLL TO EXPLORE EXHIBITION</span>
            <ArrowDown className="w-3 h-3 text-[var(--accent-primary)] animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
