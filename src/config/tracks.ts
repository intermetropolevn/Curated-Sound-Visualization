import { TrackConfig, CollectionConfig, CollectionSortOption } from '../types';

export const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/main/';

export const TRACK_REGISTRY: TrackConfig[] = [
  {
    id: 'track-01',
    slug: 'cot-cach-5',
    number: '01',
    trackNumber: 1,
    title: 'CỐT CÁCH 5.0',
    subtitle: 'TRADITION IN HIGH HEELS / CYBER-HERITAGE',
    concept: 'Cyber-Heritage',
    contentType: 'SONG',
    lyricLanguages: ['VI', 'EN'],
    genre: ['Glitch Pop', 'Experimental'],
    themes: ['Heritage & Soul', 'Cyber-Heritage', 'Human × Machine'],
    mood: ['Futuristic', 'Defiant', 'Grounded'],
    language: 'VI / EN',
    translationLanguage: 'EN',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/cot-cach-5.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/cot-cach-5.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/cot-cach-5.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/cot-cach-5.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/cot-cach-5.json`,
    bpm: 108,
    tempo: 108,
    duration: '03:42',
    keySignature: 'F# Minor',
    key: 'F# Minor',
    year: '2026',
    date: '2026-08-25',
    createdAt: '2026-08-25T00:00:00.000Z',
    playCount: 142,
    featuredInCollection: true,
    aspect: '3/4',
    colSpanDesktop: 'md:col-start-2 md:col-span-4',
    offsetDesktop: 'mb-24',
    description: 'An audacious convergence of Vietnamese poise and digital defiance, intertwining silk metaphors with quantum-age electronic synthesis.',
    exhibitionNotes: 'Synthesized with custom micro-tonal neural models. Explores cultural sovereignty in an era of borderless synthetic consciousness.',
    credits: 'AI Vocal Architecture & Suno / Composition Layer: AI Studio Collective',
    aiTools: 'Neural Timbre Morphing / Latent Soundstage',
    spotifyUrl: null
  },
  {
    id: 'track-02',
    slug: 'utopia',
    number: '02',
    trackNumber: 2,
    title: 'UTOPIA',
    subtitle: 'DESIGNED, NOT FOUND',
    concept: 'Illusion',
    contentType: 'SONG',
    lyricLanguages: ['EN', 'VI'],
    genre: ['Ambient', 'Dream Pop', 'Experimental'],
    themes: ['Digital Dystopia', 'Illusion', 'Sanctuary'],
    mood: ['Ethereal', 'Hypnotic', 'Introspective'],
    language: 'EN / VI',
    translationLanguage: 'VI',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/utopia.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/utopia.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/utopia.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/utopia.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/utopia.json`,
    bpm: 92,
    tempo: 92,
    duration: '04:15',
    keySignature: 'D Major',
    key: 'D Major',
    year: '2026',
    date: '2026-08-26',
    createdAt: '2026-08-26T00:00:00.000Z',
    playCount: 183,
    featuredInCollection: true,
    aspect: '1/1',
    colSpanDesktop: 'md:col-start-8 md:col-span-5',
    offsetDesktop: 'mt-16 mb-28',
    description: 'Searching for paradise across radar frequencies only to discover that sanctuaries are constructed within the architecture of the mind.',
    exhibitionNotes: 'Spatial reverb convolution reflecting geometric marble chambers. Pure sine tones layered beneath hazy analog warmth.',
    credits: 'Generative Harmony Synthesis / Esoterica Research',
    aiTools: 'Stochastic Reverb / Harmonic Tensor Fields',
    spotifyUrl: null
  },
  {
    id: 'track-03',
    slug: 'new-beginning',
    number: '03',
    trackNumber: 3,
    title: 'NEW BEGINNING',
    subtitle: 'RESET THE CLOCK / OWN YOUR STORY',
    concept: 'Autonomy',
    contentType: 'SONG',
    lyricLanguages: ['VI', 'EN'],
    genre: ['Cinematic', 'Indie Electronic'],
    themes: ['Autonomy', 'Futuristic', 'Transformation'],
    mood: ['Empowered', 'Expansive', 'Resilient'],
    language: 'VI / EN',
    translationLanguage: 'EN',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/new-beginning.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/new-beginning.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/new-beginning.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/new-beginning.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/new-beginning.json`,
    bpm: 114,
    tempo: 114,
    duration: '03:58',
    keySignature: 'A Minor',
    key: 'A Minor',
    year: '2026',
    date: '2026-08-27',
    createdAt: '2026-08-27T00:00:00.000Z',
    playCount: 95,
    featuredInCollection: false,
    aspect: '16/9',
    colSpanDesktop: 'md:col-start-1 md:col-span-7',
    offsetDesktop: 'mb-24',
    description: 'Wiping the canvas clean. Stepping onto an infinite reflective floor where every choice echoes into an uncharted tomorrow.',
    exhibitionNotes: 'Dynamic algorithmic polyrhythms with cinematic swell automation. Designed as the centerpiece for transformative contemplation.',
    credits: 'Prompt Engineering & Vocal Harmonizer',
    aiTools: 'Dynamic Stem Generation / Adaptive EQ',
    spotifyUrl: null
  },
  {
    id: 'track-04',
    slug: 'lo-ca-doi-nay-khong-ruc-ro',
    number: '04',
    trackNumber: 4,
    title: 'LỠ CẢ ĐỜI NÀY KHÔNG RỰC RỠ...',
    subtitle: 'IS IT OKAY TO JUST BE ORDINARY?',
    concept: 'Melancholy',
    contentType: 'SONG',
    lyricLanguages: ['VI'],
    genre: ['Acoustic', 'Spoken Word', 'Ambient'],
    themes: ['Heritage & Soul', 'Melancholy', 'Quiet Grace'],
    mood: ['Reflective', 'Tender', 'Poetic'],
    language: 'VI / EN',
    translationLanguage: 'EN',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/lo-ca-doi-nay-khong-ruc-ro.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/lo-ca-doi-nay-khong-ruc-ro.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/lo-ca-doi-nay-khong-ruc-ro.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/lo-ca-doi-nay-khong-ruc-ro.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/lo-ca-doi-nay-khong-ruc-ro.json`,
    bpm: 76,
    tempo: 76,
    duration: '04:32',
    keySignature: 'E Minor',
    key: 'E Minor',
    year: '2026',
    date: '2026-08-28',
    createdAt: '2026-08-28T00:00:00.000Z',
    playCount: 68,
    featuredInCollection: false,
    aspect: '2/3',
    colSpanDesktop: 'md:col-start-9 md:col-span-3',
    offsetDesktop: 'mt-12 mb-32',
    description: 'A gentle whispered inquiry into the pressure of constant brilliance. Embracing the quiet grace of ordinary human existence.',
    exhibitionNotes: 'Captured through simulated vinyl crackle and delicate fingerpicked nylon acoustics. High-dynamic-range spoken word intimacy.',
    credits: 'Acoustic Model Synthesis / Lyrical Co-Creation',
    aiTools: 'Nylon Resonance Generator / Granular Grain Engine',
    spotifyUrl: null
  },
  {
    id: 'track-05',
    slug: 'brain-rot',
    number: '05',
    trackNumber: 5,
    title: 'BRAIN ROT',
    subtitle: 'DANCING IN THE ALGORITHMIC LOOP',
    concept: 'Duality',
    contentType: 'SONG',
    lyricLanguages: ['EN'],
    genre: ['Glitch Pop', 'Hyperpop', 'Electronic'],
    themes: ['Digital Dystopia', 'Algorithmic Loop', 'Duality'],
    mood: ['Tense', 'Frenetic', 'Hypnotic'],
    language: 'EN / VI',
    translationLanguage: 'VI',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/brain-rot.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/brain-rot.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/brain-rot.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/brain-rot.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/brain-rot.json`,
    bpm: 132,
    tempo: 132,
    duration: '03:18',
    keySignature: 'C# Minor',
    key: 'C# Minor',
    year: '2026',
    date: '2026-08-29',
    createdAt: '2026-08-29T00:00:00.000Z',
    playCount: 120,
    featuredInCollection: false,
    aspect: '4/3',
    colSpanDesktop: 'md:col-start-3 md:col-span-5',
    offsetDesktop: 'mb-28',
    description: 'A feverish critique of relentless dopamine chasing, infinite feeds, and the blur between digital identity and existential void.',
    exhibitionNotes: 'Hyper-compressed bitcrushed transients and fractured speech samples evoking midnight doom-scrolling psychosis.',
    credits: 'Suno AI Prompting & Sound Design',
    aiTools: 'Glitch Modulation / Bitcrush Synthesizer',
    spotifyUrl: null
  },
  {
    id: 'track-06',
    slug: 'zombie-society',
    number: '06',
    trackNumber: 6,
    title: 'ZOMBIE SOCIETY',
    subtitle: 'PSYCHEDELIC GRAVEYARD / WAKE UP',
    concept: 'Rebellion',
    contentType: 'SONG',
    lyricLanguages: ['EN'],
    genre: ['Alternative', 'Art Rock', 'Electronic'],
    themes: ['Digital Dystopia', 'Rebellion', 'Awakening'],
    mood: ['Fierce', 'Cathartic', 'Satirical'],
    language: 'EN / VI',
    translationLanguage: 'VI',
    artwork: `${GITHUB_RAW_BASE_URL}artwork/zombie-society.jpg`,
    cover: `${GITHUB_RAW_BASE_URL}artwork/zombie-society.jpg`,
    audio: `${GITHUB_RAW_BASE_URL}audio/zombie-society.mp3`,
    audioUrl: `${GITHUB_RAW_BASE_URL}audio/zombie-society.mp3`,
    lyrics: `${GITHUB_RAW_BASE_URL}lyrics/zombie-society.json`,
    aligned: `${GITHUB_RAW_BASE_URL}aligned/zombie-society.json`,
    alignedUrl: `${GITHUB_RAW_BASE_URL}aligned/zombie-society.json`,
    bpm: 120,
    tempo: 120,
    duration: '03:52',
    keySignature: 'B Minor',
    key: 'B Minor',
    year: '2026',
    date: '2026-08-30',
    createdAt: '2026-08-30T00:00:00.000Z',
    playCount: 154,
    featuredInCollection: false,
    aspect: '5/4',
    colSpanDesktop: 'md:col-start-8 md:col-span-4',
    offsetDesktop: 'mt-10 mb-32',
    description: 'An invitation to break the trance of modern routine, walking through a surreal neon graveyard toward unfiltered self-awakening.',
    exhibitionNotes: 'Distorted guitar textures combined with mechanized industrial drum patterns and theatrical vocal performance.',
    credits: 'Art Rock Prompting & Neural Stems',
    aiTools: 'Industrial Rhythm Matrix / Neural Saturation',
    spotifyUrl: null
  },
  {
    id: 'rizz',
    slug: 'rizz',
    number: '07',
    trackNumber: 7,
    title: 'RIZZ',
    concept: '',
    contentType: 'SONG',
    lyricLanguages: ['EN', 'VI'],
    genre: [],
    mood: [],
    themes: [],
    language: 'EN / VI',
    translationLanguage: 'VI',
    artwork: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/artwork/rizz.jpg',
    cover: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/artwork/rizz.jpg',
    audio: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/audio/rizz.mp3',
    audioUrl: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/audio/rizz.mp3',
    lyrics: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/lyrics/rizz.lyrics.json',
    year: '2026',
    date: '2026-08-31',
    createdAt: '2026-08-31T00:00:00.000Z',
    playCount: 165,
    featuredInCollection: false,
    aspect: '1/1',
    colSpanDesktop: 'md:col-start-2 md:col-span-4',
    offsetDesktop: 'mb-24',
    spotifyUrl: null
  },
  {
    id: 'bouquet-of-emotions',
    slug: 'bouquet-of-emotions',
    number: '08',
    trackNumber: 8,
    title: 'BOUQUET OF EMOTIONS',
    concept: '',
    contentType: 'SONG',
    lyricLanguages: ['EN', 'VI'],
    genre: [],
    mood: [],
    themes: [],
    language: 'EN / VI',
    translationLanguage: 'VI',
    sourceUrl: 'https://suno.com/song/c0ee2143-7986-409d-a181-220ff83dc8cf',
    artwork: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/artwork/bouquet-of-emotions.png',
    cover: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/artwork/bouquet-of-emotions.png',
    audio: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/audio/bouquet-of-emotions.mp3',
    audioUrl: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/audio/bouquet-of-emotions.mp3',
    lyrics: 'https://raw.githubusercontent.com/missesotericat/WaveVisualization/refs/heads/main/lyrics/bouquet-of-emotions.lyrics.json',
    year: '2026',
    date: '2026-09-01',
    createdAt: '2026-09-01T00:00:00.000Z',
    playCount: 148,
    featuredInCollection: false,
    aspect: '1/1',
    colSpanDesktop: 'md:col-start-8 md:col-span-4',
    offsetDesktop: 'mt-10 mb-32',
    spotifyUrl: null
  }
];

/**
 * Canonical catalog order strictly sorted by track number (01..08).
 * Serves as the deterministic ground truth for CATALOG QUEUE mode.
 */
export const CANONICAL_CATALOG_ORDER: TrackConfig[] = [...TRACK_REGISTRY].sort(
  (a, b) => parseInt(a.number, 10) - parseInt(b.number, 10)
);

/**
 * Default editorial collection selection configuration
 */
export const DEFAULT_COLLECTION_CONFIG: CollectionConfig = {
  limit: 8,
  mode: 'auto',
  sort: 'newest',
  prioritizeFeatured: false
};

/**
 * Pure selection and curation engine for THE COLLECTION.
 * Enforces the maximum 8-track display ceiling while supporting
 * automatic sorting (newest, mostPlayed, titleAZ, titleZA) and manual curated lists.
 */
export function selectCollectionTracks(
  tracks: TrackConfig[],
  config: CollectionConfig = DEFAULT_COLLECTION_CONFIG,
  filterPredicate?: (track: TrackConfig) => boolean,
  sortOverride?: CollectionSortOption
): TrackConfig[] {
  const limit = typeof config.limit === 'number' && config.limit > 0 ? config.limit : 8;

  // 1. MANUAL / CURATED MODE
  if (config.mode === 'manual' && Array.isArray(config.trackIds) && config.trackIds.length > 0) {
    // Map curated IDs in exact order requested
    const curatedList: TrackConfig[] = [];
    const lookupMap = new Map<string, TrackConfig>();

    tracks.forEach((t) => {
      lookupMap.set(t.id, t);
      lookupMap.set(t.slug, t);
    });

    config.trackIds.forEach((idOrSlug) => {
      const matched = lookupMap.get(idOrSlug);
      if (matched && !curatedList.some((item) => item.id === matched.id)) {
        curatedList.push(matched);
      }
    });

    // Apply active taxonomy filter directly on the curated set without filling from outside
    const filteredCurated = filterPredicate ? curatedList.filter(filterPredicate) : curatedList;
    return filteredCurated.slice(0, limit);
  }

  // 2. AUTOMATIC MODE
  // First apply active taxonomy filters
  const filtered = filterPredicate ? tracks.filter(filterPredicate) : [...tracks];

  const activeSort = sortOverride || config.sort || 'newest';

  // Sort filtered candidate pool
  const sorted = [...filtered].sort((a, b) => {
    // Optional featured prioritization layer (if explicitly enabled in config)
    if (config.prioritizeFeatured) {
      const aFeat = a.featuredInCollection ? 1 : 0;
      const bFeat = b.featuredInCollection ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
    }

    switch (activeSort) {
      case 'mostPlayed': {
        const aPlays = typeof a.playCount === 'number' ? a.playCount : -1;
        const bPlays = typeof b.playCount === 'number' ? b.playCount : -1;
        if (aPlays !== bPlays) return bPlays - aPlays;
        // Fallback to newest if play counts are equal or missing
        const bTime = new Date(b.createdAt || b.date || 0).getTime();
        const aTime = new Date(a.createdAt || a.date || 0).getTime();
        return bTime - aTime;
      }
      case 'titleAZ':
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'titleZA':
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      case 'newest':
      default: {
        const bTime = new Date(b.createdAt || b.date || 0).getTime();
        const aTime = new Date(a.createdAt || a.date || 0).getTime();
        if (bTime !== aTime) return bTime - aTime;
        // Natural fallback by track id or number
        return (a.trackNumber || parseInt(a.number, 10) || 0) - (b.trackNumber || parseInt(b.number, 10) || 0);
      }
    }
  });

  // Strict maximum display ceiling (limit = 8)
  return sorted.slice(0, limit);
}

