import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrackConfig } from '../types';
import { Play, Pause, ArrowUpRight, Search, X, RotateCcw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export const ITEMS_PER_PAGE = 12;

interface ClosingIndexProps {
  tracks: TrackConfig[];
  currentTrack: TrackConfig | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackConfig) => void;
  onOpenLyrics: (track: TrackConfig) => void;
}

type SortOption = 'number-asc' | 'title-asc' | 'title-desc' | 'tempo-asc' | 'tempo-desc';

export const ClosingIndex: React.FC<ClosingIndexProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenLyrics
}) => {
  // Read initial URL params if present for deep linking & state preservation
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') return { search: '', page: 1, type: 'ALL', lang: 'ALL', genre: 'ALL', concept: 'ALL', sort: 'number-asc' as SortOption };
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || params.get('q') || '',
      page: parseInt(params.get('page') || '1', 10) || 1,
      type: params.get('type') || 'ALL',
      lang: params.get('lang') || 'ALL',
      genre: params.get('genre') || 'ALL',
      concept: params.get('concept') || 'ALL',
      sort: (params.get('sort') as SortOption) || 'number-asc'
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState(initialParams.search);
  const [selectedContentType, setSelectedContentType] = useState(initialParams.type);
  const [selectedLanguage, setSelectedLanguage] = useState(initialParams.lang);
  const [selectedGenre, setSelectedGenre] = useState(initialParams.genre);
  const [selectedConcept, setSelectedConcept] = useState(initialParams.concept);
  const [sortBy, setSortBy] = useState<SortOption>(initialParams.sort);
  const [currentPage, setCurrentPage] = useState(initialParams.page);

  // Sync state changes with URL query params without reloading the page
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());
      else url.searchParams.delete('search');

      if (currentPage > 1) url.searchParams.set('page', currentPage.toString());
      else url.searchParams.delete('page');

      if (selectedContentType !== 'ALL') url.searchParams.set('type', selectedContentType);
      else url.searchParams.delete('type');

      if (selectedLanguage !== 'ALL') url.searchParams.set('lang', selectedLanguage);
      else url.searchParams.delete('lang');

      if (selectedGenre !== 'ALL') url.searchParams.set('genre', selectedGenre);
      else url.searchParams.delete('genre');

      if (selectedConcept !== 'ALL') url.searchParams.set('concept', selectedConcept);
      else url.searchParams.delete('concept');

      if (sortBy !== 'number-asc') url.searchParams.set('sort', sortBy);
      else url.searchParams.delete('sort');

      window.history.replaceState({}, '', url.toString());
    }
  }, [searchQuery, currentPage, selectedContentType, selectedLanguage, selectedGenre, selectedConcept, sortBy]);

  // Derived filter options based on track metadata
  const contentTypes = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.contentType) set.add(t.contentType.toUpperCase());
    });
    // Ensure core content types exist for catalog standard
    ['SONG', 'PODCAST', 'INSTRUMENTAL', 'SPOKEN WORD', 'SOUNDSCAPE'].forEach((type) => set.add(type));
    return ['ALL', ...Array.from(set)];
  }, [tracks]);

  const languages = useMemo(() => {
    return ['ALL', 'VI', 'EN', 'EN + VI', 'MULTILINGUAL', 'INSTRUMENTAL'];
  }, []);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      t.genre?.forEach((g) => set.add(g));
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [tracks]);

  const availableConcepts = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.concept) set.add(t.concept);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [tracks]);

  // Reset pagination to Page 1 when any filter or search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleContentTypeChange = (value: string) => {
    setSelectedContentType(value);
    setCurrentPage(1);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setCurrentPage(1);
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    setCurrentPage(1);
  };

  const handleConceptChange = (value: string) => {
    setSelectedConcept(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedContentType('ALL');
    setSelectedLanguage('ALL');
    setSelectedGenre('ALL');
    setSelectedConcept('ALL');
    setSortBy('number-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== '' ||
    selectedContentType !== 'ALL' ||
    selectedLanguage !== 'ALL' ||
    selectedGenre !== 'ALL' ||
    selectedConcept !== 'ALL' ||
    sortBy !== 'number-asc'
  );

  // Filter & Search Engine
  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return tracks.filter((track) => {
      // 1. Content Type Filter
      if (selectedContentType !== 'ALL') {
        const trackType = (track.contentType || 'SONG').toUpperCase();
        if (trackType !== selectedContentType) return false;
      }

      // 2. Language Filter
      if (selectedLanguage !== 'ALL') {
        const trackLang = (track.language || '').toUpperCase();
        const lyricLangs = (track.lyricLanguages || track.languages || []).map((l) => l.toUpperCase());
        const isInstrumental =
          track.contentType?.toUpperCase() === 'INSTRUMENTAL' ||
          trackLang.includes('INSTRUMENTAL') ||
          (!track.lyrics && lyricLangs.length === 0);

        if (selectedLanguage === 'INSTRUMENTAL') {
          if (!isInstrumental) return false;
        } else if (selectedLanguage === 'VI') {
          const hasVI = trackLang.includes('VI') || lyricLangs.includes('VI');
          if (!hasVI) return false;
        } else if (selectedLanguage === 'EN') {
          const hasEN = trackLang.includes('EN') || lyricLangs.includes('EN');
          if (!hasEN) return false;
        } else if (selectedLanguage === 'EN + VI' || selectedLanguage === 'MULTILINGUAL') {
          const isBilingual =
            (trackLang.includes('EN') && trackLang.includes('VI')) ||
            lyricLangs.length > 1 ||
            trackLang.includes('MULTI');
          if (!isBilingual) return false;
        }
      }

      // 3. Genre Filter
      if (selectedGenre !== 'ALL') {
        if (!track.genre?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) {
          return false;
        }
      }

      // 4. Concept Filter
      if (selectedConcept !== 'ALL') {
        if (track.concept.toLowerCase() !== selectedConcept.toLowerCase()) {
          return false;
        }
      }

      // 5. Search Query Matching (Case-insensitive, partial matching)
      if (q) {
        const matchTitle = track.title.toLowerCase().includes(q);
        const matchSubtitle = (track.subtitle || '').toLowerCase().includes(q);
        const matchArtist = (track.artist || '').toLowerCase().includes(q);
        const matchConcept = track.concept.toLowerCase().includes(q);
        const matchGenres = track.genre?.some((g) => g.toLowerCase().includes(q));
        const matchMoods = track.mood?.some((m) => m.toLowerCase().includes(q));
        const matchDescription = (track.description || '').toLowerCase().includes(q);
        const matchCredits = (track.credits || '').toLowerCase().includes(q);
        const matchAiTools = (track.aiTools || '').toLowerCase().includes(q);

        if (
          !matchTitle &&
          !matchSubtitle &&
          !matchArtist &&
          !matchConcept &&
          !matchGenres &&
          !matchMoods &&
          !matchDescription &&
          !matchCredits &&
          !matchAiTools
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tracks, searchQuery, selectedContentType, selectedLanguage, selectedGenre, selectedConcept]);

  // Sorting Engine
  const sortedTracks = useMemo(() => {
    const list = [...filteredTracks];
    switch (sortBy) {
      case 'title-asc':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case 'tempo-asc':
        return list.sort((a, b) => (a.bpm || a.tempo || 0) - (b.bpm || b.tempo || 0));
      case 'tempo-desc':
        return list.sort((a, b) => (b.bpm || b.tempo || 0) - (a.bpm || a.tempo || 0));
      case 'number-asc':
      default:
        return list.sort((a, b) => {
          const numA = parseInt(a.number.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.number.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
    }
  }, [filteredTracks, sortBy]);

  // Pagination Engine
  const totalItems = sortedTracks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Automatic safeguard: if currentPage exceeds totalPages, reset to 1
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPaginatedTracks = useMemo(() => {
    return sortedTracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedTracks, startIndex]);

  const startRecordNum = totalItems === 0 ? 0 : startIndex + 1;
  const endRecordNum = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  return (
    <footer id="closing" className="py-20 md:py-28 w-full border-t hairline-border font-sans-clean bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="editorial-container">
        {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 mb-8 border-b hairline-border gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[var(--accent-primary)] font-semibold block mb-2">
            08 / ARCHIVE INDEX & CATALOG
          </span>
          <h2 className="font-heading-jost text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight">
            THE ARCHIVE INDEX.
          </h2>
        </div>

        <p className="font-subtitle-outfit text-base sm:text-lg text-[var(--text-secondary)] max-w-md">
          A definitive inventory of all machine-assisted compositions and bilingual lyrical manuscripts.
        </p>
      </div>

      {/* Catalog Search, Filter & Sort Controls */}
      <div className="mb-6 p-4 sm:p-5 border hairline-border bg-[var(--bg-surface)] shadow-lg space-y-4">
        {/* Row 1: Search Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[var(--accent-primary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="SEARCH BY TITLE, SUBTITLE, ARTIST, GENRE, CONCEPT..."
            className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 p-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Metadata Filter Dropdowns & Sorter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 text-[11px] font-sans-clean">
          {/* Content Type Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold">
              TYPE
            </label>
            <select
              value={selectedContentType}
              onChange={(e) => handleContentTypeChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[11px] font-mono uppercase text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold">
              LANGUAGE
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[11px] font-mono uppercase text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold">
              GENRE
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[11px] font-mono uppercase text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Concept Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold">
              CONCEPT
            </label>
            <select
              value={selectedConcept}
              onChange={(e) => handleConceptChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[11px] font-mono uppercase text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {availableConcepts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold flex items-center gap-1">
              <ArrowUpDown className="w-2.5 h-2.5" />
              <span>SORT BY</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-2.5 py-1.5 bg-[var(--bg-chip)] border hairline-border hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[11px] font-mono uppercase text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="number-asc">CATALOGUE NO.</option>
              <option value="title-asc">TITLE (A → Z)</option>
              <option value="title-desc">TITLE (Z → A)</option>
              <option value="tempo-asc">TEMPO (SLOW → FAST)</option>
              <option value="tempo-desc">TEMPO (FAST → SLOW)</option>
            </select>
          </div>

          {/* Reset Filters CTA */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={resetAllFilters}
              disabled={!hasActiveFilters}
              className={`h-[34px] px-3 py-1.5 border flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all select-none ${
                hasActiveFilters
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] hover:opacity-90 cursor-pointer font-semibold shadow-sm'
                  : 'border hairline-border text-[var(--text-dimmed)] bg-[var(--bg-chip)] opacity-60 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result Count & Active Filter Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-[11px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">
            {totalItems === 0
              ? 'NO RECORDS FOUND'
              : totalItems <= ITEMS_PER_PAGE
              ? `SHOWING ${totalItems.toString().padStart(2, '0')} RECORDS`
              : `SHOWING ${startRecordNum.toString().padStart(2, '0')}–${endRecordNum.toString().padStart(2, '0')} OF ${totalItems.toString().padStart(2, '0')} RECORDS`}
          </span>
          {searchQuery && (
            <span className="text-[var(--text-muted)] font-normal">
              matching &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="text-[10px] text-[var(--text-muted)]">
            PAGE {currentPage.toString().padStart(2, '0')} OF {totalPages.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Catalog Table Area */}
      {totalItems === 0 ? (
        /* Empty Search & Filter State */
        <div className="w-full py-16 px-6 border hairline-border bg-[var(--bg-surface)] text-center shadow-lg mb-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border hairline-border bg-[var(--bg-chip)] flex items-center justify-center text-[var(--accent-primary)]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading-jost text-xl text-[var(--text-primary)] font-semibold tracking-wide">
              NO RECORDS FOUND
            </h3>
            <p className="font-subtitle-outfit text-sm text-[var(--text-secondary)] max-w-sm mt-1">
              {searchQuery
                ? `No machine-assisted compositions match "${searchQuery}". Try broadening your query or resetting active filters.`
                : 'No tracks match the current filter selection.'}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 border border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] hover:opacity-90 font-mono text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-sm"
          >
            CLEAR SEARCH & FILTERS
          </button>
        </div>
      ) : (
        <>
          {/* Desktop & Wide View Table */}
          <div className="hidden md:block w-full overflow-x-auto border hairline-border bg-[var(--bg-surface)] shadow-2xl mb-8">
            <table className="w-full text-left text-xs font-sans-clean">
              <thead className="bg-[var(--bg-chip)] border-b hairline-border text-[10px] uppercase tracking-widest text-[var(--text-secondary)] select-none">
                <tr>
                  <th
                    className="py-3 px-4 font-mono cursor-pointer hover:text-[var(--accent-primary)]"
                    onClick={() => handleSortChange('number-asc')}
                    title="Sort by Catalogue No."
                  >
                    No.
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-[var(--accent-primary)]"
                    onClick={() => handleSortChange(sortBy === 'title-asc' ? 'title-desc' : 'title-asc')}
                    title="Sort by Title"
                  >
                    Title & Subtitle
                  </th>
                  <th className="py-3 px-4">Concept</th>
                  <th className="py-3 px-4">Genre / Mood</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-[var(--accent-primary)]"
                    onClick={() => handleSortChange(sortBy === 'tempo-asc' ? 'tempo-desc' : 'tempo-asc')}
                    title="Sort by Tempo"
                  >
                    Tempo / Key
                  </th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4 text-right">Accession</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {currentPaginatedTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isTrackPlaying = isCurrent && isPlaying;

                  return (
                    <tr
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className={`cursor-pointer transition-colors duration-200 ${
                        isCurrent
                          ? 'bg-[var(--accent-primary)]/15 font-medium'
                          : 'hover:bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      {/* Number */}
                      <td className="py-4 px-4 font-mono font-bold text-[var(--accent-primary)]">
                        {track.number}
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 border hairline-border shrink-0 bg-black/40 overflow-hidden">
                            <img
                              src={track.artwork}
                              alt={track.title}
                              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                            />
                          </div>
                          <div>
                            <div className="font-heading-jost text-[16px] text-[var(--text-primary)] leading-tight font-medium">
                              {track.title}
                            </div>
                            {track.subtitle && (
                              <div className="font-subtitle-outfit text-[12px] text-[var(--text-secondary)]">
                                {track.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Concept */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] text-[10px] uppercase font-semibold">
                          {track.concept}
                        </span>
                      </td>

                      {/* Genre / Mood */}
                      <td className="py-4 px-4 text-[var(--text-secondary)]">
                        <div className="text-[var(--text-primary)]">{track.genre.join(', ')}</div>
                        <div className="text-[10px] text-[var(--accent-primary)] opacity-90 font-medium">
                          {track.mood.join(' • ')}
                        </div>
                      </td>

                      {/* Tempo / Key */}
                      <td className="py-4 px-4 font-mono text-[11px] text-[var(--text-primary)]">
                        <div>{track.bpm || track.tempo || '—'} BPM</div>
                        <div className="text-[var(--text-muted)] text-[10px]">{track.keySignature || track.key || '—'}</div>
                      </td>

                      {/* Language */}
                      <td className="py-4 px-4 text-[var(--text-secondary)] font-mono text-[11px] font-medium">
                        {track.language}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onPlayTrack(track)}
                            className="p-2 border hairline-border bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] transition-all cursor-pointer"
                            title={isTrackPlaying ? 'Pause' : 'Play in Persistent Player'}
                            aria-label={isTrackPlaying ? 'Pause' : 'Play'}
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenLyrics(track)}
                            className="p-2 border hairline-border bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:text-[#FFFFFF] dark:hover:text-[#10110E] transition-all cursor-pointer"
                            title="Open Synchronized Lyrics & Notes"
                            aria-label="Open Lyrics"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Compact Archive Cards */}
          <div className="md:hidden space-y-3 mb-8">
            {currentPaginatedTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`p-4 border hairline-border bg-[var(--bg-surface)] transition-colors cursor-pointer shadow-md ${
                    isCurrent ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                        {track.number}
                      </span>
                      <div className="w-10 h-10 border hairline-border shrink-0 bg-black/40 overflow-hidden">
                        <img
                          src={track.artwork}
                          alt={track.title}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      <div>
                        <div className="font-heading-jost text-[16px] text-[var(--text-primary)] leading-tight font-semibold">
                          {track.title}
                        </div>
                        {track.subtitle && (
                          <div className="font-subtitle-outfit text-[12px] text-[var(--text-secondary)]">
                            {track.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onPlayTrack(track)}
                        className="p-2 border hairline-border bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                        aria-label={isTrackPlaying ? 'Pause' : 'Play'}
                      >
                        {isTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLyrics(track)}
                        className="p-2 border hairline-border bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                        aria-label="Open Lyrics"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t hairline-border flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans-clean">
                    <div className="text-[var(--text-secondary)]">
                      <span>{track.genre.join(', ')}</span>
                      <span className="mx-1.5 opacity-40">•</span>
                      <span className="text-[var(--accent-primary)] font-medium">{track.concept}</span>
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {track.bpm || track.tempo || '—'} BPM · {track.language}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border hairline-border bg-[var(--bg-surface)] shadow-md mb-12">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono uppercase tracking-wider transition-all select-none ${
                  currentPage === 1
                    ? 'border-transparent text-[var(--text-dimmed)] opacity-40 cursor-not-allowed'
                    : 'border hairline-border bg-[var(--bg-chip)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREVIOUS</span>
              </button>

              {/* Numbered Page Buttons with Ellipsis Logic */}
              <div className="flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Keep UI clean for large page counts (e.g. 1, 2, ..., 10)
                  const isCurrent = pageNum === currentPage;
                  const isFirst = pageNum === 1;
                  const isLast = pageNum === totalPages;
                  const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;

                  if (!isFirst && !isLast && !isNearCurrent) {
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="px-1 text-[var(--text-dimmed)] select-none">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center border transition-all cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-[var(--accent-primary)] text-[#FFFFFF] dark:text-[#10110E] border-[var(--accent-primary)] font-bold shadow-sm'
                          : 'border hairline-border bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      {pageNum.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono uppercase tracking-wider transition-all select-none ${
                  currentPage === totalPages
                    ? 'border-transparent text-[var(--text-dimmed)] opacity-40 cursor-not-allowed'
                    : 'border hairline-border bg-[var(--bg-chip)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] cursor-pointer'
                }`}
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Curatorial Colophon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-12 border-t hairline-border text-[var(--text-secondary)] text-xs">
        <div className="md:col-span-4 space-y-2">
          <h4 className="text-[10px] uppercase font-sans-clean tracking-widest text-[var(--accent-primary)] font-semibold">
            CURATORIAL STATEMENT
          </h4>
          <p className="leading-relaxed">
            SONOVERSE explores machine-assisted music as an authentic editorial canvas. 
            Blending synthetic voice algorithms, harmonic tensor synthesis, and bilingual Vietnamese-English lyricism.
          </p>
        </div>

        <div className="md:col-span-4 space-y-2">
          <h4 className="text-[10px] uppercase font-sans-clean tracking-widest text-[var(--accent-primary)] font-semibold">
            SOUND & VISUAL ARCHITECTURE
          </h4>
          <p className="leading-relaxed">
            Neural composition via Suno AI & custom prompt engineering. Real-time spectral analysis powered by Web Audio API and HTML5 Canvas.
          </p>
        </div>

        <div className="md:col-span-4 space-y-2">
          <h4 className="text-[10px] uppercase font-sans-clean tracking-widest text-[var(--accent-primary)] font-semibold">
            PROVENANCE
          </h4>
          <p className="leading-relaxed font-mono text-[11px]">
            Repository: missesotericat/WaveVisualization<br />
            Curated Edition / Hanoi & Global / 2026
          </p>
        </div>
      </div>

      {/* Bottom Copyright and Footer Links */}
      <div className="mt-16 pt-8 border-t hairline-border flex flex-col sm:flex-row justify-between items-center text-[11px] uppercase tracking-widest text-[var(--text-muted)] gap-4">
        <div className="flex items-center gap-1.5 font-mono">
          <span>© 2026</span>
          <a
            href="https://phandora.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors font-medium no-underline"
          >
            Phandora.space
          </a>
          <span>— All Rights Reserved</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
            <a
              href="https://phandora.space/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors no-underline font-normal"
            >
              Terms
            </a>
            <span className="text-[var(--text-muted)] opacity-60">•</span>
            <a
              href="https://phandora.space/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors no-underline font-normal"
            >
              API / Docs
            </a>
          </div>

          <a
            href="https://phandora.gumroad.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors font-semibold no-underline"
          >
            Build a similar site like this
          </a>
        </div>
      </div>
      </div>
    </footer>
  );
};
