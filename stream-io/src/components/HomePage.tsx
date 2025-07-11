import React, { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModal } from '../stores';
import { 
  getTrending,
  getTopContent, 
  getNewContent, 
  getExpiringContent, 
  getRandomPicks, 
  getBingeworthy, 
  getTopSearches, 
  getHiddenGems,
  getGenreContent,
  getStreamingServices,
  getTrendingWithStreamingFilter
} from '../services/tmdb';
import PersonalizedSection from './PersonalizedSection';
import HeroSection, { HeroSectionRef } from './HeroSection';
import MovieModal from './MovieModal';
import StandardizedSectionContainer from './shared/StandardizedSectionContainer';
import StandardizedSeeMorePage from './shared/StandardizedSeeMorePage';
import BoltBadge from './shared/BoltBadge';
import { usePreferences } from '../stores';
import { GENRES } from '../constants/genres';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useI18n } from '../constants/i18n';
import type { SearchResult, StreamingService } from '../types/tmdb';

// Lazy load ContentSection for better performance
const ContentSection = React.lazy(() => import('./ContentSection'));

interface HomePageProps {
  selectedFilter: 'all' | 'movie' | 'tv';
  isPaused?: boolean;
  onHeroVisibilityChange?: (isVisible: boolean) => void;
}

// Loading fallback for content sections
const SectionLoadingFallback: React.FC = () => (
  <div className="animate-pulse bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl">
    <div className="space-y-4">
      <div className="h-6 bg-gray-800 rounded w-1/3"></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const HomePage: React.FC<HomePageProps> = ({ selectedFilter, isPaused: externalIsPaused = false, onHeroVisibilityChange }) => {
  console.log('🏠 HomePage component rendering with props:', { selectedFilter, externalIsPaused, onHeroVisibilityChange });
  
  const { preferences } = usePreferences();
  const { isItemInWatchlist, isInHidden, lastAddedMovie, lastAddedShow } = useWatchlistStore();
  const { t } = useI18n();
  const { isOpen, openModal, closeModal } = useModal();
  
  console.log('🏠 HomePage preferences:', preferences);
  console.log('🏠 HomePage selected_genres:', preferences?.selected_genres);
  console.log('🏠 HomePage selected_services:', preferences?.selected_services);
  
  // Add TMDB API test on component mount
  useEffect(() => {
    console.log('🧪 Testing TMDB API directly...');
    console.log('🧪 Environment variables:', {
      VITE_TMDB_ACCESS_TOKEN: import.meta.env.VITE_TMDB_ACCESS_TOKEN?.substring(0, 20) + '...',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV
    });
    
    // Test getTrending function directly
    getTrending('movie').then(results => {
      console.log('🧪 Direct getTrending test results:', {
        success: true,
        count: results.length,
        sampleItems: results.slice(0, 3).map(r => ({ 
          id: r.id, 
          title: r.title || r.name, 
          media_type: r.media_type 
        }))
      });
    }).catch(error => {
      console.error('🧪 Direct getTrending test failed:', error);
    });
  }, []);
  
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [streamingData, setStreamingData] = useState<Record<number, StreamingService[]>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSeeMorePage, setShowSeeMorePage] = useState(false);
  const [seeMoreSection, setSeeMoreSection] = useState<{title: string; items: SearchResult[]} | null>(null);
  const heroSectionRef = useRef<HeroSectionRef>(null);
  const heroObserverRef = useRef<HTMLDivElement>(null);
  const [isHeroInView, setIsHeroInView] = useState(true);

  // Map selected genre IDs to TMDB IDs
  const selectedTmdbGenres = useMemo(() => {
    if (!preferences?.selected_genres) return [];
    return preferences.selected_genres
      .map((genreId: string) => GENRES.find(g => g.id === genreId)?.tmdbId)
      .filter((id): id is number => typeof id === 'number');
  }, [preferences?.selected_genres]);

  // Fetch trending data with streaming filter for "Trending Near You"
  const { data: trendingNearYouData = [] } = useQuery({
    queryKey: ['trending-near-you', selectedFilter, preferences?.selected_services],
    queryFn: () => getTrendingWithStreamingFilter(selectedFilter === 'movie' ? 'movie' : 'tv', preferences?.selected_services || []),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch general trending data for "Curated For You" 
  const { data: curatedForYouData = [] } = useQuery({
    queryKey: ['curated-for-you', selectedFilter],
    queryFn: () => getTrending(selectedFilter === 'movie' ? 'movie' : 'tv'),
    staleTime: 5 * 60 * 1000,
  });

  // Optimize queries with better stale times and selective enabling
  const { data: topMovies = [] } = useQuery({
    queryKey: ['top-movies'],
    queryFn: () => getTopContent('movie'),
    enabled: selectedFilter === 'all' || selectedFilter === 'movie',
    staleTime: 10 * 60 * 1000,
  });

  const { data: topShows = [] } = useQuery({
    queryKey: ['top-shows'],
    queryFn: () => getTopContent('tv'),
    enabled: selectedFilter === 'all' || selectedFilter === 'tv',
    staleTime: 10 * 60 * 1000,
  });

  const { data: newContent = [] } = useQuery({
    queryKey: ['new-content'],
    queryFn: getNewContent,
    staleTime: 15 * 60 * 1000,
  });

  const { data: expiringContent = [] } = useQuery({
    queryKey: ['expiring'],
    queryFn: getExpiringContent,
    staleTime: 30 * 60 * 1000,
  });

  const { data: randomPicks = [] } = useQuery({
    queryKey: ['random'],
    queryFn: getRandomPicks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: bingeworthy = [] } = useQuery({
    queryKey: ['bingeworthy'],
    queryFn: getBingeworthy,
    staleTime: 15 * 60 * 1000,
  });

  const { data: topSearches = [] } = useQuery({
    queryKey: ['top-searches'],
    queryFn: getTopSearches,
    staleTime: 10 * 60 * 1000,
  });

  const { data: hiddenGems = [] } = useQuery({
    queryKey: ['hidden-gems'],
    queryFn: getHiddenGems,
    staleTime: 30 * 60 * 1000,
  });

  // TODO: Implement similar content based on recently added items
  // For now, disable similar content sections until we can track recently added items
  const similarToMovie = { movies: [], shows: [] };
  const similarToShow = { movies: [], shows: [] };

  // Fix genre queries - remove useMemo wrapper and create queries directly
  const genreQuery1 = useQuery({
    queryKey: ['genre', selectedTmdbGenres[0]],
    queryFn: () => getGenreContent(selectedTmdbGenres[0]?.toString() || ''),
    enabled: selectedTmdbGenres.length > 0 && !!selectedTmdbGenres[0],
    staleTime: 10 * 60 * 1000,
  });

  const genreQuery2 = useQuery({
    queryKey: ['genre', selectedTmdbGenres[1]],
    queryFn: () => getGenreContent(selectedTmdbGenres[1]?.toString() || ''),
    enabled: selectedTmdbGenres.length > 1 && !!selectedTmdbGenres[1],
    staleTime: 10 * 60 * 1000,
  });

  const genreQuery3 = useQuery({
    queryKey: ['genre', selectedTmdbGenres[2]],
    queryFn: () => getGenreContent(selectedTmdbGenres[2]?.toString() || ''),
    enabled: selectedTmdbGenres.length > 2 && !!selectedTmdbGenres[2],
    staleTime: 10 * 60 * 1000,
  });

  // Create genre queries array for rendering
  const genreQueries = [genreQuery1, genreQuery2, genreQuery3].filter((_, index) => 
    index < selectedTmdbGenres.length && selectedTmdbGenres[index]
  );

  // Intersection Observer for Hero Section
  useEffect(() => {
    if (!heroObserverRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.3; // At least 30% visible
        setIsHeroInView(isVisible);
        
        // Notify parent component about hero visibility change
        onHeroVisibilityChange?.(isVisible);
        
        console.log('Hero section visibility changed:', { 
          isIntersecting: entry.isIntersecting, 
          intersectionRatio: entry.intersectionRatio, 
          isVisible 
        });
      },
      {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0], // Multiple thresholds for accurate detection
        rootMargin: '-50px 0px -50px 0px' // Add some margin to trigger earlier
      }
    );

    observer.observe(heroObserverRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onHeroVisibilityChange]);

  const handleHeroClick = async (item: SearchResult) => {
    console.log('Hero click handler called with item:', item);
    setSelectedItem(item);
    if (!streamingData[item.id] && (item.media_type === 'movie' || item.media_type === 'tv')) {
      console.log('Fetching streaming services for:', item.id, item.media_type);
      const services = await getStreamingServices(item.id, item.media_type);
      console.log('Retrieved streaming services:', services);
      setStreamingData(prev => ({ ...prev, [item.id]: services }));
    }
  };

  const handleModalClose = () => {
    if (selectedItem && heroSectionRef.current) {
      heroSectionRef.current.handleModalClose(selectedItem.id);
    }
    setSelectedItem(null);
  };

  // See More handlers
  const handleSeeMoreClick = (title: string, items: SearchResult[]) => {
    setSeeMoreSection({ title, items });
    setShowSeeMorePage(true);
  };

  const handleBackFromSeeMore = () => {
    setShowSeeMorePage(false);
    setSeeMoreSection(null);
  };

  // Filter out hidden items with memoization for performance
  const filterItems = useMemo(() => (items: SearchResult[]) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => !isInHidden(item.id));
  }, [isInHidden]);

  // When showing see more page, render it as a dedicated full-screen page
  if (showSeeMorePage && seeMoreSection) {
    const SeeMorePageWrapper = () => {
      const [localFilter, setLocalFilter] = useState<'all' | 'movie' | 'tv'>(selectedFilter);
      
      return (
        <>
          <StandardizedSeeMorePage
            title={seeMoreSection.title}
            items={seeMoreSection.items}
            mediaFilter={localFilter}
            onMediaFilterChange={setLocalFilter}
            showMediaFilter={true}
            onBack={handleBackFromSeeMore}
            onItemClick={async (item) => {
              try {
                if (item.media_type === 'movie' || item.media_type === 'tv') {
                  const services = await getStreamingServices(item.id, item.media_type);
                  setStreamingData(prev => ({ ...prev, [item.id]: services }));
                  setSelectedItem(item);
                }
              } catch (error) {
                console.error('Error fetching streaming services:', error);
              }
            }}
          />
          
          {selectedItem && streamingData[selectedItem.id] && (
            <MovieModal
              item={selectedItem}
              streamingServices={streamingData[selectedItem.id]}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </>
      );
    };
    
    return <SeeMorePageWrapper />;
  }

  const renderPersonalizedContent = () => {
    const sections = [];

    // Personalized recommendations - add null checks
    if (lastAddedMovie && similarToMovie?.movies && Array.isArray(similarToMovie.movies) && similarToMovie.movies.length > 0) {
      const filteredMovies = filterItems(similarToMovie.movies);
      if (filteredMovies.length > 0) {
        sections.push(
          <Suspense key="similar-to-movie" fallback={<SectionLoadingFallback />}>
            <ContentSection
              title={`Because You Added ${lastAddedMovie.title || ''}`}
              items={filteredMovies}
              selectedFilter={selectedFilter}
              isExpanded={expandedSection === "similar-to-movie"}
              onExpandedChange={(expanded) => setExpandedSection(expanded ? "similar-to-movie" : null)}
              onSeeMoreClick={() => handleSeeMoreClick(`Because You Added ${lastAddedMovie.title || ''}`, filteredMovies)}
            />
          </Suspense>
        );
      }
    }

    if (lastAddedShow && similarToShow?.shows && Array.isArray(similarToShow.shows) && similarToShow.shows.length > 0) {
      const filteredShows = filterItems(similarToShow.shows);
      if (filteredShows.length > 0) {
        sections.push(
          <Suspense key="similar-to-show" fallback={<SectionLoadingFallback />}>
            <ContentSection
              title={`Because You Added ${lastAddedShow.title || ''}`}
              items={filteredShows}
              selectedFilter={selectedFilter}
              isExpanded={expandedSection === "similar-to-show"}
              onExpandedChange={(expanded) => setExpandedSection(expanded ? "similar-to-show" : null)}
              onSeeMoreClick={() => handleSeeMoreClick(`Because You Added ${lastAddedShow.title || ''}`, filteredShows)}
            />
          </Suspense>
        );
      }
    }

    return sections.length > 0 ? sections : null;
  };

  const renderGenreContent = () => {
    return genreQueries.map((query, index) => {
      const genreId = selectedTmdbGenres[index];
      const genre = GENRES.find(g => g.tmdbId === genreId);
      
      // Add safety checks for query data
      if (!genre || !query || query.isLoading || !query.data || !Array.isArray(query.data) || query.data.length === 0) {
        return null;
      }

      const filteredItems = filterItems(query.data);
      if (filteredItems.length === 0) return null;

      return (
        <Suspense key={genreId} fallback={<SectionLoadingFallback />}>
          <ContentSection
            title={`Because You Like ${genre.name}`}
            items={filteredItems}
            selectedFilter={selectedFilter}
            isExpanded={expandedSection === `genre-${genreId}`}
            onExpandedChange={(expanded) => setExpandedSection(expanded ? `genre-${genreId}` : null)}
            onSeeMoreClick={() => handleSeeMoreClick(`Because You Like ${genre.name}`, filteredItems)}
          />
        </Suspense>
      );
    }).filter(Boolean); // Remove null entries
  };

  const renderStandardSections = () => {
    const sections = [
      // 1. Trending Near You
      { key: 'trending-near-you', title: t('content.trending_near_you'), data: filterItems(trendingNearYouData || []), showTrending: true },
      // 2. Curated For You  
      { key: 'curated-for-you', title: t('content.curated_for_you'), data: filterItems(curatedForYouData || []), showTrending: true },
      // 3. Newly Added
      { key: 'newly-added', title: t('content.newly_added'), data: filterItems(newContent || []), showDateAdded: true },
      // 4. Leaving Soon
      { key: 'leaving-soon', title: t('content.leaving_soon'), data: filterItems(expiringContent || []), showExpiring: true },
      // 5. BingeWorthy
      { key: 'bingeworthy', title: t('content.bingeworthy'), data: filterItems(bingeworthy || []) },
      // 6. Because You Like <genres> will be rendered by renderGenreContent() in the right position
      // 7. Top Searches
      { key: 'top-searches', title: t('content.top_searches'), data: filterItems(topSearches || []) },
      // 8. Top Movies
      { key: 'top-movies', title: t('content.top_movies'), data: filterItems(topMovies || []) },
      // 9. Top TV Shows
      { key: 'top-shows', title: t('content.top_shows'), data: filterItems(topShows || []) },
      // 10. Random Picks
      { key: 'random-picks', title: t('content.random_picks'), data: filterItems(randomPicks || []) },
      // 11. Hidden Gems
      { key: 'hidden-gems', title: t('content.hidden_gems'), data: filterItems(hiddenGems || []) }
    ];

    return sections.map(section => {
      // Add safety check for section data
      if (!section.data || !Array.isArray(section.data) || section.data.length === 0) {
        return null;
      }

      return (
        <Suspense key={section.key} fallback={<SectionLoadingFallback />}>
          <ContentSection
            title={section.title}
            items={section.data}
            selectedFilter={selectedFilter}
            showTrending={section.showTrending}
            showExpiring={section.showExpiring}
            showDateAdded={section.showDateAdded}
            isExpanded={expandedSection === section.key}
            onExpandedChange={(expanded) => setExpandedSection(expanded ? section.key : null)}
            onSeeMoreClick={() => handleSeeMoreClick(section.title, section.data)}
          />
        </Suspense>
      );
    }).filter(Boolean); // Remove null entries
  };

  const renderSectionsInOrder = () => {
    const allSections = [];
    const standardSections = renderStandardSections();
    const genreContent = renderGenreContent();

    // Render sections 1-5 (Trending Near You through BingeWorthy)
    for (let i = 0; i < 5; i++) {
      if (standardSections[i]) {
        allSections.push(standardSections[i]);
      }
    }

    // 6. Because You Like <genres> sections
    allSections.push(...genreContent);

    // Render sections 7-11 (Top Searches through Hidden Gems)
    for (let i = 5; i < standardSections.length; i++) {
      if (standardSections[i]) {
        allSections.push(standardSections[i]);
      }
    }

    return allSections;
  };

  return (
    <div className="min-h-screen bg-black pb-20 sm:pb-24">
      {/* Content Container with consistent width constraints */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto pt-2 space-y-8">
        {/* Hero Section with Intersection Observer */}
        <div ref={heroObserverRef}>
          <HeroSection
            ref={heroSectionRef}
            onPlay={handleHeroClick}
            selectedFilter={selectedFilter}
            isPaused={externalIsPaused || isOpen || expandedSection !== null || !isHeroInView}
          />
        </div>

        {/* Content Sections in Specified Order */}
        {renderSectionsInOrder()}
        {renderPersonalizedContent()}
      </div>

      {/* Movie Modal */}
      {selectedItem && streamingData[selectedItem.id] && (
        <MovieModal
          item={selectedItem}
          streamingServices={streamingData[selectedItem.id]}
          onClose={handleModalClose}
        />
      )}

      {/* Floating Bolt Badge */}
      <BoltBadge />
    </div>
  );
};

export default HomePage;