import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Star, Play, Volume2, VolumeX, Calendar, Info } from 'lucide-react';
import { checkScrollArrows, scrollContainer, type ScrollState } from '../../utils/scrollArrowUtils';
import type { SearchResult } from '../../types/tmdb';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTheme, useModal, useTrailer, useSectionExpansion } from '../../stores';
import StandardizedFavoriteButton from '../StandardizedFavoriteButton';

export interface StandardizedSectionContainerProps {
  /** Section title */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Section content items */
  items: SearchResult[];
  /** Section variant for theming */
  variant?: 'default' | 'compact' | 'hero' | 'live';
  /** Unique section identifier for global expansion management */
  sectionId: string;
  /** Whether section is expanded (deprecated - use global expansion context) */
  isExpanded?: boolean;
  /** Callback when expand state changes (deprecated - use global expansion context) */
  onExpandedChange?: (expanded: boolean) => void;
  /** Whether to show see more button */
  showSeeMore?: boolean;
  /** Callback when see more is clicked */
  onSeeMoreClick?: () => void;
  /** Custom section icon component */
  icon?: React.ReactNode;
  /** Whether to show horizontal scroll for collapsed view */
  enableHorizontalScroll?: boolean;
  /** Whether to show expand/collapse functionality */
  expandable?: boolean;
  /** Render function for individual items */
  renderItem: (item: SearchResult, index: number) => React.ReactNode;
  /** Custom content to render in header */
  headerContent?: React.ReactNode;
  /** Additional CSS classes for container */
  className?: string;
  /** Whether section is loading */
  isLoading?: boolean;
  /** Whether to enable hero mode when expanded (like ContentSection) */
  enableHeroMode?: boolean;
  /** Maximum items to show in collapsed view */
  maxCollapsedItems?: number;
  /** Trailer keys for hero mode */
  trailerKeys?: Record<number, string>;
  /** Current slide for hero mode */
  currentSlide?: number;
  /** Handler for slide changes */
  onSlideChange?: (index: number) => void;
  /** Show trailer state */
  showTrailer?: Record<number, boolean>;
  /** Muted state */
  isMuted?: boolean;
  /** Toggle mute handler */
  onToggleMute?: () => void;
  /** Item click handler for hero items */
  onItemClick?: (item: SearchResult) => void;
  /** Whether to show navigation dots in hero mode */
  showNavigationDots?: boolean;
  /** Component ID for trailer context */
  componentId?: string;
}

const StandardizedSectionContainer: React.FC<StandardizedSectionContainerProps> = ({
  title,
  subtitle,
  items,
  variant = 'default',
  sectionId,
  isExpanded = false,
  onExpandedChange,
  showSeeMore = false,
  onSeeMoreClick,
  icon,
  enableHorizontalScroll = true,
  expandable = true,
  renderItem,
  headerContent,
  className = '',
  isLoading = false,
  enableHeroMode = false,
  maxCollapsedItems = 20,
  trailerKeys = {},
  currentSlide = 0,
  onSlideChange,
  showTrailer = {},
  isMuted = true,
  onToggleMute,
  onItemClick,
  showNavigationDots = true,
  componentId = 'standardizedSection'
}) => {
  const { themeSettings } = useTheme();
  const { openTrailer, closeTrailer, isOpen: isTrailerOpen, trailerKey } = useTrailer();
  const { isOpen: isModalOpen } = useModal();
  const { isSectionExpanded, expandSection, toggleSection } = useSectionExpansion();
  
  // Use global expansion state if sectionId provided, fallback to local prop for backwards compatibility
  const actualIsExpanded = sectionId ? isSectionExpanded(sectionId) : isExpanded;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    showLeft: false,
    showRight: false
  });
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Trailer management state and refs
  const timeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const textFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use the exact same styling as ContentSection - matching user's memory
  const containerClasses = `bg-black/20 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-purple-500/20 shadow-2xl transition-all duration-500 ${actualIsExpanded ? 'pb-0' : ''} ${className}`;
  
  // Filter out hidden items
  const { isInHidden } = useWatchlistStore();
  const visibleItems = items.filter(item => !isInHidden(item.id));

  // Limit items for performance
  const displayItems = actualIsExpanded ? visibleItems : visibleItems.slice(0, maxCollapsedItems);

  // Hero mode current item
  const currentHeroItem = enableHeroMode && actualIsExpanded && displayItems.length > 0 ? displayItems[currentSlide] : null;

  // Function to check if a specific trailer is active
  const isTrailerActive = (componentId: string, itemId: number) => {
    return isTrailerOpen && trailerKey === trailerKeys[itemId];
  };

  // Initialize trailer functionality when expanded with hero mode
  useEffect(() => {
    if (actualIsExpanded && enableHeroMode && currentHeroItem && Object.keys(trailerKeys).length > 0) {
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(false);
      
      // Clear existing trailers and stop any active ones
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Stop any currently active trailers for this section
      if (Object.keys(showTrailer).length > 0) {
        closeTrailer();
      }
      
      // Clear text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      // Start trailer for current hero item after 5 seconds when expanded (only if autoplay is enabled)
      if (themeSettings.autoplayVideos && trailerKeys[currentHeroItem.id]) {
        timeoutRefs.current[currentHeroItem.id] = setTimeout(() => {
          const mediaType = currentHeroItem.media_type === 'tv' ? 'tv' : 'movie';
          openTrailer(
            trailerKeys[currentHeroItem.id], 
            currentHeroItem.title || currentHeroItem.name || 'Unknown',
            mediaType
          );
        }, 5000); // Show cover content for 5 seconds before starting trailer
      }
      
      // Start text fade-out after 13 seconds (8 seconds after trailer starts)
      if (themeSettings.autoplayVideos) {
        textFadeTimeoutRef.current = setTimeout(() => {
          if (!isTextPermanentlyVisible) {
            setIsTextVisible(false);
          }
        }, 13000); // Extended to 13 seconds to account for delayed trailer start
      }
    }
    
    return () => {
      // Cleanup timeouts on unmount or when dependencies change
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
    };
  }, [actualIsExpanded, enableHeroMode, currentHeroItem, trailerKeys, themeSettings.autoplayVideos, openTrailer, closeTrailer, componentId, showTrailer, isTextPermanentlyVisible]);

  // Handle slide changes for hero mode
  useEffect(() => {
    if (actualIsExpanded && enableHeroMode && currentHeroItem && onSlideChange) {
      // Reset text visibility for new slide
      if (!isTextPermanentlyVisible) {
        setIsTextVisible(true);
        
        if (textFadeTimeoutRef.current) {
          clearTimeout(textFadeTimeoutRef.current);
        }
        
        if (themeSettings.autoplayVideos) {
          textFadeTimeoutRef.current = setTimeout(() => {
            if (!isTextPermanentlyVisible) {
              setIsTextVisible(false);
            }
          }, 13000);
        }
      }

      // Stop any previous trailer
      if (Object.keys(showTrailer).length > 0) {
        closeTrailer();
        Object.keys(showTrailer).forEach(contentId => {
          const id = parseInt(contentId);
          if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id]);
            delete timeoutRefs.current[id];
          }
        });
      }

      // Start new trailer after 5 seconds (only if autoplay is enabled)
      if (themeSettings.autoplayVideos && trailerKeys[currentHeroItem.id]) {
        if (timeoutRefs.current[currentHeroItem.id]) {
          clearTimeout(timeoutRefs.current[currentHeroItem.id]);
        }
        
        timeoutRefs.current[currentHeroItem.id] = setTimeout(() => {
          const mediaType = currentHeroItem.media_type === 'tv' ? 'tv' : 'movie';
          openTrailer(
            trailerKeys[currentHeroItem.id], 
            currentHeroItem.title || currentHeroItem.name || 'Unknown',
            mediaType
          );
        }, 5000);
      }
    }
  }, [currentSlide, currentHeroItem, onSlideChange, actualIsExpanded, enableHeroMode, trailerKeys, themeSettings.autoplayVideos, openTrailer, closeTrailer, componentId, showTrailer, isTextPermanentlyVisible]);

  // Check scroll arrows when items change or component mounts - now works for both collapsed and expanded
  useEffect(() => {
    if (enableHorizontalScroll && scrollContainerRef.current) {
      const handleScrollCheck = () => {
        const state = checkScrollArrows(scrollContainerRef.current);
        setScrollState(state);
      };

      const container = scrollContainerRef.current;
      container.addEventListener('scroll', handleScrollCheck);
      
      // Initial check with small delay to ensure DOM has updated after expansion
      const timer = setTimeout(() => {
        handleScrollCheck();
      }, 50);

      // Also check on resize to handle dynamic content changes
      const resizeObserver = new ResizeObserver(() => {
        handleScrollCheck();
      });
      
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', handleScrollCheck);
        resizeObserver.disconnect();
        clearTimeout(timer);
      };
    }
  }, [displayItems, actualIsExpanded, enableHorizontalScroll, enableHeroMode]);

  const handleScroll = (direction: 'left' | 'right') => {
    scrollContainer(scrollContainerRef.current, direction);
  };

  // Force scroll check when expand state changes
  useEffect(() => {
    if (enableHorizontalScroll && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has fully updated after expansion
      const rafId = requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const state = checkScrollArrows(scrollContainerRef.current);
          setScrollState(state);
          
          // Additional check after a short delay for complex layouts
          setTimeout(() => {
            if (scrollContainerRef.current) {
              const updatedState = checkScrollArrows(scrollContainerRef.current);
              setScrollState(updatedState);
            }
          }, 150);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [actualIsExpanded, enableHorizontalScroll, enableHeroMode]);

  const handleExpandToggle = () => {
    // Use global expansion context if sectionId provided
    if (sectionId) {
      toggleSection(sectionId);
    } else if (onExpandedChange) {
      // Fallback to local state for backwards compatibility
      onExpandedChange(!isExpanded);
    }
  };

  const handleTextClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsTextPermanentlyVisible(!isTextPermanentlyVisible);
    setIsTextVisible(true);
  };

  const handleHeroClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't open modal if clicking on interactive buttons or their children
    if (target.closest('button') || 
        target.closest('.hero-controls') || 
        target.closest('[role="button"]') ||
        target.closest('.standardized-favorite-button') ||
        target.closest('iframe') ||
        target.tagName.toLowerCase() === 'button' ||
        target.hasAttribute('onclick') ||
        target.closest('[data-interactive]')) {
      return;
    }
    
    if (!currentHeroItem) return;
    
    const isTrailerPlaying = isTrailerActive(componentId, currentHeroItem.id);
    const hasTrailerKey = !!trailerKeys[currentHeroItem.id];
    
    console.log('Hero section interaction:', {
      contentId: currentHeroItem.id,
      isTrailerPlaying,
      hasTrailerKey,
      title: currentHeroItem.title || currentHeroItem.name
    });
    
    // Two-step interaction logic:
    // 1. First click when trailer is playing → Stop trailer and show thumbnail + text
    // 2. Second click when trailer is stopped → Open modal
    
    if (isTrailerPlaying && hasTrailerKey) {
      // First click: Stop the trailer and show thumbnail + text
      console.log('First click: Stopping trailer and showing thumbnail');
      closeTrailer();
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(true);
    } else {
      // Second click or no trailer: Open modal
      console.log('Second click or no trailer: Opening modal');
      if (onItemClick) onItemClick(currentHeroItem);
    }
  };

  const toggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    }
  };

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-white text-lg animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render section container if there are no visible items
  if (visibleItems.length === 0) {
    return null;
  }

      return (
      <div className={containerClasses} data-expanded={actualIsExpanded ? "true" : "false"}>
      {/* Header - exact styling from ContentSection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {icon}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {headerContent}
        </div>
        
        <div className="flex items-center space-x-2">
          {showSeeMore && displayItems.length > 0 && (
            <button
              onClick={onSeeMoreClick}
              className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap"
            >
              See More
            </button>
          )}
          
          {expandable && (onExpandedChange || sectionId) && (
            <button 
              onClick={handleExpandToggle}
              className="flex items-center justify-center w-10 h-10 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-lg"
              aria-label={actualIsExpanded ? "Collapse section" : "Expand section"}
            >
              {actualIsExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hero Mode when expanded */}
      {actualIsExpanded && enableHeroMode && currentHeroItem ? (
        <div className={`relative rounded-2xl overflow-hidden mb-8 cursor-pointer group ${
          variant === 'live' 
            ? 'h-80' // Use h-80 (320px) for Live tab to match existing custom hero sections
            : 'h-[70vh] sm:h-[80vh] lg:h-[90vh] xl:h-[95vh]' // Keep larger height for Home tab
        }`} onClick={handleHeroClick}>
          {/* Background Image */}
          <img
            src={`https://image.tmdb.org/t/p/original${currentHeroItem.backdrop_path || currentHeroItem.poster_path}`}
            alt={currentHeroItem.title || currentHeroItem.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          
          {/* Trailer Video */}
          {trailerKeys[currentHeroItem.id] && isTrailerActive(componentId, currentHeroItem.id) && !isModalOpen && (
            <div className="absolute inset-0">
              <iframe
                key={iframeKey}
                src={`https://www.youtube.com/embed/${trailerKeys[currentHeroItem.id]}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&start=0&loop=1&playlist=${trailerKeys[currentHeroItem.id]}`}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ pointerEvents: 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Content */}
          <div className={`hero-text-content absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 transition-opacity duration-1000 ${
            // Text should completely disappear (opacity-0) when trailer is active OR when manually hidden
            (trailerKeys[currentHeroItem.id] && isTrailerActive(componentId, currentHeroItem.id) && !isModalOpen) || !isTextVisible 
              ? 'opacity-0' 
              : 'opacity-100'
          }`}>
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-2xl leading-tight">
                {currentHeroItem.title || currentHeroItem.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-2">
                {currentHeroItem.vote_average && currentHeroItem.vote_average > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm font-medium">{currentHeroItem.vote_average.toFixed(1)}</span>
                  </div>
                )}
                
                {(currentHeroItem.release_date || currentHeroItem.first_air_date) && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    <span className="text-white text-sm font-medium">
                      {currentHeroItem.release_date?.split('-')[0] || currentHeroItem.first_air_date?.split('-')[0]}
                    </span>
                  </div>
                )}
                
                <div className="px-2 py-1 bg-purple-600/80 text-white text-xs font-medium rounded-md backdrop-blur-sm">
                  <span className="text-white text-xs font-medium">
                    {currentHeroItem.media_type === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
                </div>
              </div>
              
              {currentHeroItem.overview && (
                <p className="text-gray-200 text-xs md:text-sm mb-6 max-w-2xl drop-shadow-lg leading-relaxed line-clamp-3">
                  {currentHeroItem.overview}
                </p>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3 hero-controls" data-interactive="true">
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-white/20 transform hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onItemClick) onItemClick(currentHeroItem);
                  }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-xs">Watch Now</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-lg font-medium border border-white/20 hover:bg-black/80 hover:border-white/40 transition-all duration-200 shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onItemClick) onItemClick(currentHeroItem);
                  }}
                >
                  <Info className="w-3 h-3" />
                  <span className="text-xs">More Info</span>
                </button>
                
                <StandardizedFavoriteButton
                  item={currentHeroItem}
                  size="md"
                  className="standardized-favorite-button hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          {showNavigationDots && displayItems.length > 1 && (
            <div className="absolute bottom-8 right-8 flex space-x-2">
              {displayItems.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSlideChange) onSlideChange(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-white scale-125' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Audio Controls */}
          {trailerKeys[currentHeroItem.id] && isTrailerActive(componentId, currentHeroItem.id) && !isModalOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute top-8 right-8 flex items-center justify-center w-7 h-7 bg-black/80 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-black/90 hover:border-white/40 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      ) : null}

      {/* Horizontal Scroll View - Always visible (like ContentSection) */}
      <div className="relative">
        {/* Scroll Arrows - show for both collapsed and expanded states */}
        {enableHorizontalScroll && scrollState.showLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => handleScroll('left')}
              className="absolute -left-2 top-1/2 -translate-y-1/2 p-3 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 border border-gray-600/20 z-20 transition-all shadow-xl"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        )}

        {enableHorizontalScroll && scrollState.showRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => handleScroll('right')}
              className="absolute -right-2 top-1/2 -translate-y-1/2 p-3 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 border border-gray-600/20 z-20 transition-all shadow-xl"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Scrollable Container - single row layout */}
        <div 
          ref={scrollContainerRef}
          className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
        >
          {displayItems.map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="relative group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if the click is on an interactive element (button, etc.)
                const target = e.target as HTMLElement;
                if (target.closest('button') || 
                    target.closest('[role="button"]') ||
                    target.closest('.standardized-favorite-button') ||
                    target.closest('[data-interactive]')) {
                  // Let the button handle its own click
                  return;
                }
                
                try {
                  if (actualIsExpanded && enableHeroMode) {
                    // When expanded with hero mode, find the index and change slide or open modal
                    const itemIndex = displayItems.findIndex(displayItem => displayItem.id === item.id);
                    console.log('Thumbnail click in expanded mode:', { itemId: item.id, itemIndex, currentSlide, title: item.title || item.name });
                    
                    if (itemIndex !== -1 && itemIndex !== currentSlide) {
                      // First click: Change to this slide (set as hero)
                      if (onSlideChange) onSlideChange(itemIndex);
                    } else if (itemIndex === currentSlide) {
                      // Second click: Open modal for current hero item
                      console.log('Opening modal for current hero item:', { itemId: item.id, title: item.title || item.name });
                      if (onItemClick) onItemClick(item);
                    }
                  } else {
                    // When not expanded or no hero mode, open modal normally
                    console.log('Thumbnail click in collapsed mode:', { itemId: item.id, title: item.title || item.name });
                    if (onItemClick) onItemClick(item);
                  }
                } catch (error) {
                  console.error('Error in thumbnail click handler:', error);
                }
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StandardizedSectionContainer; 