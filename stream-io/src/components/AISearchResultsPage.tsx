import React, { useState } from 'react';
import { ArrowLeft, Wand2, Filter, LayoutGrid, List } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';
import type { AISearchResult } from '../services/aiSearchService';
import { getSeeMoreGridLayout } from '../utils/gridLayoutUtils';
import { getViewModeToggleTheme } from '../utils/sectionThemes';
import StandardizedThumbnail from './shared/StandardizedThumbnail';

export interface AISearchResultsPageProps {
  /** AI search result data */
  searchResult: AISearchResult;
  /** Back button handler */
  onBack: () => void;
  /** Item click handler */
  onItemClick: (item: SearchResult) => void;
  /** Loading state */
  isLoading?: boolean;
}

const AISearchResultsPage: React.FC<AISearchResultsPageProps> = ({
  searchResult,
  onBack,
  onItemClick,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  
  const viewModeTheme = getViewModeToggleTheme();

  // Filter items based on media filter
  const filteredItems = mediaFilter === 'all' 
    ? searchResult.results 
    : searchResult.results.filter(item => item.media_type === mediaFilter);

  const handleFilterSelect = (filter: 'all' | 'movie' | 'tv') => {
    setMediaFilter(filter);
    setShowFilterDropdown(false);
  };

  const renderListItem = (item: SearchResult) => (
    <div
      key={item.id}
      className="relative flex items-center space-x-4 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
    >
      <StandardizedThumbnail
        item={item}
        size="sm"
        onClick={() => onItemClick(item)}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg line-clamp-1">
              {item.title || item.name}
            </h3>
            
            {item.overview && (
              <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                {item.overview}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-2">
              {item.vote_average && item.vote_average > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-gray-300 text-sm">{item.vote_average.toFixed(1)}</span>
                </div>
              )}
              
              {(item.release_date || item.first_air_date) && (
                <span className="text-gray-400 text-sm">
                  {new Date(item.release_date || item.first_air_date || '').getFullYear()}
                </span>
              )}
              
              <span className="bg-purple-600/80 text-white text-xs px-2 py-1 rounded-md">
                {item.media_type === 'movie' ? 'Movie' : 'TV'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => {
    const gridLayout = getSeeMoreGridLayout(filteredItems.length);
    
    return (
      <div className={`grid ${gridLayout} gap-4`}>
        {filteredItems.map((item) => (
          <StandardizedThumbnail
            key={item.id}
            item={item}
            size="md"
            onClick={() => onItemClick(item)}
            showOverlay={true}
            showRating={true}
            showMediaType={true}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="fixed top-0 left-0 right-0 bg-toolbar border-b toolbar-height toolbar-padding z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid items-center gap-4 h-full grid-cols-[auto_1fr_auto]">
              <div className="flex justify-start">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-toolbar-hover rounded-xl transition-colors text-gray-300 hover:text-white"
                  aria-label="Go back"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-sm font-medium">Back</span>
                  </div>
                </button>
              </div>
              
              <div className="flex justify-center px-4">
                <div className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5 text-purple-400 animate-pulse" />
                  <h1 className="text-xl font-bold text-white">AI Search</h1>
                </div>
              </div>
              
              <div className="flex justify-end">
                {/* Empty space for layout in loading state */}
              </div>
            </div>
          </div>
        </header>

        <main className="pt-[calc(60px+1rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <div className="text-white text-lg animate-pulse">Analyzing your request...</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-toolbar border-b toolbar-height toolbar-padding z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid items-center gap-4 h-full grid-cols-[auto_1fr_auto]">
            <div className="flex justify-start">
              <button
                onClick={onBack}
                className="p-2 hover:bg-toolbar-hover rounded-xl transition-colors text-gray-300 hover:text-white"
                aria-label="Go back"
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-6 h-6" />
                  <span className="text-sm font-medium">Back</span>
                </div>
              </button>
            </div>
            
            <div className="flex justify-center px-4">
              <div className="w-full" style={{ maxWidth: 'min(100vw - 6rem, 80rem)' }}>
                <div className="flex items-center justify-center space-x-2">
                  <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <h1 className="text-xl font-bold text-white truncate">{searchResult.query}</h1>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              {/* Filter dropdown - moved from content area to header */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl px-4 py-2 text-gray-200 transition-colors border border-gray-800/20"
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">
                    {mediaFilter === 'all' ? 'All' : mediaFilter === 'movie' ? 'Movies' : 'TV Shows'}
                  </span>
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
                    <div className="py-2">
                      {['all', 'movie', 'tv'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleFilterSelect(filter as 'all' | 'movie' | 'tv')}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-toolbar-hover transition-colors ${
                            mediaFilter === filter ? 'text-purple-400' : 'text-gray-200'
                          }`}
                        >
                          {filter === 'all' ? 'All Content' : filter === 'movie' ? 'Movies' : 'TV Shows'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[calc(60px+1rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toolbar - Layout switcher on right side to match see more pages */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {/* Left side - can add additional controls here if needed */}
            </div>
            
            {/* View mode toggle - moved to right side */}
            <div className={viewModeTheme.container}>
              <button
                onClick={() => setViewMode('list')}
                className={`${viewModeTheme.button} ${
                  viewMode === 'list' ? viewModeTheme.activeButton : viewModeTheme.inactiveButton
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`${viewModeTheme.button} ${
                  viewMode === 'grid' ? viewModeTheme.activeButton : viewModeTheme.inactiveButton
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or removing filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {viewMode === 'list' ? (
                filteredItems.map((item) => renderListItem(item))
              ) : (
                renderGridView()
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
};

export default AISearchResultsPage; 