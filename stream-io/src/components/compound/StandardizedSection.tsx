import React, { createContext, useContext, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Plus, Grid, List, Filter } from 'lucide-react';
import { useScrollState, useSeeMoreState, useUIInteractions } from '../../hooks/useComponentState';
import type { SearchResult } from '../../types/tmdb';

// Section Context for compound component communication
interface SectionContextType {
  title: string;
  items: SearchResult[];
  isExpanded: boolean;
  onExpandToggle?: () => void;
  sectionId?: string;
  enableHeroMode?: boolean;
  heroIndex?: number;
  onHeroChange?: (index: number) => void;
  theme?: 'purple' | 'blue' | 'green' | 'red';
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  filter?: 'all' | 'movie' | 'tv';
  onFilterChange?: (filter: 'all' | 'movie' | 'tv') => void;
  onItemClick?: (item: SearchResult) => void;
  onSeeMore?: () => void;
}

const SectionContext = createContext<SectionContextType | null>(null);

const useSectionContext = () => {
  const context = useContext(SectionContext);
  if (!context) {
    throw new Error('Section compound components must be used within a Section');
  }
  return context;
};

// Main Section Container Component
interface SectionProps {
  title: string;
  items: SearchResult[];
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  sectionId?: string;
  enableHeroMode?: boolean;
  heroIndex?: number;
  onHeroChange?: (index: number) => void;
  theme?: 'purple' | 'blue' | 'green' | 'red';
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  filter?: 'all' | 'movie' | 'tv';
  onFilterChange?: (filter: 'all' | 'movie' | 'tv') => void;
  onItemClick?: (item: SearchResult) => void;
  onSeeMore?: () => void;
  children: ReactNode;
  className?: string;
}

const SectionRoot: React.FC<SectionProps> = ({
  title,
  items,
  isExpanded = false,
  onExpandToggle,
  sectionId,
  enableHeroMode = false,
  heroIndex = 0,
  onHeroChange,
  theme = 'purple',
  viewMode = 'grid',
  onViewModeChange,
  filter = 'all',
  onFilterChange,
  onItemClick,
  onSeeMore,
  children,
  className = ''
}) => {
  const contextValue: SectionContextType = {
    title,
    items,
    isExpanded,
    onExpandToggle,
    sectionId,
    enableHeroMode,
    heroIndex,
    onHeroChange,
    theme,
    viewMode,
    onViewModeChange,
    filter,
    onFilterChange,
    onItemClick,
    onSeeMore
  };

  const themeClasses = {
    purple: 'border-purple-500/20 bg-purple-900/10',
    blue: 'border-blue-500/20 bg-blue-900/10',
    green: 'border-green-500/20 bg-green-900/10',
    red: 'border-red-500/20 bg-red-900/10'
  };

  return (
    <SectionContext.Provider value={contextValue}>
      <div className={`bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border shadow-2xl transition-all duration-500 ${themeClasses[theme]} ${className}`}>
        {children}
      </div>
    </SectionContext.Provider>
  );
};

// Section Header Component
interface SectionHeaderProps {
  showExpandButton?: boolean;
  showSeeMoreButton?: boolean;
  showViewModeToggle?: boolean;
  showFilterButton?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  showExpandButton = false,
  showSeeMoreButton = true,
  showViewModeToggle = false,
  showFilterButton = false,
  className = ''
}) => {
  const { 
    title, 
    items, 
    isExpanded, 
    onExpandToggle, 
    theme, 
    viewMode, 
    onViewModeChange,
    onSeeMore
  } = useSectionContext();

  const themeColors = {
    purple: 'text-purple-400 hover:text-purple-300',
    blue: 'text-blue-400 hover:text-blue-300',
    green: 'text-green-400 hover:text-green-300',
    red: 'text-red-400 hover:text-red-300'
  };

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <span className="text-gray-400 text-sm">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {showViewModeToggle && onViewModeChange && (
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? `bg-${theme}-600 text-white`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? `bg-${theme}-600 text-white`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {showFilterButton && (
          <button className={`p-2 rounded-lg bg-gray-800 transition-colors ${themeColors[theme!]}`}>
            <Filter className="w-4 h-4" />
          </button>
        )}
        
        {showExpandButton && onExpandToggle && (
          <button
            onClick={onExpandToggle}
            className={`px-4 py-2 rounded-lg bg-gray-800 transition-colors ${themeColors[theme!]}`}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
        
        {showSeeMoreButton && onSeeMore && (
          <button
            onClick={onSeeMore}
            className={`px-4 py-2 rounded-lg bg-gray-800 transition-colors ${themeColors[theme!]}`}
          >
            See All
          </button>
        )}
      </div>
    </div>
  );
};

// Section Content Component with built-in scroll management
interface SectionContentProps {
  showScrollArrows?: boolean;
  itemsPerRow?: number;
  renderItem?: (item: SearchResult, index: number) => ReactNode;
  className?: string;
  children?: ReactNode;
}

export const SectionContent: React.FC<SectionContentProps> = ({
  showScrollArrows = true,
  itemsPerRow = 6,
  renderItem,
  className = '',
  children
}) => {
  const { items, viewMode, onItemClick } = useSectionContext();
  const {
    showLeftArrow,
    showRightArrow,
    scrollContainerRef,
    checkScrollArrows,
    scroll
  } = useScrollState();

  React.useEffect(() => {
    checkScrollArrows();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollArrows);
      return () => container.removeEventListener('scroll', checkScrollArrows);
    }
  }, [checkScrollArrows]);

  const gridClasses = viewMode === 'list' 
    ? 'flex flex-col gap-4'
    : `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${itemsPerRow} gap-4`;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll Arrows */}
      {showScrollArrows && showLeftArrow && viewMode === 'grid' && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm p-3 rounded-full text-white hover:bg-black/90 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {showScrollArrows && showRightArrow && viewMode === 'grid' && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm p-3 rounded-full text-white hover:bg-black/90 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Content Container */}
      <div
        ref={scrollContainerRef}
        className={`overflow-x-auto scrollbar-hide ${viewMode === 'grid' ? 'pb-4' : ''}`}
      >
        <div className={gridClasses}>
          {children || (
            items.map((item, index) => (
              <div key={item.id} onClick={() => onItemClick?.(item)}>
                {renderItem ? renderItem(item, index) : (
                  <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
                    <h3 className="text-white font-medium">{item.title || item.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Section Hero Component for expanded view
interface SectionHeroProps {
  className?: string;
  renderHero?: (item: SearchResult, index: number) => ReactNode;
}

export const SectionHero: React.FC<SectionHeroProps> = ({
  className = '',
  renderHero
}) => {
  const { items, heroIndex, onHeroChange, isExpanded, theme } = useSectionContext();

  if (!isExpanded || !items.length) return null;

  const currentItem = items[heroIndex || 0];

  const themeGradients = {
    purple: 'from-purple-900/20 to-black/20',
    blue: 'from-blue-900/20 to-black/20',
    green: 'from-green-900/20 to-black/20',
    red: 'from-red-900/20 to-black/20'
  };

  return (
    <div className={`mb-8 ${className}`}>
      {renderHero ? renderHero(currentItem, heroIndex || 0) : (
        <div className={`relative h-96 rounded-2xl overflow-hidden bg-gradient-to-r ${themeGradients[theme!]}`}>
          {currentItem.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${currentItem.backdrop_path}`}
              alt={currentItem.title || currentItem.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h3 className="text-3xl font-bold text-white mb-2">
              {currentItem.title || currentItem.name}
            </h3>
            <p className="text-gray-300 max-w-2xl">
              {currentItem.overview}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Loading State
export const SectionLoading: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-700 rounded w-48"></div>
        <div className="h-10 bg-gray-700 rounded w-24"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
};

// Section Empty State
export const SectionEmpty: React.FC<{ message?: string; className?: string }> = ({ 
  message = 'No items found', 
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 text-lg">{message}</div>
    </div>
  );
};

// Export all components as a compound component
export const Section = Object.assign(SectionRoot, {
  Header: SectionHeader,
  Content: SectionContent,
  Hero: SectionHero,
  Loading: SectionLoading,
  Empty: SectionEmpty
}); 