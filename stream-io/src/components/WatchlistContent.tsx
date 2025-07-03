import React, { useState, useMemo, Suspense } from 'react';
import { Grid3X3, List } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';
import { useWatchlistStore } from '../stores/watchlistStore';
import MovieModal from './MovieModal';
import StandardizedSeeMorePage from './shared/StandardizedSeeMorePage';
import ContentSection from './ContentSection';

interface WatchlistContentProps {
  selectedFilter: 'all' | 'movie' | 'tv';
  searchTerm?: string;
}

// Loading fallback component
const WatchlistLoadingFallback: React.FC = () => (
  <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl">
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-800 rounded w-1/3"></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const WatchlistContent: React.FC<WatchlistContentProps> = ({ selectedFilter, searchTerm = '' }) => {
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // See More page state 
  const [seeMoreSection, setSeeMoreSection] = useState<{
    listId: string;
    title: string;
    items: SearchResult[];
  } | null>(null);
  const [seeMoreFilter, setSeeMoreFilter] = useState<'all' | 'movie' | 'tv'>('all');
  
  const { watchlists, removeFromWatchlist } = useWatchlistStore();

  // Memoized genre mapping
  const genreMap = useMemo(() => ({
    // Movie genres
    28: 'Action',
    12: 'Adventure', 
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    // TV genres
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics'
  } as Record<number, string>), []);

  // Convert watchlist items to SearchResult format
  const convertToSearchResult = useMemo(() => {
    return (item: any): SearchResult => ({
      id: item.tmdb_id,
      title: item.title,
      name: item.title,
      media_type: item.media_type,
      poster_path: item.poster_path,
      backdrop_path: item.poster_path, // Use poster as backdrop if needed
      overview: '',
      release_date: item.release_date,
      first_air_date: item.release_date,
      vote_average: item.rating || 0,
      vote_count: 0,
      genre_ids: [], // We'll need to handle genres differently
      popularity: 0
    });
  }, []);

  // Transform watchlists to match old customLists structure
  const customLists = useMemo(() => {
    return watchlists.map(watchlist => ({
      id: watchlist.id,
      name: watchlist.name,
      isDefault: watchlist.is_default,
      items: (watchlist.items || []).map(convertToSearchResult)
    }));
  }, [watchlists, convertToSearchResult]);

  // Optimized search function with memoization
  const searchInWatchlistItems = useMemo(() => {
    return (items: SearchResult[], searchTerm: string) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return items.filter((item) => {
        // Search by title/name
        const title = (item.title || item.name || '').toLowerCase();
        if (title.includes(lowerSearchTerm)) return true;
        
        // Search by genres (if available)
        if (item.genre_ids && item.genre_ids.length > 0) {
          const genreMatch = item.genre_ids.some(genreId => {
            const genreName = genreMap[genreId];
            if (genreName && genreName.toLowerCase().includes(lowerSearchTerm)) {
              return true;
            }
            // Also check for partial matches in compound genre names
            if (genreName && genreName.toLowerCase().split(' ').some((word: string) => 
              word.includes(lowerSearchTerm) || lowerSearchTerm.includes(word)
            )) {
              return true;
            }
            return false;
          });
          if (genreMatch) return true;
        }
        
        // Search by overview/description
        if (item.overview && item.overview.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        return false;
      });
    };
  }, [genreMap]);

  // Memoized lists organization
  const { allLists } = useMemo(() => {
    const defaultLists = customLists.filter(list => list.isDefault ?? false).sort((a, b) => {
      if (a.id === 'favorite') return -1;
      if (b.id === 'favorite') return 1;
      if (a.id === 'watch-later') return -1;
      if (b.id === 'watch-later') return 1;
      if (a.id === 'watched-already') return -1;
      if (b.id === 'watched-already') return 1;
      return 0;
    });
    const userLists = customLists.filter(list => !(list.isDefault ?? false));
    const allLists = [...defaultLists, ...userLists];
    
    return { defaultLists, userLists, allLists };
  }, [customLists]);

  // Memoized filtered items function
  const getFilteredItems = useMemo(() => {
    return (list: any, filterOverride?: 'all' | 'movie' | 'tv') => {
      const activeFilter = filterOverride !== undefined ? filterOverride : selectedFilter;
      
      // Ensure items exists and is an array
      const items = list.items || [];
      
      let filteredItems = items.filter((item: SearchResult) => {
        if (activeFilter === 'all') return true;
        return item.media_type === activeFilter;
      });
      
      // Apply search filter if searching
      if (searchTerm.trim().length > 0) {
        filteredItems = searchInWatchlistItems(filteredItems, searchTerm);
      }
      
      return filteredItems;
    };
  }, [selectedFilter, searchInWatchlistItems, searchTerm]);

  // Memoized visible lists
  const getVisibleLists = useMemo(() => {
    return () => {
      if (searchTerm.trim().length > 0) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return allLists.filter(list => {
          // Check if list title matches search term
          const listTitleMatch = list.name.toLowerCase().includes(lowerSearchTerm);
          
          // Check if any items in the list match search criteria
          const filteredItems = getFilteredItems(list);
          const hasMatchingItems = filteredItems.length > 0;
          
          // Show list if either the list title matches or it has matching items
          return listTitleMatch || hasMatchingItems;
        });
      }
      return allLists.filter(list => (list.items || []).length > 0);
    };
  }, [allLists, getFilteredItems, searchTerm]);

  // Handle See More for individual sections
  const handleSeeMoreClick = (listId: string) => {
    const list = allLists.find(l => l.id === listId);
    if (list) {
      const filteredItems = getFilteredItems(list);
      setSeeMoreSection({
        listId: listId,
        title: list.name,
        items: filteredItems
      });
      setSeeMoreFilter(selectedFilter);
    }
  };

  const handleBackFromSeeMore = () => {
    setSeeMoreSection(null);
    setSeeMoreFilter('all');
  };

  // Handle section expand/collapse
  const handleSectionExpand = (listId: string, expanded: boolean) => {
    setExpandedSection(expanded ? listId : null);
  };

  const visibleLists = getVisibleLists();

  // Show See More page when requested
  if (seeMoreSection) {
    const getSeeMoreFilteredItems = () => {
      let items = seeMoreSection.items;
      if (seeMoreFilter !== 'all') {
        items = seeMoreSection.items.filter(item => item.media_type === seeMoreFilter);
      }
      return items;
    };

    const seeMoreItems = getSeeMoreFilteredItems();

    return (
      <StandardizedSeeMorePage
        title={seeMoreSection.title}
        items={seeMoreItems}
        mediaFilter={seeMoreFilter}
        onMediaFilterChange={setSeeMoreFilter}
        showMediaFilter={true}
        onBack={handleBackFromSeeMore}
        onItemClick={(item: SearchResult) => setSelectedItem(item)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 sm:pb-24">
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {visibleLists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              {searchTerm.trim().length > 0 ? 'No items found matching your search.' : 'Your watchlist is empty.'}
            </div>
            {searchTerm.trim().length === 0 && (
              <p className="text-gray-500">
                Start adding movies and TV shows to organize your viewing.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {visibleLists.map(list => {
              const filteredItems = getFilteredItems(list);
              
              if (filteredItems.length === 0) return null;

              return (
                <Suspense key={list.id} fallback={<WatchlistLoadingFallback />}>
                  <ContentSection
                    title={list.name}
                    items={filteredItems}
                    selectedFilter={selectedFilter}
                    isExpanded={expandedSection === list.id}
                    onExpandedChange={(expanded) => handleSectionExpand(list.id, expanded)}
                    onSeeMoreClick={() => handleSeeMoreClick(list.id)}
                  />
                </Suspense>
              );
            })}
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedItem && (
        <MovieModal
          item={selectedItem}
          streamingServices={[]}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default WatchlistContent;