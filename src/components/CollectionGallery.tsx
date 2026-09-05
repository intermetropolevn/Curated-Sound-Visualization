import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  TrackConfig,
  CollectionConfig,
  CollectionSortOption,
  PlayTrackOptions,
  PlaybackSourceType,
  PlaybackActiveFilters,
} from '../types';
import { DEFAULT_COLLECTION_CONFIG } from '../config/tracks';
import {
  Play,
  Pause,
  ArrowUpRight,
  RotateCcw,
  Filter,
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface CollectionGalleryProps {
  tracks: TrackConfig[];
  currentTrack: TrackConfig | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackConfig, options?: PlayTrackOptions) => void;
  onOpenLyrics: (track: TrackConfig, options?: PlayTrackOptions) => void;
  onNavigateToArchive?: () => void;
  collectionConfig?: CollectionConfig;
}

/**
 * Standard content types supported by the museum exhibition archive
 */
const BASE_CONTENT_TYPES = ['ALL', 'SONG', 'PODCAST', 'INSTRUMENTAL', 'SPOKEN WORD', 'SOUNDSCAPE'];

/**
 * Curated 8-slot editorial layout specification.
 * Instead of squeezing cards to fit into viewport width, each slot has an intentional,
 * generous desktop width (340px - 580px) and deliberate vertical offset.
 *
 * ROW 1 (Slots 0..3):
 *  - 0: Medium (440px), Aspect 4:5, Offset pt-6
 *  - 1: Large (580px), Aspect 16:10, Top-aligned (pt-0), Prominent Artwork & Premium Typography
 *  - 2: Small (340px), Aspect 3:4, Offset pt-8
 *  - 3: Medium (460px), Aspect 1:1, Offset pt-3
 *
 * ROW 2 (Slots 4..7):
 *  - 4: Large (580px), Aspect 16:10, Top-aligned (pt-0)
 *  - 5: Small (340px), Aspect 3:4, Offset pt-7
 *  - 6: Medium (440px), Aspect 4:5, Offset pt-2
 *  - 7: Medium (460px), Aspect 1:1, Offset pt-5
 */
interface EditorialSlotSpec {
  sizeVariant: 'L' | 'M' | 'S';
  desktopWidth: string;
  aspectClass: string;
  verticalOffsetClass: string;
  titleSizeClass: string;
  showDescription: boolean;
  framePadding: string;
}

const EDITORIAL_SLOTS: EditorialSlotSpec[] = [
  // ROW 1: Medium -> Large -> Small -> Medium
  {
    sizeVariant: 'M',
    desktopWidth: 'w-[440px]',
    aspectClass: 'aspect-[4/5]',
    verticalOffsetClass: 'lg:mt-6',
    titleSizeClass: 'text-xl sm:text-2xl',
    showDescription: true,
    framePadding: 'p-3.5',
  },
  {
    sizeVariant: 'L',
    desktopWidth: 'w-[580px]',
    aspectClass: 'aspect-[16/10]',
    verticalOffsetClass: 'lg:mt-0',
    titleSizeClass: 'text-2xl sm:text-3xl font-normal',
    showDescription: true,
    framePadding: 'p-4',
  },
  {
    sizeVariant: 'S',
    desktopWidth: 'w-[340px]',
    aspectClass: 'aspect-[3/4]',
    verticalOffsetClass: 'lg:mt-8',
    titleSizeClass: 'text-lg sm:text-xl',
    showDescription: false,
    framePadding: 'p-3',
  },
  {
    sizeVariant: 'M',
    desktopWidth: 'w-[460px]',
    aspectClass: 'aspect-square',
    verticalOffsetClass: 'lg:mt-3',
    titleSizeClass: 'text-xl sm:text-2xl',
    showDescription: true,
    framePadding: 'p-3.5',
  },

  // ROW 2: Large -> Small -> Medium -> Medium
  {
    sizeVariant: 'L',
    desktopWidth: 'w-[580px]',
    aspectClass: 'aspect-[16/10]',
    verticalOffsetClass: 'lg:mt-0',
    titleSizeClass: 'text-2xl sm:text-3xl font-normal',
    showDescription: true,
    framePadding: 'p-4',
  },
  {
    sizeVariant: 'S',
    desktopWidth: 'w-[340px]',
    aspectClass: 'aspect-[3/4]',
    verticalOffsetClass: 'lg:mt-7',
    titleSizeClass: 'text-lg sm:text-xl',
    showDescription: false,
    framePadding: 'p-3',
  },
  {
    sizeVariant: 'M',
    desktopWidth: 'w-[440px]',
    aspectClass: 'aspect-[4/5]',
    verticalOffsetClass: 'lg:mt-2',
    titleSizeClass: 'text-xl sm:text-2xl',
    showDescription: true,
    framePadding: 'p-3.5',
  },
  {
    sizeVariant: 'M',
    desktopWidth: 'w-[460px]',
    aspectClass: 'aspect-square',
    verticalOffsetClass: 'lg:mt-5',
    titleSizeClass: 'text-xl sm:text-2xl',
    showDescription: true,
    framePadding: 'p-3.5',
  },
];

/**
 * Derives an authentic artifact label from the track's artwork URL or catalogue number
 */
function deriveArtifactLabel(track: TrackConfig): string {
  if (track.artwork) {
    try {
      const parts = track.artwork.split('/');
      const filename = parts[parts.length - 1];
      if (filename && filename.includes('.')) {
        return `ARTIFACT_${filename.toUpperCase()}`;
      }
    } catch {
      // fallback
    }
  }
  return `ARTIFACT_${track.number}.JPG`;
}

/**
 * Modular Exhibition Card Component with strict typography bounding & no-crop hover states
 */
interface CollectionCardProps {
  track: TrackConfig;
  slot: EditorialSlotSpec;
  isCurrent: boolean;
  isPlaying: boolean;
  totalCatalogCount: string;
  onPlayTrack: (track: TrackConfig) => void;
  onOpenLyrics: (track: TrackConfig) => void;
  customWidthClass?: string;
  customOffsetClass?: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  track,
  slot,
  isCurrent,
  isPlaying,
  totalCatalogCount,
  onPlayTrack,
  onOpenLyrics,
  customWidthClass,
  customOffsetClass,
}) => {
  const isTrackPlaying = isCurrent && isPlaying;
  const artifactLabel = deriveArtifactLabel(track);

  const languageTag =
    track.lyricLanguages && track.lyricLanguages.length > 0
      ? track.lyricLanguages.join(' + ')
      : 'INSTRUMENTAL';

  const widthClass = customWidthClass || slot.desktopWidth;
  const offsetClass = customOffsetClass !== undefined ? customOffsetClass : slot.verticalOffsetClass;

  return (
    <div
      className={`flex flex-col group relative shrink-0 transition-all duration-300 ${widthClass} ${offsetClass}`}
    >
      {/* Artwork Frame */}
      <div
        className={`relative border ${slot.framePadding} bg-[var(--bg-surface)] shadow-md transition-all duration-300 ${
          isCurrent
            ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/50'
            : 'hairline-border group-hover:border-[var(--accent-primary)] group-hover:shadow-xl'
        }`}
      >
        {/* Artwork Viewport with Controlled Aspect Ratio & Overflow Isolation */}
        <div
          className={`w-full ${slot.aspectClass} overflow-hidden bg-black/40 relative flex items-center justify-center select-none`}
        >
          <img
            src={track.artwork || track.cover}
            alt={track.title}
            onError={(e) => {
              console.error('[ARTWORK LOAD FAILED]', track.slug, track.artwork);
              (e.target as HTMLElement).style.display = 'none';
            }}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.03]"
          />

          {/* Audio Playing Glow & Spectral Indicator */}
          {isTrackPlaying && (
            <div className="absolute inset-0 bg-[var(--accent-primary)]/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
              <div className="w-3/4 h-12">
                <AudioVisualizer mode="spectral-bars" height={36} accentColor="#EDE686" />
              </div>
            </div>
          )}

          {/* Non-Cropping Hover Quick Actions Overlay */}
          <div className="absolute inset-0 z-20 bg-[var(--bg-main)]/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 max-w-[95%] mx-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayTrack(track);
                }}
                className="px-3.5 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 text-[10px] sm:text-xs uppercase font-sans-clean font-semibold tracking-wider shadow-md cursor-pointer whitespace-nowrap shrink-0"
              >
                {isTrackPlaying ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>PLAY TRACK</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLyrics(track);
                }}
                className="px-3 py-2 bg-[var(--bg-surface)] border hairline-border text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] hover:border-[var(--accent-primary)] transition-colors flex items-center justify-center gap-1 text-[10px] sm:text-xs uppercase font-sans-clean font-semibold tracking-wider shadow-md cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>LYRICS & ART</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Dynamic Archival Artifact Badge */}
          <div className="absolute bottom-2.5 left-2.5 z-10 text-[9px] font-mono tracking-widest text-[var(--text-primary)] bg-[var(--bg-main)]/85 px-2 py-0.5 border hairline-border backdrop-blur-sm pointer-events-none whitespace-nowrap">
            {artifactLabel}
          </div>
        </div>

        {/* Sub-Frame Meta Row: Compact, Single-Line, Never Wrapping */}
        <div className="pt-3 pb-0.5 flex justify-between items-center font-sans-clean border-t hairline-border mt-3 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs text-[var(--accent-primary)] font-semibold shrink-0">
              {track.number} / {totalCatalogCount}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] px-1.5 py-0.5 border hairline-border bg-[var(--bg-chip)] truncate shrink-0">
              {languageTag}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] shrink-0">
            {track.genre && track.genre.length > 0 && (
              <span className="truncate max-w-[120px]">{track.genre[0]}</span>
            )}
            {(track.bpm || track.tempo) && (
              <>
                {track.genre && track.genre.length > 0 && <span>•</span>}
                <span className="font-mono">{track.bpm || track.tempo} BPM</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Content Block: Tight, Predictable & Proportionate */}
      <div className="pt-3.5 space-y-1.5">
        <div className="flex justify-between items-start gap-2.5">
          <h3
            onClick={() => onOpenLyrics(track)}
            className={`font-heading-jost ${slot.titleSizeClass} text-[var(--text-primary)] font-medium tracking-tight cursor-pointer hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-tight`}
          >
            {track.title}
          </h3>
          {track.concept ? (
            <span className="text-[9px] uppercase font-sans-clean tracking-widest text-[var(--accent-primary)] font-semibold px-2 py-0.5 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/15 shrink-0 truncate max-w-[130px] whitespace-nowrap">
              {track.concept}
            </span>
          ) : (
            <span className="text-[9px] uppercase font-sans-clean tracking-widest text-[var(--text-muted)] px-1.5 py-0.5 border hairline-border bg-[var(--bg-chip)] shrink-0 whitespace-nowrap">
              {track.contentType || 'SONG'}
            </span>
          )}
        </div>

        {track.subtitle && (
          <p className="font-subtitle-outfit text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-1">
            {track.subtitle}
          </p>
        )}

        {track.description && (
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] font-sans-clean leading-relaxed line-clamp-2 pt-0.5">
            {track.description}
          </p>
        )}

        {/* Direct Action Links: Stable Single Line */}
        <div className="flex items-center gap-3 pt-2 text-[10px] sm:text-[11px] font-sans-clean uppercase tracking-wider whitespace-nowrap">
          <button
            onClick={() => onPlayTrack(track)}
            className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{isTrackPlaying ? 'Pause' : 'Listen Now'}</span>
            <Play className="w-2.5 h-2.5 fill-current" />
          </button>
          <span className="opacity-25 select-none">/</span>
          <button
            onClick={() => onOpenLyrics(track)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Synchronized Lyrics</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const CollectionGallery: React.FC<CollectionGalleryProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenLyrics,
  onNavigateToArchive,
  collectionConfig = DEFAULT_COLLECTION_CONFIG,
}) => {
  // Primary Taxonomy: Lyric Languages
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');

  // Secondary Dimension 1: Content Type
  const [selectedContentType, setSelectedContentType] = useState<string>('ALL');

  // Secondary Dimension 2: Theme / Concept
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');

  // Collection Header Sort state (defaults to config sort or newest)
  const [selectedSortOption, setSelectedSortOption] = useState<CollectionSortOption>(
    collectionConfig.sort || 'newest'
  );

  // Carousel active page (8 tracks per page spread)
  const [currentPage, setCurrentPage] = useState<number>(0);
  const PAGE_SIZE = 8;

  // Viewport scroll & horizontal drag state
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  // Merge provided config with defaults
  const effectiveConfig = useMemo(() => {
    return {
      ...DEFAULT_COLLECTION_CONFIG,
      ...collectionConfig,
    };
  }, [collectionConfig]);

  // 1. DYNAMIC TAXONOMY DISCOVERY
  const { singleLanguages, multiLanguageCompositions } = useMemo(() => {
    const singleSet = new Set<string>();
    const multiSet = new Set<string>();

    tracks.forEach((track) => {
      const langs = track.lyricLanguages || [];
      langs.forEach((lang) => {
        const clean = lang.trim().toUpperCase();
        if (clean) singleSet.add(clean);
      });

      if (langs.length > 1) {
        const sorted = [...langs].map((l) => l.trim().toUpperCase()).sort();
        if (sorted.includes('EN') && sorted.includes('VI')) {
          multiSet.add('EN + VI');
        } else {
          multiSet.add(sorted.join(' + '));
        }
      }
    });

    return {
      singleLanguages: Array.from(singleSet),
      multiLanguageCompositions: Array.from(multiSet),
    };
  }, [tracks]);

  // Combined Primary Language taxonomy options
  const languageOptions = useMemo(() => {
    return ['ALL', ...singleLanguages, ...multiLanguageCompositions];
  }, [singleLanguages, multiLanguageCompositions]);

  // Dynamically derive content types
  const contentTypes = useMemo(() => {
    const trackTypes = new Set<string>();
    tracks.forEach((t) => {
      if (t.contentType) trackTypes.add(t.contentType.trim().toUpperCase());
    });

    const merged = ['ALL'];
    BASE_CONTENT_TYPES.filter((t) => t !== 'ALL').forEach((t) => {
      merged.push(t);
    });
    trackTypes.forEach((t) => {
      if (!merged.includes(t)) merged.push(t);
    });

    return merged;
  }, [tracks]);

  // Dynamically derive themes & concepts
  const availableThemes = useMemo(() => {
    const themeSet = new Set<string>();
    tracks.forEach((track) => {
      if (Array.isArray(track.themes) && track.themes.length > 0) {
        track.themes.forEach((th) => themeSet.add(th.trim()));
      } else if (track.concept) {
        themeSet.add(track.concept.trim());
      }
    });
    return ['ALL', ...Array.from(themeSet)];
  }, [tracks]);

  // 2. MULTI-DIMENSIONAL FILTER PREDICATE
  const filterPredicate = useMemo(() => {
    return (track: TrackConfig) => {
      const trackLangs = (track.lyricLanguages || []).map((l) => l.toUpperCase());
      const trackType = (track.contentType || 'SONG').toUpperCase();
      const trackThemes = (
        track.themes && track.themes.length > 0 ? track.themes : [track.concept || '']
      ).map((t) => t.toUpperCase());

      // Primary: Language Filter
      if (selectedLanguage !== 'ALL') {
        if (selectedLanguage.includes('+')) {
          const requiredCodes = selectedLanguage.split('+').map((c) => c.trim().toUpperCase());
          const hasAllCodes = requiredCodes.every((code) => trackLangs.includes(code));
          if (!hasAllCodes) return false;
        } else {
          if (!trackLangs.includes(selectedLanguage.toUpperCase())) {
            return false;
          }
        }
      }

      // Secondary 1: Content Type Filter
      if (selectedContentType !== 'ALL') {
        if (trackType !== selectedContentType) {
          return false;
        }
      }

      // Secondary 2: Theme / Concept Filter
      if (selectedTheme !== 'ALL') {
        const matchesTheme = trackThemes.some((th) => th.includes(selectedTheme.toUpperCase()));
        if (!matchesTheme) return false;
      }

      return true;
    };
  }, [selectedLanguage, selectedContentType, selectedTheme]);

  // 3. ORDERED DATASET
  const orderedCollectionPool = useMemo(() => {
    const filtered = tracks.filter(filterPredicate);

    // Apply manual featured order if configured and default
    if (effectiveConfig.featuredIds && selectedSortOption === 'manual') {
      return [...filtered].sort((a, b) => {
        const aIndex = effectiveConfig.featuredIds!.indexOf(a.id);
        const bIndex = effectiveConfig.featuredIds!.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
    }

    return [...filtered].sort((a, b) => {
      switch (selectedSortOption) {
        case 'mostPlayed': {
          const bPlays = b.playCount || 0;
          const aPlays = a.playCount || 0;
          if (bPlays !== aPlays) return bPlays - aPlays;
          return Number(a.number) - Number(b.number);
        }
        case 'titleAZ':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'titleZA':
          return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        case 'newest':
        default: {
          const bTime = new Date(b.createdAt || b.date || 0).getTime();
          const aTime = new Date(a.createdAt || a.date || 0).getTime();
          return bTime - aTime;
        }
      }
    });
  }, [tracks, filterPredicate, effectiveConfig, selectedSortOption]);

  // Total matching records count
  const matchingPoolCount = orderedCollectionPool.length;
  const totalPages = Math.max(1, Math.ceil(matchingPoolCount / PAGE_SIZE));

  // Reset to first page when filtering or sorting changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedLanguage, selectedContentType, selectedTheme, selectedSortOption]);

  // Ensure currentPage stays within valid bounds
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  // Slice up to 8 tracks for the active carousel page spread
  const activePageTracks = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return orderedCollectionPool.slice(start, start + PAGE_SIZE);
  }, [orderedCollectionPool, currentPage]);

  // Split active 8 tracks into Row 1 (up to 4) and Row 2 (up to 4) for the desktop editorial collage
  const row1Tracks = useMemo(() => activePageTracks.slice(0, 4), [activePageTracks]);
  const row2Tracks = useMemo(() => activePageTracks.slice(4, 8), [activePageTracks]);

  // Context-Aware Playback Capture Handler
  // Captures the exact filtered/sorted context and freezes the queue from which playback started
  const handlePlayTrackInCollection = (track: TrackConfig) => {
    const isPodcast =
      selectedContentType.toUpperCase() === 'PODCAST' ||
      track.contentType?.toUpperCase() === 'PODCAST';
    const hasFilters =
      selectedLanguage !== 'ALL' ||
      selectedContentType !== 'ALL' ||
      selectedTheme !== 'ALL';

    let sourceType: PlaybackSourceType = 'CATALOG';
    if (isPodcast) {
      sourceType = 'PODCAST_CONTEXT';
    } else if (hasFilters) {
      sourceType = 'FILTERED_COLLECTION';
    } else {
      sourceType = 'CATALOG';
    }

    const activeFilters: PlaybackActiveFilters = {};
    if (selectedLanguage !== 'ALL') activeFilters.language = selectedLanguage;
    if (selectedContentType !== 'ALL') activeFilters.contentType = selectedContentType;
    if (selectedTheme !== 'ALL') activeFilters.theme = selectedTheme;

    onPlayTrack(track, {
      source: 'collection',
      sourceType,
      activeFilters,
      activeSort: selectedSortOption,
    });
  };

  const handleOpenLyricsInCollection = (track: TrackConfig) => {
    handlePlayTrackInCollection(track);
    onOpenLyrics(track);
  };

  // Monitor horizontal viewport scroll progress and boundaries
  const updateScrollState = () => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(maxScroll > 10 && scrollLeft < maxScroll - 10);
    setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [activePageTracks, currentPage]);

  // Reset horizontal scroll when changing pages
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Step-wise horizontal scroll controls
  const handleScrollStep = (direction: 'left' | 'right') => {
    if (!viewportRef.current) return;
    const step = 480;
    viewportRef.current.scrollBy({
      left: direction === 'right' ? step : -step,
      behavior: 'smooth',
    });
  };

  // Mouse Drag-to-Scroll support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewportRef.current) return;
    if ((e.target as HTMLElement).closest('button, a, select, input')) {
      return;
    }
    setIsDragging(true);
    const rect = viewportRef.current.getBoundingClientRect();
    setStartX(e.clientX - rect.left);
    setScrollLeftPos(viewportRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !viewportRef.current) return;
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const walk = (x - startX) * 1.25;
    viewportRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const hasActiveFilters =
    selectedLanguage !== 'ALL' || selectedContentType !== 'ALL' || selectedTheme !== 'ALL';

  const resetAllFilters = () => {
    setSelectedLanguage('ALL');
    setSelectedContentType('ALL');
    setSelectedTheme('ALL');
    setCurrentPage(0);
  };

  const handleNavigateToArchiveView = () => {
    if (onNavigateToArchive) {
      onNavigateToArchive();
    } else {
      const el = document.getElementById('closing');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const totalCatalogCount = String(tracks.length).padStart(2, '0');
  const exhibitedCountFormatted = String(activePageTracks.length).padStart(2, '0');

  return (
    <section
      id="collection"
      className="py-20 md:py-28 border-b hairline-border bg-[var(--bg-main)] transition-colors duration-300 relative overflow-hidden"
    >
      {/* SECTION HEADER CONTAINER (Framed within responsive editorial container for typographic alignment) */}
      <div className="editorial-container space-y-6 pb-6 mb-6 border-b hairline-border">
        {/* Wing Index & Archival Navigation */}
        <div className="flex items-center justify-between text-[10px] uppercase font-sans-clean tracking-widest text-[var(--accent-primary)] font-semibold">
          <div className="flex items-center gap-2">
            <span>02 / {totalCatalogCount} EXHIBITION WING</span>
            <span className="opacity-40">•</span>
            <span className="text-[var(--text-secondary)]">WIDE EDITORIAL WALL (8 WORKS / SPREAD)</span>
          </div>

          <button
            onClick={handleNavigateToArchiveView}
            className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>VIEW COMPLETE ARCHIVE ({tracks.length} RECORDS)</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Primary Row: THE COLLECTION (Left) vs. PRIMARY TAXONOMY: LYRIC LANGUAGES (Right) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div>
            <h2 className="font-heading-jost text-4xl sm:text-6xl text-[var(--text-primary)] tracking-tight leading-none">
              THE COLLECTION.
            </h2>
          </div>

          {/* PRIMARY TAXONOMY: LYRIC LANGUAGES */}
          <div className="flex flex-col items-start lg:items-end w-full lg:w-auto">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-semibold mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] inline-block animate-pulse"></span>
              LYRIC LANGUAGES
            </span>

            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-[var(--text-primary)]">
              {languageOptions.map((lang, idx) => {
                const isActive = selectedLanguage === lang;

                return (
                  <React.Fragment key={lang}>
                    {idx > 0 && <span className="opacity-20 select-none font-mono text-sm">/</span>}
                    <button
                      onClick={() => setSelectedLanguage(lang)}
                      className={`font-sans-clean text-lg sm:text-2xl tracking-wide transition-all duration-300 relative py-0.5 cursor-pointer ${
                        isActive
                          ? 'text-[var(--accent-primary)] font-semibold opacity-100'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100 font-normal'
                      }`}
                    >
                      <span>{lang}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)] rounded-full"></span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collection Sub-Header with Catalog Summary & Spread Indicator */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
          <p className="font-subtitle-outfit text-base sm:text-lg text-[var(--text-secondary)]">
            {matchingPoolCount} compositions in catalog. Machine-assisted composition, neural vocal models, human direction.
          </p>

          {/* Editorial Carousel Page Indicator & Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-1.5 border hairline-border shadow-sm shrink-0">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className={`p-1 transition-colors ${
                  currentPage === 0
                    ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)]'
                    : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)] cursor-pointer'
                }`}
                aria-label="Previous Spread"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-semibold text-[var(--text-primary)] px-1 whitespace-nowrap">
                SPREAD {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className={`p-1 transition-colors ${
                  currentPage >= totalPages - 1
                    ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)]'
                    : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)] cursor-pointer'
                }`}
                aria-label="Next Spread"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* SECONDARY CLASSIFICATION TAGS & EDITORIAL CONTROLS */}
        <div className="border hairline-border bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Row 1: Content Type Hierarchy & Secondary Sort/View Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans-clean uppercase tracking-widest">
              <span className="text-[10px] font-mono text-[var(--accent-primary)] mr-2 shrink-0 font-bold">
                CONTENT TYPE:
              </span>
              {contentTypes.map((type) => {
                const isActive = selectedContentType === type;
                const count =
                  type === 'ALL'
                    ? matchingPoolCount
                    : tracks.filter((t) => (t.contentType || 'SONG').toUpperCase() === type).length;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedContentType(type)}
                    className={`px-3 py-1.5 text-[11px] border transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-bold shadow-sm'
                        : 'border hairline-border text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-[var(--bg-chip)]'
                    }`}
                  >
                    {type} {type === 'ALL' ? `(${String(matchingPoolCount).padStart(2, '0')})` : count > 0 ? `(${String(count).padStart(2, '0')})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Editorial Secondary Sort & Action Tools */}
            <div className="flex flex-wrap items-center gap-3 pt-2 xl:pt-0">
              <div className="flex items-center gap-1.5 border hairline-border bg-[var(--bg-chip)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                <ArrowDownWideNarrow className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>SORT:</span>
                <select
                  value={selectedSortOption}
                  onChange={(e) => setSelectedSortOption(e.target.value as CollectionSortOption)}
                  className="bg-transparent text-[var(--text-primary)] font-semibold uppercase cursor-pointer focus:outline-none"
                >
                  <option value="newest" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">NEWEST</option>
                  <option value="mostPlayed" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">MOST PLAYED</option>
                  <option value="titleAZ" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">TITLE (A–Z)</option>
                  <option value="titleZA" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">TITLE (Z–A)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleNavigateToArchiveView}
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors py-1 px-2.5 border border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 cursor-pointer select-none font-semibold whitespace-nowrap"
              >
                <span>VIEW ALL</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors py-1 px-2.5 border hairline-border hover:border-[var(--accent-primary)] bg-[var(--bg-chip)] cursor-pointer select-none font-semibold whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Secondary Theme & Concept Classification Tags */}
          <div className="pt-3 border-t hairline-border flex flex-wrap items-center gap-2 text-[10px] font-sans-clean uppercase tracking-widest">
            <span className="font-mono text-[var(--text-secondary)] mr-2 shrink-0 font-medium">
              THEMES & CONCEPTS:
            </span>
            {availableThemes.map((theme) => {
              const isActive = selectedTheme === theme;

              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  className={`px-2.5 py-1 border transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-semibold shadow-sm'
                      : 'border hairline-border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] bg-[var(--bg-chip)]/60'
                  }`}
                >
                  {theme}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CANVAS EXPLORATION TOOLBAR & POSITION INDICATOR */}
      {activePageTracks.length > 0 && (
        <div className="editorial-container mb-4 flex items-center justify-between gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-[var(--accent-primary)] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] inline-block"></span>
              OVERSIZED EXHIBITION CANVAS
            </span>
            <span className="hidden sm:inline text-[var(--text-muted)] opacity-40">•</span>
            <span className="hidden sm:inline text-[var(--text-muted)] text-[10px] tracking-wider uppercase">
              DRAG OR SCROLL HORIZONTALLY TO EXPLORE →
            </span>
          </div>

          {/* Horizontal Exploration Navigator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-widest uppercase">
                WALL
              </span>
              <div className="w-20 h-[2px] bg-[var(--border-subtle)] relative overflow-hidden rounded-full">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-150 rounded-full"
                  style={{ width: `${Math.max(12, scrollProgress * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScrollStep('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll canvas left"
                className={`p-1.5 border hairline-border transition-colors ${
                  !canScrollLeft
                    ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)] bg-[var(--bg-chip)]/40'
                    : 'text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] bg-[var(--bg-chip)] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleScrollStep('right')}
                disabled={!canScrollRight}
                aria-label="Scroll canvas right"
                className={`p-1.5 border hairline-border transition-colors ${
                  !canScrollRight
                    ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)] bg-[var(--bg-chip)]/40'
                    : 'text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] bg-[var(--bg-chip)] cursor-pointer'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY VIEWPORT OR RESTRAINED EMPTY NOTIFICATION */}
      {activePageTracks.length === 0 ? (
        <div className="editorial-container">
          <div className="py-20 px-8 text-center border border-dashed hairline-border bg-[var(--bg-surface)] my-8 space-y-4">
            <Filter className="w-8 h-8 text-[var(--accent-primary)] mx-auto opacity-70" />
            <h3 className="font-heading-jost text-2xl text-[var(--text-primary)]">
              NO WORKS FOUND
            </h3>
            <p className="font-sans-clean text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              No compositions match the selected criteria.
            </p>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR FILTERS</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* THE WIDE COLLECTION CANVAS VIEWPORT (Contained inside the editorial-container boundaries) */}
          <div className="editorial-container relative">
            <div className="relative w-full overflow-hidden">
              {/* Left Edge Fade Cue (indicates canvas continues to the left when scrolled) */}
              <div
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-20 transition-opacity duration-300 ${
                  canScrollLeft ? 'opacity-90' : 'opacity-0'
                }`}
              />

              {/* Right Edge Fade Cue (indicates canvas continues to the right inside viewport) */}
              <div
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-20 transition-opacity duration-300 ${
                  canScrollRight ? 'opacity-90' : 'opacity-0'
                }`}
              />

              <div
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="collection-viewport w-full no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="collection-canvas w-max min-w-[1950px] py-4 pr-16 pl-0.5"
                  >
                  {/* DESKTOP EDITORIAL ASYMMETRIC COLLAGE (lg:) */}
                  <div className="hidden lg:flex flex-col gap-12">
                    {/* ROW 1: Up to 4 cards with intentional scale differences & vertical rhythm */}
                    <div className="flex flex-row items-start gap-8">
                      {row1Tracks.map((track, idx) => {
                        const slot = EDITORIAL_SLOTS[idx % EDITORIAL_SLOTS.length];
                        return (
                          <CollectionCard
                            key={track.id}
                            track={track}
                            slot={slot}
                            isCurrent={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            totalCatalogCount={totalCatalogCount}
                            onPlayTrack={handlePlayTrackInCollection}
                            onOpenLyrics={handleOpenLyricsInCollection}
                          />
                        );
                      })}
                    </div>

                    {/* ROW 2: Remaining cards in spread (items 4..7) */}
                    {row2Tracks.length > 0 && (
                      <div className="flex flex-row items-start gap-8">
                        {row2Tracks.map((track, idx) => {
                          const slot = EDITORIAL_SLOTS[(idx + 4) % EDITORIAL_SLOTS.length];
                          return (
                            <CollectionCard
                              key={track.id}
                              track={track}
                              slot={slot}
                              isCurrent={currentTrack?.id === track.id}
                              isPlaying={isPlaying}
                              totalCatalogCount={totalCatalogCount}
                              onPlayTrack={handlePlayTrackInCollection}
                              onOpenLyrics={handleOpenLyricsInCollection}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* MOBILE & TABLET RESPONSIVE HORIZONTAL RIBBON (< lg:) */}
                  {/*
                    On mobile: 1 - 1.2 cards visible (w-[85vw] min-w-[300px] max-w-[340px] shrink-0 snap-start)
                    On tablet: 1.5 - 2 cards visible (w-[390px] shrink-0)
                    Next card partially peeks into the viewport to signal horizontal exploration.
                  */}
                  <div className="flex lg:hidden flex-row items-start gap-5 sm:gap-6 snap-x snap-mandatory">
                    {activePageTracks.map((track, idx) => {
                      const slot = EDITORIAL_SLOTS[idx % EDITORIAL_SLOTS.length];
                      return (
                        <div key={track.id} className="snap-start shrink-0">
                          <CollectionCard
                            track={track}
                            slot={slot}
                            isCurrent={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            totalCatalogCount={totalCatalogCount}
                            onPlayTrack={handlePlayTrackInCollection}
                            onOpenLyrics={handleOpenLyricsInCollection}
                            customWidthClass="w-[85vw] sm:w-[390px] min-w-[300px] max-w-[420px]"
                            customOffsetClass="mt-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          </div>

          {/* EDITORIAL FOOTER BRIDGE & BOTTOM CONTROLS */}
          <div className="editorial-container mt-10 pt-8 border-t hairline-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-sans-clean text-[var(--text-secondary)]">
            <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-muted)]">
              <span>EXHIBITING {exhibitedCountFormatted} OF {matchingPoolCount} WORKS</span>
              <span className="opacity-40">•</span>
              <span>HORIZONTAL ARCHIVAL SPREAD</span>
            </div>

            <div className="flex items-center gap-6">
              {totalPages > 1 && (
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className={`p-1.5 border hairline-border transition-colors ${
                      currentPage === 0
                        ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)] bg-[var(--bg-chip)]/40'
                        : 'text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] bg-[var(--bg-chip)] cursor-pointer'
                    }`}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] font-semibold text-[var(--text-primary)] px-2 whitespace-nowrap">
                    {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    className={`p-1.5 border hairline-border transition-colors ${
                      currentPage >= totalPages - 1
                        ? 'opacity-25 cursor-not-allowed text-[var(--text-muted)] bg-[var(--bg-chip)]/40'
                        : 'text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] bg-[var(--bg-chip)] cursor-pointer'
                    }`}
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={handleNavigateToArchiveView}
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors group cursor-pointer whitespace-nowrap"
              >
                <span className="font-semibold underline underline-offset-4">EXPLORE COMPLETE ARCHIVE INDEX ({tracks.length} RECORDS)</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
