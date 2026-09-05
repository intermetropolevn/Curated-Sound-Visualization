import {
  TrackConfig,
  PlaybackContext,
  PlaybackSourceType,
  PlaybackActiveFilters,
  PlayTrackOptions,
  QueueMode,
  QueueState,
} from '../types';
import { CANONICAL_CATALOG_ORDER } from '../config/tracks';
import { getNextTracks } from './recommendationEngine';

/**
 * Checks whether any meaningful filter is active (excluding 'ALL' and empty strings)
 */
export function isPlaybackFilterActive(filters?: PlaybackActiveFilters): boolean {
  if (!filters) return false;
  return Object.values(filters).some(
    (val) => val !== undefined && val !== null && val !== '' && val !== 'ALL'
  );
}

/**
 * Creates a frozen, deterministic PlaybackContext captured at the moment playback is initiated.
 * Guarantees that subsequent filter or UI modifications do not mutate this session.
 *
 * CATALOG QUEUE RULE:
 * When playback starts while there are NO active Collection filters (or in catalog mode):
 * - queueMode = "catalog"
 * - queue uses the canonical catalog/import order of the available dataset (01..08)
 * - queue is sliced starting from the selected track through the remainder of the catalog
 * - no random shuffling, no similarity inference, no genre reordering, no AI
 */
export function createPlaybackContext(
  track: TrackConfig,
  options?: PlayTrackOptions,
  fallbackCatalog: TrackConfig[] = []
): PlaybackContext {
  // 0. Safeguard Against Missing or Corrupt Track
  if (!track || !track.id) {
    const defaultTrack = fallbackCatalog[0] || CANONICAL_CATALOG_ORDER[0];
    track = defaultTrack;
  }

  // 1. Determine Source & Active Filters
  const source = options?.source || 'catalog';
  const rawFilters = options?.activeFilters || {};

  // Clean filters to preserve only active, meaningful filter keys
  const activeFilters: PlaybackActiveFilters = {};
  Object.entries(rawFilters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
      activeFilters[key] = val;
    }
  });

  const isSearch = Boolean(activeFilters.search && activeFilters.search.trim() !== '');
  const isPodcast =
    activeFilters.contentType?.toUpperCase() === 'PODCAST' ||
    track.contentType?.toUpperCase() === 'PODCAST';
  const hasFilters = isPlaybackFilterActive(activeFilters);

  // 2. Resolve Context Source Type & Queue Mode
  let sourceType: PlaybackSourceType = options?.sourceType || 'CATALOG';
  if (!options?.sourceType) {
    if (isSearch) {
      sourceType = 'SEARCH_CONTEXT';
    } else if (isPodcast) {
      sourceType = 'PODCAST_CONTEXT';
    } else if (hasFilters) {
      sourceType = 'FILTERED_COLLECTION';
    } else {
      sourceType = 'CATALOG';
    }
  }

  // Catalog queue mode applies when explicitly requested, when sourceType is CATALOG,
  // or when there are NO active Collection filters, search, or podcast overrides
  const isCatalogMode =
    options?.queueMode === 'catalog' ||
    sourceType === 'CATALOG' ||
    (!hasFilters && !isSearch && !isPodcast);

  const queueMode: QueueMode = isCatalogMode ? 'catalog' : 'contextual';

  // 3. Resolve Queue (Frozen Snapshot)
  let queue: TrackConfig[] = [];
  let currentPosition = 0;

  // Sanitized dataset deduplicated by track id, filtering out null/undefined tracks
  const seenIds = new Set<string>();
  const sanitizedSourceDataset: TrackConfig[] = [];
  const baseCatalog = fallbackCatalog.length > 0 ? fallbackCatalog : CANONICAL_CATALOG_ORDER;
  for (const t of baseCatalog) {
    if (t && t.id && !seenIds.has(t.id)) {
      seenIds.add(t.id);
      sanitizedSourceDataset.push(t);
    }
  }

  if (options?.queue && Array.isArray(options.queue) && options.queue.length > 0) {
    // Explicit queue override if provided
    const explicitSeen = new Set<string>();
    const explicitQueue: TrackConfig[] = [];
    for (const t of options.queue) {
      if (t && t.id && !explicitSeen.has(t.id)) {
        explicitSeen.add(t.id);
        explicitQueue.push(t);
      }
    }
    if (explicitQueue.length > 0) {
      queue = explicitQueue;
      const explicitIdx = queue.findIndex((t) => t.id === track.id);
      currentPosition = explicitIdx >= 0 ? explicitIdx : 0;
    }
  } else if (queueMode === 'catalog') {
    // CATALOG QUEUE RULE:
    // Slices canonical catalog dataset beginning from the selected track
    const trackIndex = sanitizedSourceDataset.findIndex((t) => t.id === track.id);

    if (trackIndex !== -1) {
      queue = sanitizedSourceDataset.slice(trackIndex);
    } else {
      // Current track not found in catalog: anchor track at position 0 followed by deduplicated catalog
      queue = [track, ...sanitizedSourceDataset.filter((t) => t.id !== track.id)];
    }
    currentPosition = 0;
  } else {
    // CONTEXTUAL QUEUE RULE:
    // When playback starts while one or more meaningful filters are active:
    // - queueMode = "contextual"
    // - Current track becomes the anchor track
    // - Candidate pool built from available dataset, excluding anchor track
    // - Candidates ranked via deterministic metadata similarity scoring & tie-breaking
    const provisionalContext: PlaybackContext = {
      currentTrackId: track.id,
      source,
      sourceType,
      activeFilters,
      activeSort: options?.activeSort || 'default',
      contentType: track.contentType || 'SONG',
      language: track.language,
      genre: track.genre,
      mood: track.mood,
      theme:
        (track.themes && track.themes.length > 0 ? track.themes[0] : track.concept) ||
        undefined,
      concept: track.concept,
      artist: track.artist,
      currentPosition: 0,
      queueMode: 'contextual',
      queue: [],
      currentTrack: track,
      nextTrack: null,
      remainingQueue: [],
    };

    const nextTracks = getNextTracks(provisionalContext, track, sanitizedSourceDataset);
    // Deduplicate nextTracks and guarantee track.id is not repeated
    const queueSeen = new Set<string>([track.id]);
    const dedupedNext: TrackConfig[] = [];
    for (const nt of nextTracks) {
      if (nt && nt.id && !queueSeen.has(nt.id)) {
        queueSeen.add(nt.id);
        dedupedNext.push(nt);
      }
    }
    queue = [track, ...dedupedNext];
    currentPosition = 0;
  }

  // 4. Derive Queue State: current track, next track, remaining queue
  const currentTrack = queue[currentPosition] || track;
  const nextTrack = currentPosition + 1 < queue.length ? queue[currentPosition + 1] : null;
  const remainingQueue = queue.slice(currentPosition + 1);

  // 5. Derive Track Attributes
  const activeSort = options?.activeSort || 'newest';
  const contentType = track.contentType || 'SONG';
  const language =
    track.language ||
    (track.lyricLanguages && track.lyricLanguages.length > 0
      ? track.lyricLanguages.join(' + ')
      : undefined);
  const genre = track.genre ? [...track.genre] : undefined;
  const mood = track.mood ? [...track.mood] : undefined;
  const theme =
    (track.themes && track.themes.length > 0 ? track.themes[0] : track.concept) || undefined;
  const concept = track.concept || undefined;
  const artist = track.artist || undefined;

  // 6. Assemble Final PlaybackContext Object
  const playbackContext: PlaybackContext = {
    currentTrackId: track.id,
    source,
    sourceType,
    activeFilters,
    activeSort,
    contentType,
    language,
    genre,
    mood,
    theme,
    concept,
    artist,
    currentPosition,
    queueMode,
    queue: Object.freeze(queue) as unknown as TrackConfig[],
    currentTrack,
    nextTrack,
    remainingQueue,
  };

  // 7. Diagnostic Logging & Global Inspection Hook for verification
  console.log('[PLAYBACK CONTEXT CAPTURED]', {
    currentTrackId: playbackContext.currentTrackId,
    currentTrackTitle: currentTrack.title,
    nextTrackTitle: nextTrack?.title || 'NONE (END OF QUEUE)',
    source: playbackContext.source,
    sourceType: playbackContext.sourceType,
    queueMode: playbackContext.queueMode,
    queueLength: playbackContext.queue.length,
    currentPosition: playbackContext.currentPosition,
    queueOrder: playbackContext.queue.map((t) => `${t.number} ${t.title}`),
  });

  if (typeof window !== 'undefined') {
    (window as unknown as { __SONOVERSE_PLAYBACK_CONTEXT__?: PlaybackContext }).__SONOVERSE_PLAYBACK_CONTEXT__ =
      playbackContext;
    (window as unknown as { __SONOVERSE_QUEUE_STATE__?: QueueState }).__SONOVERSE_QUEUE_STATE__ = {
      currentTrack: playbackContext.currentTrack,
      nextTrack: playbackContext.nextTrack,
      remainingQueue: playbackContext.remainingQueue,
      queueMode: playbackContext.queueMode,
    };
  }

  return playbackContext;
}

/**
 * Updates an existing PlaybackContext when advancing to another track in the same queue.
 * Keeps the original source, sourceType, activeFilters, activeSort, and queue intact.
 */
export function updatePlaybackContextTrack(
  context: PlaybackContext,
  nextTrack: TrackConfig,
  newPosition: number
): PlaybackContext {
  const contentType = nextTrack.contentType || 'SONG';
  const language =
    nextTrack.language ||
    (nextTrack.lyricLanguages && nextTrack.lyricLanguages.length > 0
      ? nextTrack.lyricLanguages.join(' + ')
      : undefined);
  const genre = nextTrack.genre ? [...nextTrack.genre] : undefined;
  const mood = nextTrack.mood ? [...nextTrack.mood] : undefined;
  const theme =
    (nextTrack.themes && nextTrack.themes.length > 0 ? nextTrack.themes[0] : nextTrack.concept) ||
    undefined;
  const concept = nextTrack.concept || undefined;
  const artist = nextTrack.artist || undefined;

  const currentTrack = context.queue[newPosition] || nextTrack;
  const followingTrack =
    newPosition + 1 < context.queue.length ? context.queue[newPosition + 1] : null;
  const remainingQueue = context.queue.slice(newPosition + 1);

  const updatedContext: PlaybackContext = {
    ...context,
    currentTrackId: nextTrack.id,
    contentType,
    language,
    genre,
    mood,
    theme,
    concept,
    artist,
    currentPosition: newPosition,
    currentTrack,
    nextTrack: followingTrack,
    remainingQueue,
  };

  console.log('[PLAYBACK CONTEXT ADVANCED]', {
    currentTrackId: updatedContext.currentTrackId,
    currentTrackTitle: currentTrack.title,
    nextTrackTitle: followingTrack?.title || 'NONE (END OF QUEUE)',
    queueMode: updatedContext.queueMode,
    currentPosition: updatedContext.currentPosition,
    remainingCount: remainingQueue.length,
    remainingTitles: remainingQueue.map((t) => `${t.number} ${t.title}`),
  });

  if (typeof window !== 'undefined') {
    (window as unknown as { __SONOVERSE_PLAYBACK_CONTEXT__?: PlaybackContext }).__SONOVERSE_PLAYBACK_CONTEXT__ =
      updatedContext;
    (window as unknown as { __SONOVERSE_QUEUE_STATE__?: QueueState }).__SONOVERSE_QUEUE_STATE__ = {
      currentTrack: updatedContext.currentTrack,
      nextTrack: updatedContext.nextTrack,
      remainingQueue: updatedContext.remainingQueue,
      queueMode: updatedContext.queueMode,
    };
  }

  return updatedContext;
}

export interface ContextualIndicatorInfo {
  mode: QueueMode;
  badge: string;
  statusText: string;
  fullLabel: string;
  nextTrackTitle: string | null;
}

/**
 * Generates restrained, editorial contextual playback indicators for the UI.
 * Avoids marketing hype, AI jargon, and numeric scores.
 */
export function getContextualPlaybackInfo(
  context: PlaybackContext | null
): ContextualIndicatorInfo {
  if (!context || context.queueMode === 'catalog') {
    return {
      mode: 'catalog',
      badge: 'CATALOG',
      statusText: 'Continuing catalog',
      fullLabel: 'CATALOG · Continuing catalog',
      nextTrackTitle: context?.nextTrack
        ? `${context.nextTrack.number} ${context.nextTrack.title}`
        : null,
    };
  }

  // Contextual Playback Mode
  const active = context.activeFilters || {};
  const lang = active.language;
  const cType = active.contentType;
  const genre = active.genre;
  const mood = active.mood;

  let badge = 'FROM COLLECTION';

  if (lang && cType) {
    badge = `${lang.toUpperCase()} · ${cType.toUpperCase()}`;
  } else if (lang) {
    badge = `${lang.toUpperCase()} · COLLECTION`;
  } else if (cType) {
    badge = `${cType.toUpperCase()}`;
  } else if (genre) {
    badge = `${genre.toUpperCase()}`;
  } else if (mood) {
    badge = `${mood.toUpperCase()}`;
  } else if (active.search) {
    badge = 'SEARCH CONTEXT';
  } else if (context.sourceType === 'PODCAST_CONTEXT') {
    badge = 'PODCAST';
  } else {
    badge = 'CONTEXTUAL PLAYBACK';
  }

  const statusText = 'Continuing this collection';

  return {
    mode: 'contextual',
    badge,
    statusText,
    fullLabel: `${badge} · ${statusText}`,
    nextTrackTitle: context.nextTrack
      ? `${context.nextTrack.number} ${context.nextTrack.title}`
      : null,
  };
}
