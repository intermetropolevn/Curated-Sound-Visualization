import React, { useState, useEffect, useRef } from 'react';
import { TRACK_REGISTRY } from './config/tracks';
import { TrackConfig, PlayTrackOptions, PlaybackContext } from './types';
import { audioEngine } from './services/audioEngine';
import {
  createPlaybackContext,
  updatePlaybackContextTrack,
} from './services/playbackContext';
import { Header } from './components/Header';
import { HeroCover } from './components/HeroCover';
import { CollectionGallery } from './components/CollectionGallery';
import { ClosingIndex } from './components/ClosingIndex';
import { ImmersivePlayer } from './components/ImmersivePlayer';
import { PersistentPlayerBar } from './components/PersistentPlayerBar';

export default function App() {
  const [tracks] = useState<TrackConfig[]>(TRACK_REGISTRY);
  const [currentTrack, setCurrentTrack] = useState<TrackConfig | null>(TRACK_REGISTRY[0]);
  const [playbackContext, setPlaybackContext] = useState<PlaybackContext | null>(() => {
    return createPlaybackContext(
      TRACK_REGISTRY[0],
      {
        source: 'hero',
        sourceType: 'CATALOG',
        activeFilters: {},
        activeSort: 'default',
        queueMode: 'catalog',
      },
      TRACK_REGISTRY
    );
  });

  const playbackContextRef = useRef<PlaybackContext | null>(playbackContext);
  useEffect(() => {
    playbackContextRef.current = playbackContext;
  }, [playbackContext]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240);
  const [activeSection, setActiveSection] = useState<'intro' | 'collection' | 'closing'>('intro');
  const [viewMode, setViewMode] = useState<'gallery' | 'immersive'>('gallery');

  // Theme state with localStorage persistence (Default: Dark Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sonoverse_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    }
    return 'dark';
  });

  // Sync theme with HTML root and localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sonoverse_theme', theme);
    } catch {
      // Ignore storage write errors
    }
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const currentTrackRef = useRef<TrackConfig | null>(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Subscribe to persistent audio engine
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      setDuration(state.duration);
      if (state.currentTrack && state.currentTrack.id !== currentTrackRef.current?.id) {
        setCurrentTrack(state.currentTrack);
      }
      if (state.playbackContext) {
        setPlaybackContext(state.playbackContext);
      }
    });

    return unsubscribe;
  }, []);

  // Sync initial playback context with audioEngine on startup
  useEffect(() => {
    if (playbackContext) {
      audioEngine.setPlaybackContext(playbackContext);
    }
  }, []);

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if user is focused on an input element
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.togglePlay();
      } else if (e.code === 'Escape') {
        if (viewMode === 'immersive') {
          setViewMode('gallery');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handlePlayTrack = (track: TrackConfig, options?: PlayTrackOptions) => {
    if (currentTrack?.id === track.id && !options) {
      audioEngine.togglePlay();
      return;
    }

    const newContext = createPlaybackContext(track, options, tracks);
    setPlaybackContext(newContext);
    audioEngine.setPlaybackContext(newContext);
    setCurrentTrack(track);
    audioEngine.loadTrack(track, true);
  };

  const handleOpenLyrics = (track: TrackConfig, options?: PlayTrackOptions) => {
    if (currentTrack?.id !== track.id || options) {
      handlePlayTrack(track, options);
    }
    setViewMode('immersive');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextTrack = () => {
    audioEngine.playNextTrack('manual');
  };

  const handlePrevTrack = () => {
    audioEngine.playPrevTrack();
  };

  const handleNavigateSection = (sectionId: string) => {
    if (viewMode === 'immersive') {
      setViewMode('gallery');
    }
    setActiveSection(sectionId as 'intro' | 'collection' | 'closing');
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans-clean transition-colors duration-300">
      {/* Editorial Fine Film Grain Overlay */}
      <div className="noise-overlay" />

      {viewMode === 'immersive' && currentTrack ? (
        <ImmersivePlayer
          track={currentTrack}
          allTracks={playbackContext?.queue || tracks}
          playbackContext={playbackContext}
          onBack={() => setViewMode('gallery')}
          onSelectTrack={(t) => {
            handlePlayTrack(
              t,
              playbackContext
                ? {
                    source: playbackContext.source,
                    sourceType: playbackContext.sourceType,
                    activeFilters: playbackContext.activeFilters,
                    activeSort: playbackContext.activeSort,
                  }
                : undefined
            );
          }}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
        />
      ) : (
        <>
          {/* Minimalist Exhibition Header */}
          <Header
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onOpenPlayer={() => setViewMode('immersive')}
            activeSection={activeSection}
            onNavigate={handleNavigateSection}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          <main className="w-full">
            {/* 01 — INTRO / COVER */}
            <HeroCover
              tracks={tracks}
              onPlayTrack={handlePlayTrack}
              onExploreCollection={() => handleNavigateSection('collection')}
            />

            {/* 02 — THE COLLECTION (Asymmetric Fine-Art Exhibition) */}
            <CollectionGallery
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onOpenLyrics={handleOpenLyrics}
              onNavigateToArchive={() => handleNavigateSection('closing')}
            />

            {/* 08 — THE ARCHIVE INDEX & COLOPHON */}
            <ClosingIndex
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onOpenLyrics={handleOpenLyrics}
            />
          </main>

          {/* Persistent Floating Audio Bar */}
          <PersistentPlayerBar
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            playbackContext={playbackContext}
            onOpenPlayer={() => setViewMode('immersive')}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
          />
        </>
      )}
    </div>
  );
}
