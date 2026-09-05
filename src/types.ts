export type CollectionSelectionMode = 'auto' | 'manual';
export type CollectionSortOption = 'newest' | 'mostPlayed' | 'titleAZ' | 'titleZA';

export interface CollectionConfig {
  limit: number;
  mode: CollectionSelectionMode;
  sort: CollectionSortOption;
  trackIds?: string[];
  prioritizeFeatured?: boolean;
}

export interface TrackConfig {
  id: string;
  slug: string;
  number: string;
  trackNumber?: number;
  title: string;
  subtitle?: string;
  artist?: string;
  concept?: string;
  genre?: string[];
  mood?: string[];
  themes?: string[];
  contentType?: 'SONG' | 'PODCAST' | 'INSTRUMENTAL' | 'SPOKEN WORD' | 'SOUNDSCAPE' | string;
  lyricLanguages?: string[];
  languages?: string[];
  language?: string;
  translationLanguage?: string;
  artwork: string;
  cover?: string;
  audio: string;
  audioUrl?: string;
  lyrics: string;
  aligned?: string;
  alignedUrl?: string;
  credits?: string;
  aiTools?: string;
  spotifyUrl?: string | null;
  bpm?: number;
  tempo?: number | null;
  duration?: string;
  keySignature?: string;
  key?: string | null;
  aspect?: string;
  colSpanDesktop?: string;
  offsetDesktop?: string;
  description?: string;
  exhibitionNotes?: string;
  year?: string;
  date?: string;
  createdAt?: string;
  playCount?: number;
  featuredInCollection?: boolean;
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

export interface LyricLearningItem {
  phrase: string;
  meaning: string;
  phonetic?: string | null;
  note?: string | null;
  partOfSpeech?: string | null;
}

export type TranslationSource = 'json' | 'generated' | 'missing';
export type TranslationStatus = 'available' | 'missing' | 'pending';

export interface TranslationResult {
  translation: string | null;
  translationSource: TranslationSource;
  translationStatus: TranslationStatus;
}

export interface NormalizedLyricLine {
  id: string;
  section: string;
  startTime: number | null;
  endTime: number | null;
  start?: number | null;
  end?: number | null;
  duration?: number | null;
  original: string;
  originalText?: string;
  translation: string | null;
  translationText?: string | null;
  translationSource?: TranslationSource;
  translationStatus?: TranslationStatus;
  originalLanguage: string | null;
  translationLanguage: string | null;
  confidence?: number | null;
  learning?: LyricLearningItem[] | null;
}

export interface NormalizedLyricSection {
  id: string;
  type: string;
  style?: string | null;
  lines: NormalizedLyricLine[];
}

export interface NormalizedLyricDoc {
  id: string;
  title: string;
  subtitle?: string | null;
  sourceUrl?: string | null;
  platform?: string | null;
  originalLanguage: string | null;
  translationLanguage: string | null;
  languageMode?: string | null;
  version?: string | null;
  duration?: number | null;
  timingStatus: string;
  notes?: string | null;
  lines: NormalizedLyricLine[];
  sections: NormalizedLyricSection[];
}

export type VisualizerMode = 'spectral-bars' | 'fine-frequencies' | 'organic-ring';

export interface AudioMetrics {
  bass: number;
  mid: number;
  treble: number;
  overallVolume: number;
  energy: number;
  isPeak: boolean;
}

export type PlaybackSourceType =
  | 'CATALOG'
  | 'FILTERED_COLLECTION'
  | 'PODCAST_CONTEXT'
  | 'SEARCH_CONTEXT';

export interface PlaybackActiveFilters {
  language?: string;
  contentType?: string;
  genre?: string;
  mood?: string;
  theme?: string;
  concept?: string;
  search?: string;
  [key: string]: any;
}

export type QueueMode = 'catalog' | 'contextual';

export interface PlaybackContext {
  currentTrackId: string;
  source: string;
  sourceType: PlaybackSourceType;
  activeFilters: PlaybackActiveFilters;
  activeSort: string;
  contentType?: string;
  language?: string;
  genre?: string[];
  mood?: string[];
  theme?: string;
  concept?: string;
  artist?: string;
  currentPosition: number;
  queueMode: QueueMode;
  queue: TrackConfig[];
  currentTrack: TrackConfig | null;
  nextTrack: TrackConfig | null;
  remainingQueue: TrackConfig[];
}

export interface QueueState {
  currentTrack: TrackConfig | null;
  nextTrack: TrackConfig | null;
  remainingQueue: TrackConfig[];
  queueMode: QueueMode;
}

export interface CandidateMatchDetails {
  language: boolean;
  contentType: boolean;
  genre: boolean;
  mood: boolean;
  theme: boolean;
  artist: boolean;
  activeFilters: boolean;
}

export interface CandidateScoreBreakdown {
  language: number;
  contentType: number;
  genre: number;
  mood: number;
  theme: number;
  artist: number;
  activeFilters: number;
}

export interface TrackScoreDetails {
  candidate: TrackConfig;
  totalScore: number;
  matches: CandidateMatchDetails;
  scoreBreakdown: CandidateScoreBreakdown;
  catalogNumber: number;
}

export interface ScoringWeights {
  language: number;
  contentType: number;
  genre: number;
  mood: number;
  theme: number;
  artist: number;
  activeFilterBonus: number;
}

export interface PlayTrackOptions {
  source?: string;
  sourceType?: PlaybackSourceType;
  activeFilters?: PlaybackActiveFilters;
  activeSort?: string;
  queueMode?: QueueMode;
  queue?: TrackConfig[];
}

