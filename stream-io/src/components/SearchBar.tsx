import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, Clock, Trash2, Star, User, Tv, Film, Building2, ChevronRight, Loader, Brain, Sparkles, TrendingUp, Award, X } from 'lucide-react';
import { mlSearchService } from '../services/mlSearchService';
import { getContentByNetwork, getContentByPerson, getStreamingServices } from '../services/tmdb';
import type { SearchResult, StreamingService, EnhancedSearchResult, PersonResult, RecentSearch } from '../types/tmdb';
import type { MLSearchResult } from '../services/mlSearchService';
import { debounce } from 'lodash';
import MovieModal from './MovieModal';
import ActorDetailPage from './ActorDetailPage';
import { handleError, handleAsyncError } from '../services/errorHandler';
import { useI18n } from '../constants/i18n';

interface SearchBarProps {
  onFocusChange?: (isFocused: boolean) => void;
  onResultsChange?: (hasResults: boolean) => void;
  onCloseFromParent?: () => void;
  onActorView?: (isViewingActor: boolean) => void;
  currentTab?: string;
  onWatchlistSearch?: (searchTerm: string) => void;
}

// Define the ref interface
export interface SearchBarRef {
  closeSearch: () => void;
}

type ContentFilter = 'topResults' | 'movies' | 'shows' | 'actors';

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ onFocusChange, onResultsChange, onCloseFromParent, onActorView, currentTab, onWatchlistSearch }, ref) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('topResults');
  const [searchResults, setSearchResults] = useState<MLSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [streamingServices, setStreamingServices] = useState<StreamingService[] | null>(null);
  const [selectedActor, setSelectedActor] = useState<PersonResult | null>(null);
  const [isViewingActor, setIsViewingActor] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  // Enhanced actor preview state
  const [actorFilmography, setActorFilmography] = useState<Record<number, SearchResult[]>>({});
  const [loadingFilmography, setLoadingFilmography] = useState<Set<number>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search-history');
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved);
        // Check if the history has the new format with release_date/first_air_date
        const hasNewFormat = parsedHistory.length === 0 || 
          parsedHistory.some((item: any) => item.hasOwnProperty('release_date') || item.hasOwnProperty('first_air_date'));
        
        if (hasNewFormat) {
          setRecentSearches(parsedHistory);
        } else {
          // Clear old format history to allow new format to be populated
          console.log('Clearing old format search history to support release year display');
          localStorage.removeItem('search-history');
          setRecentSearches([]);
        }
      } catch (error) {
        handleError('Error loading search history:', {
          context: { error: error instanceof Error ? error.message : String(error) }
        });
        localStorage.removeItem('search-history');
        setRecentSearches([]);
      }
    }
  }, []);

  // Load actor filmography for enhanced previews
  useEffect(() => {
    const loadActorPreviews = async () => {
      const actors = getActorResults();
      for (const actor of actors.slice(0, 3)) { // Limit to top 3 actors for performance
        if (!actorFilmography[actor.id] && !loadingFilmography.has(actor.id)) {
          setLoadingFilmography(prev => new Set(prev).add(actor.id));
          
          try {
            const filmography = await getContentByPerson(actor.id);
            const topContent = filmography
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
              .slice(0, 3);
            
            setActorFilmography(prev => ({
              ...prev,
              [actor.id]: topContent
            }));
          } catch (error) {
            console.warn(`Failed to load filmography for actor ${actor.id}:`, error);
          } finally {
            setLoadingFilmography(prev => {
              const newSet = new Set(prev);
              newSet.delete(actor.id);
              return newSet;
            });
          }
        }
      }
    };

    if (searchResults && getActorResults().length > 0) {
      loadActorPreviews();
    }
  }, [searchResults, actorFilmography, loadingFilmography]);

  // Enhanced debounced search function using ML Search Service
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        onResultsChange?.(false);
        return;
      }

      try {
        // Detect if this looks like an actor search for better results
        const looksLikeActorSearch = /^[a-z\s]{2,}$/i.test(searchQuery.trim()) && 
                                   searchQuery.trim().split(' ').length >= 1 &&
                                   searchQuery.trim().split(' ').length <= 4;
        
        // Use the enhanced ML search service
        const mlResults = await mlSearchService.performMLSearch(searchQuery, {
          includePersonContent: true,
          maxResults: looksLikeActorSearch ? 16 : 12 // More results for potential actor searches
        });
        
        console.log('ML Search Results:', {
          query: searchQuery,
          confidence: mlResults.confidence,
          strategy: mlResults.searchStrategy,
          insights: mlResults.aiInsights,
          isActorSearch: looksLikeActorSearch
        });
        
        // Convert ML results to the expected format for UI compatibility
        const formattedResults: MLSearchResult = {
          ...mlResults,
          // The ML service already provides the results in the correct format
        };
        
        setSearchResults(formattedResults);
        onResultsChange?.(formattedResults.results.length > 0);
        
        // Show AI insights if available and confidence is high
        if (mlResults.aiInsights && mlResults.confidence > 0.7) {
          setShowAIInsights(true);
        }
        
      } catch (error) {
        handleAsyncError(error as Error, {
          operation: 'mlSearch',
          query: searchQuery
        });
        
        // Fallback to basic search if ML search fails
        console.warn('ML search failed, using fallback search');
        try {
          const fallbackResults = await mlSearchService.performMLSearch(searchQuery, { useFallback: true });
          setSearchResults(fallbackResults);
          onResultsChange?.(fallbackResults.results.length > 0);
        } catch (fallbackError) {
          handleAsyncError(fallbackError as Error, {
            operation: 'fallbackSearch',
            query: searchQuery
          });
          setSearchResults(null);
          onResultsChange?.(false);
        }
      }
    }, 200) // Reduced from 300ms to 200ms for faster response
  ).current;

  const handleSearchChange = (value: string) => {
    setQuery(value);
    
    // Handle watchlist search differently
    if (currentTab === 'watchlist') {
      onWatchlistSearch?.(value);
      // Don't show dropdown for watchlist search, just filter the content
      setShowDropdown(false);
      onResultsChange?.(false);
      return;
    }
    
    // Normal search behavior for other tabs
    if (value.trim()) {
      debouncedSearch(value);
      setShowDropdown(true);
    } else {
      setSearchResults(null);
      // Keep dropdown open when focused, even with no text - ensure it shows recent searches
      setShowDropdown(true);
      onResultsChange?.(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
    
    // Don't show dropdown for watchlist search
    if (currentTab === 'watchlist') {
      setShowDropdown(false);
      return;
    }
    
    setShowDropdown(true);
    // Ensure recent searches show immediately on focus even with empty query
    if (!query.trim() && !searchResults) {
      // Force re-render to show recent searches
      setShowDropdown(true);
    }
  };

  // Handle content item click (movies/shows)
  const handleItemClick = async (item: SearchResult) => {
    let newSearch: RecentSearch;
    
    if ('title' in item || 'name' in item) {
      // Movie or TV show
      newSearch = {
        id: item.id,
        title: item.title || item.name || '',
        media_type: item.media_type as 'movie' | 'tv',
        poster_path: item.poster_path,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        timestamp: Date.now(),
        query: query || ''
      };
    } else {
      return; // Skip if not a valid content item
    }

    // Add to recent searches
    const updatedHistory = [newSearch, ...recentSearches.filter(search => search.id !== item.id)].slice(0, 10);
    setRecentSearches(updatedHistory);
    localStorage.setItem('search-history', JSON.stringify(updatedHistory));

    // Get streaming services and show modal
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      const services = await getStreamingServices(item.id, item.media_type);
      setStreamingServices(services);
      setSelectedItem(item);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (item: RecentSearch) => {
    if (item.media_type === 'person') {
      // For actors, create a PersonResult object and show actor details
      const actor: PersonResult = {
        id: item.id,
        name: item.title,
        profile_path: item.profile_path || null,
        known_for_department: '',
        known_for: [],
        popularity: 0
      };
      setSelectedActor(actor);
      setIsViewingActor(true);
      setShowDropdown(false);
      onActorView?.(true);
    } else {
      // For movies/TV shows, set the search query
      setQuery(item.query);
      handleSearchChange(item.query);
    }
  };

  // Handle actor click
  const handleActorClick = (actor: SearchResult | PersonResult) => {
    // Convert SearchResult to PersonResult format if needed
    let personResult: PersonResult;
    
    if ('known_for_department' in actor && typeof actor.known_for_department === 'string' && 'name' in actor && actor.name) {
      // Already a PersonResult
      personResult = actor as PersonResult;
    } else {
      // Convert SearchResult to PersonResult format
      const searchResult = actor as SearchResult;
      personResult = {
        id: searchResult.id,
        name: searchResult.name || searchResult.title || 'Unknown',
        profile_path: searchResult.profile_path || null,
        known_for_department: searchResult.known_for_department || 'Unknown',
        known_for: searchResult.known_for || [],
        popularity: searchResult.popularity || 0
      };
    }
    
    // Add to recent searches
    const newSearch: RecentSearch = {
      id: personResult.id,
      title: personResult.name,
      media_type: 'person',
      profile_path: personResult.profile_path,
      timestamp: Date.now(),
      query: query || personResult.name
    };

    const updatedHistory = [newSearch, ...recentSearches.filter(search => search.id !== personResult.id || search.media_type !== 'person')].slice(0, 10);
    setRecentSearches(updatedHistory);
    localStorage.setItem('search-history', JSON.stringify(updatedHistory));
    
    setSelectedActor(personResult);
    setIsViewingActor(true);
    setShowDropdown(false);
    setIsFocused(false);
    onActorView?.(true);
    onFocusChange?.(false);
  };

  // Handle back from actor page
  const handleBackFromActor = () => {
    setSelectedActor(null);
    setIsViewingActor(false);
    setShowDropdown(true);
    onActorView?.(false);
  };

  // Close search
  const closeSearch = () => {
    setQuery('');
    setShowDropdown(false);
    setIsFocused(false);
    setSearchResults(null);
    onFocusChange?.(false);
    onResultsChange?.(false);
    
    // Clear watchlist search if on watchlist tab
    if (currentTab === 'watchlist') {
      onWatchlistSearch?.('');
    }
    
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Clear search history
  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('search-history');
  };

  // Handle close from parent (X button)
  useEffect(() => {
    if (onCloseFromParent && !isFocused) {
      closeSearch();
    }
  }, [onCloseFromParent, isFocused]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
        onFocusChange?.(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onFocusChange]);

  // Prevent body scroll when actor page is open
  useEffect(() => {
    if (isViewingActor) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isViewingActor]);

  // Get available filter options based on search results
  const getAvailableFilters = () => {
    if (!searchResults) return ['topResults'];
    
    const filters = ['topResults'];
    const movies = searchResults.results.filter(item => item.media_type === 'movie');
    const shows = searchResults.results.filter(item => item.media_type === 'tv');
    const actors = searchResults.results.filter(item => item.media_type === 'person');
    
    if (movies.length > 0) filters.push('movies');
    if (shows.length > 0) filters.push('shows');
    if (actors.length > 0) filters.push('actors');
    
    return filters;
  };

  // Helper functions to filter results by type
  const getMovieResults = () => {
    return searchResults?.results.filter(item => item.media_type === 'movie') || [];
  };

  const getShowResults = () => {
    return searchResults?.results.filter(item => item.media_type === 'tv') || [];
  };

  const getActorResults = () => {
    if (!searchResults) return [];
    
    const actors = searchResults.results.filter(result => result.media_type === 'person');
    
    // Detect if this is likely an actor search to show more results
    const looksLikeActorSearch = searchResults.searchStrategy.includes('actor') || 
                                searchResults.aiInsights?.queryIntent === 'actor_search' ||
                                /^[a-z\s]{2,}$/i.test(query.trim()) && 
                                query.trim().split(' ').length >= 1 &&
                                query.trim().split(' ').length <= 4;
    
    // Return more actors for actor-focused searches
    const maxActors = looksLikeActorSearch ? 8 : 5;
    return actors.slice(0, maxActors);
  };

  // Enhanced actor rendering function
  const renderEnhancedActorCard = (actor: SearchResult, index: number) => {
    const filmography = actorFilmography[actor.id] || [];
    const isLoading = loadingFilmography.has(actor.id);

    return (
      <button
        key={`actor-${actor.id}`}
        onClick={() => handleActorClick(actor)}
        className="w-full text-left p-6 hover:bg-gray-800/30 rounded-lg group transition-all duration-200 border border-transparent hover:border-purple-500/20"
      >
        <div className="flex items-start gap-4">
          {/* Actor Profile Image */}
          <div className="relative flex-shrink-0">
            {actor.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                alt={actor.name}
                className="w-16 h-16 object-cover rounded-full ring-2 ring-gray-600 group-hover:ring-purple-500 transition-all duration-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-gray-600 group-hover:ring-purple-500 transition-all duration-200">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {/* Popularity Indicator */}
            {actor.popularity && actor.popularity > 15 && (
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {Math.round(actor.popularity)}
              </div>
            )}
          </div>

          {/* Actor Information */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {actor.name}
                </h3>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <User className="w-4 h-4 mr-1" />
                  <span>{actor.known_for_department || 'Acting'}</span>
                  {actor.popularity && actor.popularity > 10 && (
                    <>
                      <span className="mx-2">•</span>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Popular</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </button>
    );
  };

  // Use useImperativeHandle to expose closeSearch method
  useImperativeHandle(ref, () => ({
    closeSearch: closeSearch
  }));

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={currentTab === 'watchlist' ? 'Search your lists by title, genre, or list name...' : 'Search movies, TV shows, actors, networks...'}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          className={`w-full pl-10 ${query.length > 0 ? 'pr-10' : 'pr-4'} py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-medium placeholder-gray-500 focus:outline-none transition-all duration-200 caret-purple-500 ${
            isFocused 
              ? 'shadow-lg ring-2 ring-purple-500 border-transparent' 
              : 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          }`}
        />
        {query.length > 0 && (
          <button
            onClick={closeSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:text-white"
            aria-label="Clear search"
          >
            <X className="w-full h-full" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && isFocused && currentTab !== 'watchlist' && (
        <div
          ref={dropdownRef}
          className="absolute left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
          style={{ 
            top: 'calc(100% + 0.75rem)',
            width: '100vw',
            maxWidth: 'min(100vw - 3rem, 80rem)' // Same max-width as hero section with padding
          }}
        >
          {/* Recent Searches */}
          {!searchResults && recentSearches.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Searches
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((item) => (
                  <button
                    key={`recent-${item.id}-${item.timestamp}`}
                    onClick={() => handleRecentSearchClick(item)}
                    className="w-full text-left p-2 hover:bg-gray-800 rounded flex items-center gap-3 text-sm"
                  >
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        className="w-8 h-12 object-cover rounded"
                      />
                    ) : item.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.profile_path}`}
                        alt={item.title}
                        className="w-8 h-8 object-cover rounded-full"
                      />
                    ) : item.logo_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.logo_path}`}
                        alt={item.title}
                        className="w-8 h-6 object-contain"
                      />
                    ) : (
                      <div className={`bg-gray-700 flex items-center justify-center ${
                        item.media_type === 'person' 
                          ? 'w-8 h-8 rounded-full' 
                          : item.media_type === 'network'
                          ? 'w-8 h-6 rounded'
                          : 'w-8 h-12 rounded'
                      }`}>
                        {item.media_type === 'person' ? (
                          <User className="w-4 h-4 text-gray-400" />
                        ) : item.media_type === 'network' ? (
                          <Building2 className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Film className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{item.title}</div>
                      <div className="text-gray-400 text-xs capitalize">
                        {item.media_type === 'person' ? 'Actor' : item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                      </div>
                      {(item.release_date || item.first_air_date) && (
                        <div className="text-gray-500 text-xs">
                          {new Date(item.release_date || item.first_air_date || '').getFullYear()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Recent Searches Message */}
          {!searchResults && recentSearches.length === 0 && (
            <div className="px-6 py-8 relative z-[10000]">
              <div className="text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <div className="text-sm font-medium mb-1">No recent searches</div>
                <div className="text-xs text-gray-500">Start typing to search for movies, TV shows, actors, or networks</div>
              </div>
            </div>
          )}

          {/* Search Results - Only show if we have enhanced results */}
          {searchResults && (
            <div className="px-6 py-4">
              {/* Content Filter - Only show available filters */}
              {getAvailableFilters().length > 1 && (
                <div className="flex gap-2 mb-6 pb-4 border-b border-gray-800">
                  {getAvailableFilters().map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setContentFilter(filter as ContentFilter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        contentFilter === filter
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                          : 'bg-gray-800/50 text-gray-400 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500'
                      }`}
                    >
                      {filter === 'topResults' ? 'Top Results' : 
                       filter === 'movies' ? 'Movies' : 
                       filter === 'shows' ? 'TV Shows' : 'Actors'}
                    </button>
                  ))}
                </div>
              )}

              {/* Movies Section */}
              {(contentFilter === 'topResults' || contentFilter === 'movies') && getMovieResults().length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Movies ({getMovieResults().length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {getMovieResults().slice(0, 8).map((movie) => (
                      <button
                        key={`movie-${movie.id}`}
                        onClick={() => handleItemClick(movie)}
                        className="w-full text-left p-4 hover:bg-gray-800/50 rounded-lg flex items-center gap-4 group transition-all duration-200"
                      >
                        <div className="relative flex-shrink-0">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              className="w-12 h-18 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-18 bg-gray-700 rounded flex items-center justify-center">
                              <Film className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium group-hover:text-purple-400 transition-colors">
                            {movie.title}
                          </div>
                          <div className="text-gray-400 text-sm">Movie</div>
                          {movie.release_date && (
                            <div className="text-gray-500 text-xs">
                              {new Date(movie.release_date).getFullYear()}
                            </div>
                          )}
                          {movie.vote_average && movie.vote_average > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-400">{movie.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TV Shows Section */}
              {(contentFilter === 'topResults' || contentFilter === 'shows') && getShowResults().length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    TV Shows ({getShowResults().length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {getShowResults().slice(0, 8).map((show) => (
                      <button
                        key={`show-${show.id}`}
                        onClick={() => handleItemClick(show)}
                        className="w-full text-left p-4 hover:bg-gray-800/50 rounded-lg flex items-center gap-4 group transition-all duration-200"
                      >
                        <div className="relative flex-shrink-0">
                          {show.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                              alt={show.name}
                              className="w-12 h-18 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-18 bg-gray-700 rounded flex items-center justify-center">
                              <Tv className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium group-hover:text-purple-400 transition-colors">
                            {show.name}
                          </div>
                          <div className="text-gray-400 text-sm">TV Show</div>
                          {show.first_air_date && (
                            <div className="text-gray-500 text-xs">
                              {new Date(show.first_air_date).getFullYear()}
                            </div>
                          )}
                          {show.vote_average && show.vote_average > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-400">{show.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Actors Section */}
              {(contentFilter === 'topResults' || contentFilter === 'actors') && getActorResults().length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Actors ({getActorResults().length})
                  </h3>
                  <div className="space-y-3">
                    {getActorResults().map((actor, index) => renderEnhancedActorCard(actor, index))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {getMovieResults().length === 0 && getShowResults().length === 0 && getActorResults().length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-lg mb-2">No results found</div>
                  <div className="text-sm">Try searching for different content, actors, or networks</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movie Modal */}
      {selectedItem && streamingServices && (
        <MovieModal
          item={selectedItem}
          streamingServices={streamingServices}
          onClose={() => {
            setSelectedItem(null);
            setStreamingServices(null);
          }}
        />
      )}

      {/* Actor Detail Page */}
      {isViewingActor && selectedActor && (
        <div className="fixed inset-0 bg-gray-950 z-50 overflow-y-auto" style={{ height: '100vh' }}>
          <div className="min-h-full">
            <ActorDetailPage
              actor={selectedActor}
              onBack={handleBackFromActor}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchBar;