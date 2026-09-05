import {
  TrackConfig,
  PlaybackContext,
  ScoringWeights,
  TrackScoreDetails,
  CandidateMatchDetails,
  CandidateScoreBreakdown,
} from '../types';
import { CANONICAL_CATALOG_ORDER } from '../config/tracks';

/**
 * Default ranking weights:
 * 1. Same language: +40
 * 2. Same content type: +25
 * 3. Same genre: +15
 * 4. Same mood: +10
 * 5. Same theme/concept: +5
 * 6. Same artist: +5
 * 7. Meaningful active filters: +5
 * 8. Original catalog order: final tie-breaker
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  language: 40,
  contentType: 25,
  genre: 15,
  mood: 10,
  theme: 5,
  artist: 5,
  activeFilterBonus: 5,
};

// ============================================================================
// 1. ATTRIBUTE EXTRACTION & NORMALIZATION
// ============================================================================

/**
 * Extracts a normalized list of language codes from a track (e.g. ['VI', 'EN']).
 */
export function extractTrackLanguages(track: TrackConfig): string[] {
  const set = new Set<string>();

  if (Array.isArray(track.lyricLanguages)) {
    track.lyricLanguages.forEach((l) => {
      if (typeof l === 'string' && l.trim()) {
        set.add(l.trim().toUpperCase());
      }
    });
  }

  if (Array.isArray(track.languages)) {
    track.languages.forEach((l) => {
      if (typeof l === 'string' && l.trim()) {
        set.add(l.trim().toUpperCase());
      }
    });
  }

  if (typeof track.language === 'string') {
    track.language.split(/[\/\+,]/).forEach((part) => {
      const trimmed = part.trim().toUpperCase();
      if (trimmed) set.add(trimmed);
    });
  }

  return Array.from(set);
}

/**
 * Extracts normalized content type (e.g. 'SONG', 'PODCAST').
 */
export function extractTrackContentType(track: TrackConfig): string {
  return (track.contentType || 'SONG').trim().toUpperCase();
}

/**
 * Extracts normalized genre tags (uppercase).
 */
export function extractTrackGenres(track: TrackConfig): string[] {
  if (!Array.isArray(track.genre)) return [];
  return track.genre
    .filter((g): g is string => typeof g === 'string' && Boolean(g.trim()))
    .map((g) => g.trim().toUpperCase());
}

/**
 * Extracts normalized mood tags (uppercase).
 */
export function extractTrackMoods(track: TrackConfig): string[] {
  if (!Array.isArray(track.mood)) return [];
  return track.mood
    .filter((m): m is string => typeof m === 'string' && Boolean(m.trim()))
    .map((m) => m.trim().toUpperCase());
}

/**
 * Extracts normalized theme & concept tags.
 */
export function extractTrackThemes(track: TrackConfig): string[] {
  const set = new Set<string>();

  if (Array.isArray(track.themes)) {
    track.themes.forEach((th) => {
      if (typeof th === 'string' && th.trim()) {
        set.add(th.trim().toUpperCase());
      }
    });
  }

  if (typeof track.concept === 'string' && track.concept.trim()) {
    set.add(track.concept.trim().toUpperCase());
  }

  return Array.from(set);
}

/**
 * Extracts normalized artist name.
 */
export function extractTrackArtist(track: TrackConfig): string {
  return (track.artist || '').trim().toUpperCase();
}

// ============================================================================
// 2. CANDIDATE SELECTION
// ============================================================================

/**
 * Builds candidate pool from the available track dataset.
 * Strictly excludes the currently playing / anchor track from future candidates.
 */
export function selectCandidates(
  currentTrack: TrackConfig,
  dataset: TrackConfig[],
  excludeTrackIds: string[] = []
): TrackConfig[] {
  const excluded = new Set<string>([currentTrack.id, ...excludeTrackIds]);
  return dataset.filter((track) => !excluded.has(track.id));
}

// ============================================================================
// 3. METADATA SCORING
// ============================================================================

/**
 * Centralized ranking and scoring function.
 * Evaluates candidate similarity against anchor track and active context.
 * Does not expose scores in UI.
 */
export function scoreCandidate(
  candidate: TrackConfig,
  anchor: TrackConfig,
  context?: PlaybackContext,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): TrackScoreDetails {
  const anchorLangs = extractTrackLanguages(anchor);
  const candLangs = extractTrackLanguages(candidate);

  const anchorType = extractTrackContentType(anchor);
  const candType = extractTrackContentType(candidate);

  const anchorGenres = extractTrackGenres(anchor);
  const candGenres = extractTrackGenres(candidate);

  const anchorMoods = extractTrackMoods(anchor);
  const candMoods = extractTrackMoods(candidate);

  const anchorThemes = extractTrackThemes(anchor);
  const candThemes = extractTrackThemes(candidate);

  const anchorArtist = extractTrackArtist(anchor);
  const candArtist = extractTrackArtist(candidate);

  const activeFilters = context?.activeFilters || {};

  // 1. Same Language (+40)
  // Candidate shares at least one language with anchor track OR matches active language filter
  const filterLang = activeFilters.language?.trim().toUpperCase();
  const sharesLanguageWithAnchor = candLangs.some((l) => anchorLangs.includes(l));
  const matchesActiveFilterLang = Boolean(
    filterLang && filterLang !== 'ALL' && candLangs.includes(filterLang)
  );
  const languageMatch = sharesLanguageWithAnchor || matchesActiveFilterLang;
  const languageScore = languageMatch ? weights.language : 0;

  // 2. Same Content Type (+25)
  // Candidate matches anchor content type OR matches active content type filter
  const filterType = activeFilters.contentType?.trim().toUpperCase();
  const sharesTypeWithAnchor = candType === anchorType;
  const matchesActiveFilterType = Boolean(
    filterType && filterType !== 'ALL' && candType === filterType
  );
  const contentTypeMatch = sharesTypeWithAnchor || matchesActiveFilterType;
  const contentTypeScore = contentTypeMatch ? weights.contentType : 0;

  // 3. Same Genre (+15)
  const filterGenre = activeFilters.genre?.trim().toUpperCase();
  const sharesGenreWithAnchor = candGenres.some((g) => anchorGenres.includes(g));
  const matchesActiveFilterGenre = Boolean(
    filterGenre && filterGenre !== 'ALL' && candGenres.includes(filterGenre)
  );
  const genreMatch = sharesGenreWithAnchor || matchesActiveFilterGenre;
  const genreScore = genreMatch ? weights.genre : 0;

  // 4. Same Mood (+10)
  const filterMood = activeFilters.mood?.trim().toUpperCase();
  const sharesMoodWithAnchor = candMoods.some((m) => anchorMoods.includes(m));
  const matchesActiveFilterMood = Boolean(
    filterMood && filterMood !== 'ALL' && candMoods.includes(filterMood)
  );
  const moodMatch = sharesMoodWithAnchor || matchesActiveFilterMood;
  const moodScore = moodMatch ? weights.mood : 0;

  // 5. Same Theme / Concept (+5)
  const filterTheme = (activeFilters.theme || activeFilters.concept)?.trim().toUpperCase();
  const sharesThemeWithAnchor = candThemes.some((th) => anchorThemes.includes(th));
  const matchesActiveFilterTheme = Boolean(
    filterTheme && filterTheme !== 'ALL' && candThemes.some((th) => th.includes(filterTheme))
  );
  const themeMatch = sharesThemeWithAnchor || matchesActiveFilterTheme;
  const themeScore = themeMatch ? weights.theme : 0;

  // 6. Same Artist (+5)
  const artistMatch = Boolean(
    anchorArtist &&
      anchorArtist !== 'UNKNOWN' &&
      anchorArtist !== 'AI STUDIO COLLECTIVE' &&
      candArtist === anchorArtist
  );
  const artistScore = artistMatch ? weights.artist : 0;

  // 7. Meaningful Metadata / Active Filter Bonus (+5)
  let activeFiltersMatch = false;
  let activeFiltersScore = 0;

  if (activeFilters.search && activeFilters.search.trim()) {
    const q = activeFilters.search.trim().toUpperCase();
    const matchesSearch =
      candidate.title.toUpperCase().includes(q) ||
      (candidate.subtitle && candidate.subtitle.toUpperCase().includes(q)) ||
      (candidate.description && candidate.description.toUpperCase().includes(q));
    if (matchesSearch) {
      activeFiltersMatch = true;
      activeFiltersScore += weights.activeFilterBonus;
    }
  }

  // Calculate total score
  const totalScore =
    languageScore +
    contentTypeScore +
    genreScore +
    moodScore +
    themeScore +
    artistScore +
    activeFiltersScore;

  const catalogNumber = parseInt(candidate.number, 10) || 999;

  const matches: CandidateMatchDetails = {
    language: languageMatch,
    contentType: contentTypeMatch,
    genre: genreMatch,
    mood: moodMatch,
    theme: themeMatch,
    artist: artistMatch,
    activeFilters: activeFiltersMatch,
  };

  const scoreBreakdown: CandidateScoreBreakdown = {
    language: languageScore,
    contentType: contentTypeScore,
    genre: genreScore,
    mood: moodScore,
    theme: themeScore,
    artist: artistScore,
    activeFilters: activeFiltersScore,
  };

  return {
    candidate,
    totalScore,
    matches,
    scoreBreakdown,
    catalogNumber,
  };
}

// ============================================================================
// 4. DETERMINISTIC SORTING & TIE-BREAKING
// ============================================================================

/**
 * Sorts scored candidates deterministically.
 *
 * Priority order:
 * 1. Total metadata similarity score descending
 * 2. If scores tie, apply strict priority hierarchy:
 *    (1) Same language
 *    (2) Same content type
 *    (3) Same genre
 *    (4) Same mood
 *    (5) Same theme/concept
 *    (6) Same artist
 *    (7) Same other meaningful metadata
 * 3. Original catalog order as final tie-breaker
 */
export function sortCandidates(scoredList: TrackScoreDetails[]): TrackConfig[] {
  const sorted = [...scoredList].sort((a, b) => {
    // 1. Primary: Score descending
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // 2. Default Priority Hierarchy for tie-breaking:
    // (1) Same language
    if (a.matches.language !== b.matches.language) {
      return a.matches.language ? -1 : 1;
    }

    // (2) Same content type
    if (a.matches.contentType !== b.matches.contentType) {
      return a.matches.contentType ? -1 : 1;
    }

    // (3) Same genre
    if (a.matches.genre !== b.matches.genre) {
      return a.matches.genre ? -1 : 1;
    }

    // (4) Same mood
    if (a.matches.mood !== b.matches.mood) {
      return a.matches.mood ? -1 : 1;
    }

    // (5) Same theme/concept
    if (a.matches.theme !== b.matches.theme) {
      return a.matches.theme ? -1 : 1;
    }

    // (6) Same artist
    if (a.matches.artist !== b.matches.artist) {
      return a.matches.artist ? -1 : 1;
    }

    // (7) Same other meaningful metadata
    if (a.matches.activeFilters !== b.matches.activeFilters) {
      return a.matches.activeFilters ? -1 : 1;
    }

    // (8) Original catalog order as the final tie-breaker
    return a.catalogNumber - b.catalogNumber;
  });

  return sorted.map((item) => item.candidate);
}

// ============================================================================
// 5. ORCHESTRATION & GRACEFUL FALLBACK
// ============================================================================

/**
 * Resolves the deterministic next tracks for a contextual playback session:
 * getNextTracks(context, currentTrack, dataset)
 *
 * Graceful Fallback:
 * Strong contextual match
 * → weaker contextual match
 * → same language
 * → same content type
 * → catalog order
 *
 * If no contextual candidate exists at all:
 * falls back to canonical catalog order.
 *
 * Guaranteed:
 * - Always finds valid next tracks
 * - Never leaves autoplay broken
 * - Excludes current track from immediate repetition
 * - Completely deterministic (same dataset + context = same queue)
 */
export function getNextTracks(
  context: PlaybackContext,
  currentTrack: TrackConfig,
  dataset: TrackConfig[]
): TrackConfig[] {
  // Step 1: Candidate selection (exclude current track)
  const candidatePool = selectCandidates(currentTrack, dataset);

  // Fallback if candidate pool is empty (e.g. 1-track dataset)
  if (candidatePool.length === 0) {
    const fallback = CANONICAL_CATALOG_ORDER.filter((t) => t.id !== currentTrack.id);
    return fallback.length > 0 ? fallback : [currentTrack];
  }

  // Step 2: Centralized scoring
  const scored = candidatePool.map((candidate) =>
    scoreCandidate(candidate, currentTrack, context)
  );

  // Step 3: Sorting with priority hierarchy and catalog order tie-breaker
  const ranked = sortCandidates(scored);

  return ranked;
}

// Attach engine globally for deterministic verification in DevTools
if (typeof window !== 'undefined') {
  (window as unknown as {
    __SONOVERSE_RECOMMENDATION_ENGINE__?: {
      getNextTracks: typeof getNextTracks;
      scoreCandidate: typeof scoreCandidate;
      sortCandidates: typeof sortCandidates;
      selectCandidates: typeof selectCandidates;
    };
  }).__SONOVERSE_RECOMMENDATION_ENGINE__ = {
    getNextTracks,
    scoreCandidate,
    sortCandidates,
    selectCandidates,
  };
}
