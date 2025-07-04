import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, List, Filter } from 'lucide-react';
import type { SearchResult } from '../../types/tmdb';
import { getSeeMoreGridLayout } from '../../utils/gridLayoutUtils';
import { getViewModeToggleTheme } from '../../utils/sectionThemes';
import { usePreferences } from '../../stores/preferencesStore';
import StandardizedThumbnail from './StandardizedThumbnail';

export interface StandardizedSeeMorePageProps {
  /** Page title */
  title: string;
  /** Items to display */
  items: SearchResult[];
  /** Back button handler */
  onBack: () => void;
  /** Item click handler */
  onItemClick: (item: SearchResult) => void;
  /** Current media filter */
  mediaFilter?: 'all' | 'movie' | 'tv';
  /** Media filter change handler */
  onMediaFilterChange?: (filter: 'all' | 'movie' | 'tv') => void;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom filter content */
  filterContent?: React.ReactNode;
  /** Whether to show media filter */
  showMediaFilter?: boolean;
  /** Whether to show view mode toggle */
  showViewModeToggle?: boolean;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Custom item renderer for list view */
  renderListItem?: (item: SearchResult, index: number) => React.ReactNode;
  /** Additional toolbar actions */
  toolbarActions?: React.ReactNode;
}

const StandardizedSeeMorePage: React.FC<StandardizedSeeMorePageProps> = ({
  title,
  items,
  onBack,
  onItemClick,
  mediaFilter = 'all',
  onMediaFilterChange,
  headerContent,
  filterContent,
  showMediaFilter = true,
  showViewModeToggle = true,
  emptyState,
  isLoading = false,
  renderListItem,
  toolbarActions
}) => {
  const { preferences, setPreferredViewMode } = usePreferences();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Use global preferred view mode instead of local state
  const viewMode = preferences.preferredViewMode;
  const setViewMode = setPreferredViewMode;
  
  const viewModeTheme = getViewModeToggleTheme();

  // Filter items based on media filter
  const filteredItems = mediaFilter === 'all' 
    ? items 
    : items.filter(item => item.media_type === mediaFilter);

  const handleFilterSelect = (filter: 'all' | 'movie' | 'tv') => {
    if (onMediaFilterChange) {
      onMediaFilterChange(filter);
    }
    setShowFilterDropdown(false);
  };

  const renderDefaultListItem = (item: SearchResult) => (
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
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Title Section with Back Button - Covers search bar area */}
        <div className="bg-black border-b border-gray-800/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button and Title */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-300 hover:text-white"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Back</span>
                </button>
                
                <div className="h-6 w-px bg-gray-700" /> {/* Separator */}
                
                <div>
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                  {headerContent}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-32">
              <div className="text-white text-lg animate-pulse">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Title Section with Back Button - Covers search bar area */}
      <div className="bg-black border-b border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-300 hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              
              <div className="h-6 w-px bg-gray-700" /> {/* Separator */}
              
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {headerContent}
              </div>
            </div>
            
            {/* Filter dropdown */}
            {showMediaFilter && onMediaFilterChange && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-2 text-gray-200 transition-colors border border-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {mediaFilter === 'all' ? 'All' : mediaFilter === 'movie' ? 'Movies' : 'TV Shows'}
                  </span>
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl z-50 border border-gray-700 overflow-hidden">
                    <div className="py-2">
                      {(['all', 'movie', 'tv'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleFilterSelect(filter)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
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
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              {filterContent}
              {toolbarActions}
            </div>
            
            {showViewModeToggle && (
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
            )}
          </div>

          {/* Content Grid/List */}
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              {emptyState || (
                <div className="text-gray-400 text-center">
                  <p className="text-lg">No content found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8">
              {viewMode === 'grid' ? (
                // Grid View
                <div className={`grid ${getSeeMoreGridLayout(filteredItems.length)} gap-4`}>
                  {filteredItems.map((item) => (
                    <StandardizedThumbnail
                      key={item.id}
                      item={item}
                      onClick={() => onItemClick(item)}
                      showOverlay={true}
                      showRating={true}
                      showMediaType={true}
                    />
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {filteredItems.map((item, index) => (
                    renderListItem ? renderListItem(item, index) : renderDefaultListItem(item)
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Backdrop click handler for dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
};

export default StandardizedSeeMorePage; 