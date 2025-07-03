import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { usePreferences } from '../stores/preferencesStore';
import { TV_PROVIDERS } from '../data/tvProviders';
import type { SearchResult } from '../types/tmdb';
import MovieModal from './MovieModal';

// Lazy load sub-components for better performance
const LiveFeaturedTab = React.lazy(() => import('./live/LiveFeaturedTab'));
const LiveTVGuideTab = React.lazy(() => import('./live/LiveTVGuideTab'));

type LiveFilter = string;

interface LiveContentProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  showFilterDropdown: boolean;
  onShowFilterDropdown: (show: boolean) => void;
}

// Loading fallback for tab components
const TabLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

const LiveContent: React.FC<LiveContentProps> = ({ 
  selectedFilter, 
  onFilterChange, 
  showFilterDropdown, 
  onShowFilterDropdown 
}) => {
  // Main tab state
  const [activeTab, setActiveTab] = useState<'featured' | 'tv-guide'>('featured');
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  
  // State to track if filter container is ready
  const [isFilterContainerReady, setIsFilterContainerReady] = useState(false);
  
  const { preferences } = usePreferences();
  const selectedProviders = preferences.selected_providers || [];

  // Auto-set filter to first provider when switching to TV Guide with multiple providers
  useEffect(() => {
    if (activeTab === 'tv-guide' && selectedProviders.length > 1) {
      // If current filter is 'all-providers' or not a valid provider, set to first provider
      const validProviderIds = selectedProviders;
      if (selectedFilter === 'all-providers' || !validProviderIds.includes(selectedFilter)) {
        onFilterChange(selectedProviders[0]);
      }
    }
  }, [activeTab, selectedProviders, selectedFilter, onFilterChange]);

  const handleItemClick = (item: SearchResult) => {
    setSelectedItem(item);
  };

  // Check for filter container availability
  useEffect(() => {
    const checkContainer = () => {
      const container = document.getElementById('live-filter-container');
      if (container) {
        setIsFilterContainerReady(true);
      } else {
        // Retry after a short delay if container not found
        setTimeout(checkContainer, 50);
      }
    };
    
    checkContainer();
  }, []);

  // Get dynamic filter options based on current tab and context
  const getFilterOptions = (): {value: string, label: string}[] => {
    switch (activeTab) {
      case 'featured':
        return [
          { value: 'all', label: 'All' },
          { value: 'movie', label: 'Movies' },
          { value: 'tv', label: 'TV Shows' }
        ];
      
      case 'tv-guide':
        const providerOptions = selectedProviders.map(providerId => {
          const provider = TV_PROVIDERS.find(p => p.id === providerId);
          return provider ? { value: provider.id, label: provider.name } : null;
        }).filter((option): option is {value: string, label: string} => option !== null);
        
        // Only include "All Providers" if there's 1 or 0 providers selected
        if (selectedProviders.length <= 1) {
          return [
            { value: 'all-providers', label: 'All Providers' },
            ...providerOptions
          ];
        } else {
          // Multiple providers - exclude "All Providers" option
          return providerOptions;
        }
      
      default:
        return [{ value: 'all', label: 'All' }];
    }
  };

  const getCurrentFilterLabel = (): string => {
    const options = getFilterOptions();
    const currentOption = options.find(option => option.value === selectedFilter);
    return currentOption?.label || options[0]?.label || 'All';
  };

  // Render filter dropdown in the header container
  const renderFilterDropdown = () => {
    const filterContainer = document.getElementById('live-filter-container');
    if (!filterContainer || !isFilterContainerReady) return null;

    const filterOptions = getFilterOptions();

    return createPortal(
      <div className="relative">
        <button
          onClick={() => onShowFilterDropdown(!showFilterDropdown)}
          className="flex items-center space-x-2 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl px-3 py-2 text-gray-200 transition-colors border border-gray-800/20"
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium text-sm">
            {getCurrentFilterLabel()}
          </span>
        </button>
        
        {showFilterDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
            <div className="py-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(option.value);
                    onShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-toolbar-hover transition-colors ${
                    selectedFilter === option.value ? 'text-purple-400' : 'text-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>,
      filterContainer
    );
  };

  const renderTabButton = (tab: 'featured' | 'tv-guide', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`relative px-4 py-3 text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap ${
        activeTab === tab
          ? 'text-white'
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
      {activeTab === tab && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
      )}
    </button>
  );

  const renderTabContent = () => {
    const commonProps = {
      onItemClick: handleItemClick,
      selectedFilter
    };

    switch (activeTab) {
      case 'featured':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <LiveFeaturedTab {...commonProps} />
          </Suspense>
        );
      case 'tv-guide':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <LiveTVGuideTab {...commonProps} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <LiveFeaturedTab {...commonProps} />
          </Suspense>
        );
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown && !(event.target as Element).closest('#live-filter-container')) {
        onShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown, onShowFilterDropdown]);

  return (
    <div className="flex-1 min-h-screen bg-black">
      {/* Render filter dropdown in header */}
      {renderFilterDropdown()}
      
      {/* Tab Navigation - Fixed position to avoid overlap */}
      <div className="sticky top-0 z-20 bg-black border-b border-gray-800/20 safe-area-inset-top">
        <div className="flex items-center justify-center px-4 sm:px-6">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {renderTabButton('featured', 'Featured')}
            {renderTabButton('tv-guide', 'TV Guide')}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>

      {/* Modal for selected item */}
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

export default LiveContent; 