import React, { useState, useEffect } from 'react';
import { TrackConfig, NormalizedLyricDoc, LyricLearningItem, VisualizerMode, PlaybackContext } from '../types';
import { audioEngine } from '../services/audioEngine';
import { fetchTrackLyrics, parseDurationToSeconds } from '../services/lyricService';
import { getContextualPlaybackInfo } from '../services/playbackContext';
import { AudioVisualizer } from './AudioVisualizer';
import { SynchronizedLyricsView } from './SynchronizedLyricsView';
import { LearnEnglishLayer } from './LearnEnglishLayer';
import { TrackDetailDrawer } from './TrackDetailDrawer';
import { SpotifyCta } from './SpotifyCta';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

interface ImmersivePlayerProps {
  track: TrackConfig;
  allTracks: TrackConfig[];
  playbackContext?: PlaybackContext | null;
  onBack: () => void;
  onSelectTrack: (track: TrackConfig) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const ImmersivePlayer: React.FC<ImmersivePlayerProps> = ({
  track,
  allTracks,
  playbackContext,
  onBack,
  onSelectTrack,
  onNext,
  onPrev
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<{ message: string; filename: string; url: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPlaybackContext, setCurrentPlaybackContext] = useState<PlaybackContext | null>(
    playbackContext ?? audioEngine.getPlaybackContext()
  );

  useEffect(() => {
    if (playbackContext !== undefined) {
      setCurrentPlaybackContext(playbackContext);
    }
  }, [playbackContext]);

  const [lyrics, setLyrics] = useState<NormalizedLyricDoc | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectral-bars');
  const [showLearningMode, setShowLearningMode] = useState(false);
  const [selectedLearningItem, setSelectedLearningItem] = useState<LyricLearningItem | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Subscribe to persistent audio engine
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setIsLoading(state.isLoading);
      setCurrentTime(state.currentTime);
      setDuration(state.duration);
      setVolume(state.volume);
      setIsMuted(state.isMuted);
      setAudioError(state.audioError);
      if (state.playbackContext) {
        setCurrentPlaybackContext(state.playbackContext);
      }
    });

    return unsubscribe;
  }, []);

  const contextInfo = getContextualPlaybackInfo(currentPlaybackContext);

  // Fetch dynamic lyrics whenever track changes
  useEffect(() => {
    let isMounted = true;
    setImgLoaded(false);
    setImgError(false);
    const trackSecs = parseDurationToSeconds(track.duration, 240);
    fetchTrackLyrics(track.slug, trackSecs, track.lyrics).then((doc) => {
      if (isMounted) {
        setLyrics(doc);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [track.slug, track.lyrics]);

  const currentIndex = allTracks.findIndex((t) => t.id === track.id);

  const handleNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    const nextIdx = (currentIndex + 1) % allTracks.length;
    onSelectTrack(allTracks[nextIdx]);
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
      return;
    }
    const prevIdx = (currentIndex - 1 + allTracks.length) % allTracks.length;
    onSelectTrack(allTracks[prevIdx]);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  const handleScrubberSeek = (ratio: number) => {
    const target = ratio * duration;
    setCurrentTime(target);
    audioEngine.seek(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playbackRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col relative overflow-hidden font-sans-clean select-none transition-colors duration-300">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 md:px-16 py-6 flex justify-between items-center bg-[var(--bg-main)]/85 backdrop-blur-md border-b hairline-border">
        {/* Back to collection */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-xs uppercase tracking-widest font-sans-clean font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>BACK TO COLLECTION</span>
        </button>

        {/* Center Pill / Mode Indicator */}
        <div className="hidden md:flex items-center gap-2.5 text-[11px] font-sans-clean uppercase tracking-widest text-[var(--text-secondary)]">
          <span className="px-2.5 py-0.5 border hairline-border bg-[var(--bg-chip)] text-[var(--text-primary)] font-mono">
            EXHIBIT {track.number} OF {String(allTracks.length).padStart(2, '0')}
          </span>

          {/* Subtle Contextual Indication Pill */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border hairline-border bg-[var(--bg-chip)] text-[var(--text-muted)] text-[10px] tracking-wider font-mono select-none"
            title={contextInfo.nextTrackTitle ? `Next: ${contextInfo.nextTrackTitle}` : undefined}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                contextInfo.mode === 'contextual'
                  ? 'bg-[var(--accent-primary)]'
                  : 'bg-[var(--text-muted)]/50'
              }`}
            />
            <span className="text-[var(--text-primary)] font-semibold">{contextInfo.badge}</span>
            <span className="opacity-40">·</span>
            <span>{contextInfo.statusText}</span>
          </span>

          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 border border-[var(--accent-primary)]/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
              <span>LOADING AUDIO SOURCE</span>
            </span>
          )}
        </div>

        {/* Trailing action: Catalog Notes & Spotify */}
        <div className="flex items-center gap-3 text-xs tracking-widest font-sans-clean text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={() => setShowDetailDrawer(!showDetailDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 transition-all text-[11px] uppercase border cursor-pointer select-none ${
              showDetailDrawer
                ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-semibold shadow-sm'
                : 'border hairline-border text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-[var(--bg-chip)]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showDetailDrawer ? 'VIEW LYRICS' : 'CATALOG NOTES'}</span>
          </button>
          <span className="opacity-30 select-none">|</span>
          <SpotifyCta
            spotifyUrl={track.spotifyUrl}
            trackTitle={track.title}
            variant="top-nav"
          />
        </div>
      </header>

      {/* Main Exhibition Stage: 42% Artwork/Visualizer + 58% Lyrics or Full Notes */}
      <main className="flex-1 w-full flex flex-col md:flex-row pt-20 md:pt-24 pb-32 md:pb-36 px-6 md:px-16 max-w-7xl mx-auto items-stretch gap-8 md:gap-12 min-h-0">
        {/* Left Column: Framed Artwork & Compact Disc Visualizer (42% width) */}
        <section className="w-full md:w-[42%] flex flex-col justify-center items-center relative">
          <div className="w-full max-w-md flex flex-col items-center">
            {/* 1:1 Square Frosted Glass Outer Enclosure with Museum Treatment */}
            <div
              className={`w-full aspect-square relative p-6 sm:p-8 bg-[var(--bg-surface)] backdrop-blur-xl border shadow-2xl transition-all duration-500 flex items-center justify-center overflow-hidden ${
                showDetailDrawer
                  ? 'border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/20'
                  : 'hairline-border hover:border-[var(--accent-primary)]/50'
              }`}
            >
              {/* LAYER 1: Subtle Grid Background / Ambient Field */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(140,142,88,0.06)_0%,transparent_70%)] pointer-events-none" />

              {/* LAYER 2 & 5: Rotating Compact Disc / Optical Object Graphic */}
              <div
                className="w-full h-full relative flex items-center justify-center animate-cd-spin transition-transform duration-700"
                style={{
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              >
                {/* Optical Disc Outer Rim & Grooves */}
                <div className="absolute inset-0 rounded-full border hairline-border bg-[#121310] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
                  {/* Subtle iridescent radial sheen */}
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(241,234,138,0.04)_60deg,transparent_120deg,rgba(201,220,233,0.06)_180deg,transparent_240deg,rgba(100,102,49,0.05)_300deg,transparent_360deg)]" />

                  {/* Concentric Grooves */}
                  <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-5 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-8 rounded-full border border-dashed border-white/10 pointer-events-none" />
                  <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-16 rounded-full border border-white/5 pointer-events-none" />
                </div>

                {/* LAYER 3: 1:1 Circular Featured Artwork (Inner Core) */}
                <div className="relative w-[62%] h-[62%] rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-black/70 z-10 flex items-center justify-center">
                  {!imgError ? (
                    <img
                      key={track.slug}
                      src={track.artwork}
                      alt={track.title}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => {
                        console.error('[ARTWORK LOAD FAILED]', track.slug, track.artwork);
                        setImgError(true);
                      }}
                      className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    /* Subtle Exhibition Artwork Fallback */
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[var(--bg-chip)] text-[var(--text-secondary)]">
                      <div className="w-8 h-8 rounded-full border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[10px] mb-1">
                        {track.number}
                      </div>
                      <span className="font-serif-editorial text-xs text-[var(--text-primary)] leading-tight line-clamp-2">
                        {track.title}
                      </span>
                      <span className="text-[8px] font-mono tracking-widest text-[var(--text-muted)] mt-1 uppercase">
                        EXHIBIT ARCHIVE
                      </span>
                    </div>
                  )}

                  {/* Center Spindle Hole / Optical Hub */}
                  <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-[#10110E] border-2 border-white/30 shadow-[inset_0_0_8px_rgba(0,0,0,0.9)] flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-[#1A1C16] border border-white/20" />
                  </div>
                </div>
              </div>

              {/* LAYER 4: Frosted Glass Overlay Ring / Museum Casing */}
              <div className="absolute inset-3 sm:inset-4 rounded-full border border-white/10 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]" />

              {/* Exhibition Badge */}
              <div className="absolute bottom-3 left-4 text-[9px] font-mono tracking-widest text-[var(--text-primary)] bg-[var(--bg-main)]/90 backdrop-blur-md px-2.5 py-1 border hairline-border z-20">
                ARTIFACT_{track.number}.CD
              </div>

              {/* Live Status Indicator */}
              {isPlaying && (
                <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] text-[9px] font-mono px-2 py-0.5 tracking-wider uppercase font-semibold z-20 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  <span>LIVE</span>
                </div>
              )}
            </div>

            {/* Sub-Artwork Quick Controls: Visualizer Modes & Catalog Notes */}
            <div className="w-full flex justify-between items-center mt-4 text-[11px] font-sans-clean text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-[var(--accent-primary)] font-bold mr-1">
                  VISUALIZER:
                </span>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('spectral-bars')}
                  className={`px-2.5 py-1 text-[10px] uppercase border transition-all cursor-pointer select-none ${
                    visualizerMode === 'spectral-bars'
                      ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-semibold shadow-sm'
                      : 'border hairline-border text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-[var(--bg-chip)]'
                  }`}
                >
                  Spectral
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('fine-frequencies')}
                  className={`px-2.5 py-1 text-[10px] uppercase border transition-all cursor-pointer select-none ${
                    visualizerMode === 'fine-frequencies'
                      ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-semibold shadow-sm'
                      : 'border hairline-border text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-[var(--bg-chip)]'
                  }`}
                >
                  Waves
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailDrawer(!showDetailDrawer)}
                className="text-[10px] uppercase tracking-wider text-[var(--accent-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-semibold px-2 py-1 border hairline-border bg-[var(--bg-chip)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer select-none"
              >
                <span>{showDetailDrawer ? 'View Lyrics' : 'Full Notes'}</span>
                <Info className="w-3 h-3" />
              </button>
            </div>

            {/* Featured Artwork Secondary Spotify CTA: Non-obstructive placement */}
            <div className="w-full flex justify-center items-center mt-3 pt-3 border-t hairline-border">
              <SpotifyCta
                spotifyUrl={track.spotifyUrl}
                trackTitle={track.title}
                variant="featured-cover"
                className="w-full justify-center"
              />
            </div>
          </div>
        </section>

        {/* Right Column: Title, Metadata Cluster & Synchronized Lyrics or Full Catalog Notes (58% width) */}
        <section className="w-full md:w-[58%] flex flex-col relative md:border-l hairline-border md:pl-10 min-h-[580px] md:min-h-[640px] h-[calc(100vh-190px)] max-h-[960px]">
          {showDetailDrawer ? (
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <TrackDetailDrawer
                track={track}
                onClose={() => setShowDetailDrawer(false)}
              />
            </div>
          ) : (
            <>
              {/* Metadata Cluster */}
              <div className="flex justify-between items-start mb-3 shrink-0">
                <div>
                  <div className="md:hidden flex items-center gap-1.5 mb-1.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] select-none">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contextInfo.mode === 'contextual'
                          ? 'bg-[var(--accent-primary)]'
                          : 'bg-[var(--text-muted)]/50'
                      }`}
                    />
                    <span className="text-[var(--text-primary)] font-semibold">{contextInfo.badge}</span>
                    <span className="opacity-30">·</span>
                    <span>{contextInfo.statusText}</span>
                  </div>
                  <h1 className="font-heading-jost text-3xl md:text-5xl text-[var(--text-primary)] tracking-tight leading-tight">
                    {track.title}
                  </h1>
                  {track.subtitle && (
                    <p className="font-subtitle-outfit text-[var(--accent-primary)] text-base md:text-lg mt-1.5">
                      {track.subtitle}
                    </p>
                  )}
                </div>

                {/* Top Right Label Block */}
                <div className="text-right flex flex-col items-end gap-1 font-sans-clean text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <div className="border hairline-border px-3 py-1 font-mono text-xs text-[var(--text-primary)] font-semibold bg-[var(--bg-chip)]">
                    {track.number}/{String(allTracks.length).padStart(2, '0')}
                  </div>
                  {(track.genre?.[0] || track.concept || track.contentType) && (
                    <div className="text-[var(--accent-primary)] font-semibold">
                      {track.genre?.[0] || track.concept || track.contentType}
                    </div>
                  )}
                  {(track.bpm || track.tempo) && (
                    <div className="opacity-70 font-mono text-[var(--text-secondary)]">
                      {track.bpm || track.tempo} BPM
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Load Error Banner (if error occurred) */}
              {audioError && (
                <div className="w-full bg-[#2A1515] border border-red-500/50 text-[#F5F3EC] p-3.5 mb-3 flex items-center justify-between gap-4 text-xs font-mono shrink-0">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-red-400 font-bold uppercase tracking-wider text-[11px]">
                        AUDIO LOAD ERROR
                      </span>
                    </div>
                    <span className="text-white/90 text-[11px] truncate">{audioError.filename}</span>
                    <span className="text-[#A5A396] text-[10px]">{audioError.message}</span>
                  </div>
                  <button
                    onClick={() => audioEngine.retryCurrentTrack()}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 uppercase tracking-widest text-[10px] font-sans-clean font-semibold transition-colors shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Synchronized Bilingual Lyrics Canvas — Dedicated Tall Viewport */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <SynchronizedLyricsView
                  lyrics={lyrics}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  track={track}
                  showLearningMode={showLearningMode}
                  onToggleLearningMode={() => setShowLearningMode(!showLearningMode)}
                  onSelectLearningItem={(item) => setSelectedLearningItem(item)}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {/* Fixed Bottom Exhibition Audio Controller & Spectral Waveform */}
      <footer className="fixed bottom-0 left-0 w-full bg-[var(--player-bar-bg)] backdrop-blur-xl border-t hairline-border z-50 shadow-2xl transition-all duration-300">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 pt-2 sm:pt-2.5 pb-3 sm:pb-3.5 flex flex-col gap-2 sm:gap-2.5">
          {/* Row 1: Full-Width Progress / Visualizer Row (24px horizontal boundaries) */}
          <div className="w-full relative group border hairline-border overflow-hidden bg-[var(--bg-surface)]/60">
            <AudioVisualizer
              mode={visualizerMode}
              height={36}
              accentColor="currentColor"
              interactive={true}
              onSeek={handleScrubberSeek}
              playbackRatio={playbackRatio}
              className="w-full cursor-pointer"
            />

            {/* Precision Scrubber Line */}
            <div
              className="w-full h-[2px] bg-white/10 relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                handleScrubberSeek(ratio);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-[var(--accent-primary)] transition-all duration-100 ease-linear"
                style={{ width: `${playbackRatio * 100}%` }}
              />
              {/* Playhead Diamond */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[var(--accent-highlight)] border border-[#10110E] shadow-md pointer-events-none -ml-1.5"
                style={{ left: `${playbackRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Row 2: Information & Controls Row */}
          <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-2 sm:gap-4 md:gap-6 w-full min-w-0">
            {/* LEFT: Time + Playback Context (Unclipped, generous line-height, wraps gracefully) */}
            <div className="flex flex-col justify-center min-w-0 flex-1 md:flex-initial py-0.5">
              <div className="font-mono text-xs sm:text-[13px] tabular-nums tracking-wider text-[var(--text-secondary)] leading-normal">
                {formatTime(currentTime)} <span className="opacity-30">/</span> {formatTime(duration)}
              </div>
              <div
                className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-muted)] leading-relaxed select-none"
                title={contextInfo.nextTrackTitle ? `Next in queue: ${contextInfo.nextTrackTitle}` : undefined}
              >
                <div className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      contextInfo.mode === 'contextual'
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-[var(--text-muted)]/60'
                    }`}
                  />
                  <span
                    className={`font-semibold tracking-wider shrink-0 ${
                      contextInfo.mode === 'contextual'
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {contextInfo.badge}
                  </span>
                  <span className="opacity-30 select-none shrink-0">·</span>
                  <span className="text-[var(--text-secondary)]">
                    {contextInfo.statusText}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTER: Player Controls (Centered & Visually Dominant Play/Pause) */}
            <div className="flex items-center justify-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-5 md:gap-7">
                <button
                  onClick={handlePrev}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1.5 sm:p-2 rounded-sm"
                  title="Previous Track"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Circular Dominant Play/Pause Button */}
                <button
                  onClick={() => audioEngine.togglePlay()}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border hairline-border rounded-full hover:bg-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] transition-all duration-300 group shadow-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-90" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 fill-current transition-transform group-hover:scale-95 text-inherit" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1.5 sm:p-2 rounded-sm"
                  title="Next Track"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* RIGHT: Volume & Secondary Actions & Immersive Player Action */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 shrink-0 text-[var(--text-secondary)]">
              {/* Volume Control */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => audioEngine.toggleMute()}
                  className="p-1 hover:text-[var(--accent-primary)] transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => audioEngine.setVolume(parseFloat(e.target.value))}
                  className="w-14 md:w-20 h-1 bg-white/20 accent-[var(--accent-primary)] cursor-pointer"
                  title="Volume"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Catalog Notes Toggle Button */}
              <button
                onClick={() => setShowDetailDrawer(!showDetailDrawer)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border hairline-border transition-colors text-[10px] sm:text-xs uppercase tracking-widest font-semibold shrink-0 select-none ${
                  showDetailDrawer
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/15'
                    : 'bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]'
                }`}
                title="Toggle Exhibition Catalog Notes"
                aria-label="Toggle Exhibition Catalog Notes"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">NOTES</span>
              </button>

              {/* Immersive Player / Exhibition Return Action */}
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[var(--bg-chip)] border hairline-border text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] hover:border-[var(--accent-primary)] transition-colors text-[10px] sm:text-xs uppercase tracking-widest font-semibold shrink-0 select-none shadow-sm"
                title="Return to Exhibition Gallery"
                aria-label="Return to Exhibition Gallery"
              >
                <span className="hidden sm:inline">IMMERSIVE PLAYER</span>
                <Maximize2 className="w-3.5 h-3.5 shrink-0 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Linguistic "Learn English" Annotation Modal */}
      <LearnEnglishLayer
        item={selectedLearningItem}
        onClose={() => setSelectedLearningItem(null)}
      />
    </div>
  );
};
