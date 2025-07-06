import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Star, Calendar, Info, Plus, ArrowLeft, Filter, List, LayoutGrid, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import type { SearchResult, StreamingService } from '../types/tmdb';
import MovieModal from './MovieModal';
import { getStreamingServices, getVideos } from '../services/tmdb';
import { useTheme, useModal } from '../stores';
import { useTrailer } from '../stores';
import { useWatchlistStore } from '../stores/watchlistStore';
import { usePreferences } from '../stores';
import StandardizedFavoriteButton from './StandardizedFavoriteButton';
import { handleError, handleAsyncError } from '../services/errorHandler';

interface ContentSectionProps {
  title: string;
  items: SearchResult[];
  selectedFilter: 'all' | 'movie' | 'tv';
  showTrending?: boolean;
  showExpiring?: boolean;
  showDateAdded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onSeeMoreClick?: () => void;
  showSeeMorePage?: boolean;
  onBackFromSeeMore?: () => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  items,
  selectedFilter,
  isExpanded = false,
  onExpandedChange,
  onSeeMoreClick,
  showSeeMorePage: externalShowSeeMorePage = false,
  onBackFromSeeMore
}) => {
  const { effectiveTheme, themeSettings } = useTheme();
  const { preferences } = usePreferences();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [streamingData, setStreamingData] = useState<Record<number, StreamingService[]>>({});
  const [loadedImages, setLoadedImages] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // See More state
  const [showSeeMorePage, setShowSeeMorePage] = useState(false);
  const [seeMoreFilter, setSeeMoreFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [showSeeMoreFilterDropdown, setShowSeeMoreFilterDropdown] = useState(false);
  
  // Use global view mode preference (preferences already declared above)
  const { setPreferredViewMode } = usePreferences();
  const preferredViewMode = preferences.preferredViewMode;

  // Hero slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<number, string>>({});
  const [showTrailer, setShowTrailer] = useState<Record<number, boolean>>({});
  const [trailerStopped, setTrailerStopped] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  
  const timeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const videoRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const manualControlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watchlist store methods
  const { isItemInWatchlist, isInHidden } = useWatchlistStore();

  // See More handlers
  const handleSeeMoreClick = () => {
    if (onSeeMoreClick) {
      // Use external handler if provided
      onSeeMoreClick();
    } else {
      // Use internal state if no external handler
      setShowSeeMorePage(true);
    }
  };

  const handleBackFromSeeMore = () => {
    if (onBackFromSeeMore) {
      // Use external handler if provided
      onBackFromSeeMore();
    } else {
      // Use internal state if no external handler
      setShowSeeMorePage(false);
    }
  };

  // Determine which see more page state to use
  const isShowingSeeMorePage = externalShowSeeMorePage || showSeeMorePage;

  const getOptimalGridLayout = (itemCount: number) => {
    if (itemCount === 0) return 'grid-cols-1';
    // Use consistent grid layout regardless of item count to prevent stretching
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  };

  const handleItemClick = useCallback(async (item: SearchResult, fromHero: boolean = false) => {
    if (!item || !item.id) {
      handleError('Invalid item provided to handleItemClick', {
        context: { item, fromHero }
      });
      return;
    }
    
    try {
      setSelectedItem(item);
      if (!streamingData[item.id]) {
        const services = await getStreamingServices(item.id, item.media_type as 'movie' | 'tv');
        setStreamingData(prev => ({ ...prev, [item.id]: services }));
      }
    } catch (error) {
      handleError('Error in handleItemClick', {
        context: { itemId: item.id, itemTitle: item.title || item.name, fromHero }
      });
    }
  }, [streamingData, setSelectedItem, handleError]);

  const checkScrollArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const handleImageLoad = () => {
    setLoadedImages(prev => {
      const newCount = prev + 1;
      if (newCount === items.length) {
        checkScrollArrows();
      }
      return newCount;
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter based on selected media type and hidden status
  const filteredItems = useMemo(() => {
    console.log('Recomputing filteredItems:', { itemsLength: items.length, selectedFilter });
    
    let filtered = items.filter(item => 
      (selectedFilter === 'all' || item.media_type === selectedFilter) &&
      !isInHidden(item.id) // Filter out hidden items
    );

    // For the main section view, limit to 20 items for performance
    // For See More page, we'll use all available items (up to 50)
    if (!isShowingSeeMorePage) {
      if (selectedFilter !== 'all' && filtered.length < 20) {
        filtered = items
          .filter(item => item.media_type === selectedFilter)
          .slice(0, 20);
      } else if (selectedFilter !== 'all') {
        filtered = filtered.slice(0, 20);
      } else {
        filtered = filtered.slice(0, 20);
      }
    } else {
      // For See More page, show up to 50 items
      filtered = filtered.slice(0, 50);
    }

    console.log('Filtered items computed:', { filteredLength: filtered.length, isShowingSeeMorePage });
    return filtered;
  }, [items, selectedFilter, isShowingSeeMorePage]);

  // Fetch trailers when expanded
  useEffect(() => {
    if (isExpanded && filteredItems.length > 0) {
      const fetchTrailers = async () => {
        try {
          const trailerPromises = filteredItems.slice(0, 10).map(async (item) => {
            try {
              const videos = await getVideos(item.id, item.media_type as 'movie' | 'tv');
              const trailer = videos.find(video => 
                video.site === 'YouTube' && 
                (video.type === 'Trailer' || video.type === 'Teaser') &&
                video.official
              );
              return { id: item.id, key: trailer?.key || null };
            } catch (error) {
              handleAsyncError(error as Error, {
                operation: 'fetchTrailer',
                itemId: item.id,
                itemTitle: item.title || item.name
              });
              return { id: item.id, key: null };
            }
          });

          const trailerResults = await Promise.all(trailerPromises);
          const trailerMap: Record<number, string> = {};
          trailerResults.forEach(({ id, key }) => {
            if (key) trailerMap[id] = key;
          });
          setTrailerKeys(trailerMap);
        } catch (error) {
          handleAsyncError(error as Error, {
            operation: 'fetchTrailers',
            context: { filteredItemsCount: filteredItems.length }
          });
        }
      };

      fetchTrailers();
    }

    return () => {
      // Cleanup all timeouts
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      if (manualControlTimeoutRef.current) {
        clearTimeout(manualControlTimeoutRef.current);
      }
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
    };
  }, [isExpanded, filteredItems]);

  // Reset currentSlide when filteredItems changes to prevent out-of-bounds access
  useEffect(() => {
    if (currentSlide >= filteredItems.length) {
      console.log('Resetting currentSlide due to filteredItems change:', { currentSlide, filteredItemsLength: filteredItems.length });
      setCurrentSlide(0);
    }
  }, [filteredItems.length, currentSlide]);

  // Initialize slideshow when expanded
  useEffect(() => {
    if (isExpanded && filteredItems.length > 0) {
      setCurrentSlide(0);
      setIsManuallyControlled(false);
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(false);
      
      // Clear existing trailers and stop any active ones
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Clear any active trailers for this section
      setShowTrailer({});
      
      // Clear text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      // Start trailer for first slide after 5 seconds when expanded (only if autoplay is enabled)
      if (themeSettings.autoplayVideos && trailerKeys[filteredItems[0].id]) {
        timeoutRefs.current[filteredItems[0].id] = setTimeout(() => {
          setShowTrailer(prev => ({ ...prev, [filteredItems[0].id]: true }));
        }, 5000); // Show cover content for 5 seconds before starting trailer
      }
      
      // Start text fade-out after 13 seconds (8 seconds after trailer starts)
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 13000); // Extended to 13 seconds to account for delayed trailer start
    }
  }, [isExpanded, filteredItems, trailerKeys, isTextPermanentlyVisible, themeSettings.autoplayVideos]);

  // Auto-advance slides when expanded
  useEffect(() => {
    if (isExpanded && !isManuallyControlled && filteredItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % filteredItems.length;
          handleSlideChange(nextSlide, prev);
          return nextSlide;
        });
      }, 21000); // 21 seconds per slide

      return () => clearInterval(interval);
    }
  }, [isExpanded, isManuallyControlled, filteredItems.length]);

  const handleSlideChange = useCallback((newSlide: number, fromSlide?: number) => {
    if (newSlide < 0 || newSlide >= filteredItems.length) {
      handleError('Invalid slide index in handleSlideChange', {
        context: { newSlide, filteredItemsLength: filteredItems.length }
      });
      return;
    }

    const newContent = filteredItems[newSlide];
    if (!newContent) {
      handleError('No content found for slide in handleSlideChange', {
        context: { newSlide, filteredItemsLength: filteredItems.length }
      });
      return;
    }

    console.log('Slide change:', { from: fromSlide, to: newSlide, currentContent: newContent?.title, newContent: newContent?.title });

    // Reset text visibility for new slide
    if (!isTextPermanentlyVisible) {
      setIsTextVisible(true);
      
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 13000); // Extended to 13 seconds to account for delayed trailer start
    }

    // Stop current trailer if it exists
    if (newContent.id) {
      setShowTrailer(prev => ({ ...prev, [newContent.id]: false }));
      if (timeoutRefs.current[newContent.id]) {
        clearTimeout(timeoutRefs.current[newContent.id]);
        delete timeoutRefs.current[newContent.id]; // Clean up the reference
      }
    }

    // Start new trailer after showing cover content for 5 seconds (only if autoplay is enabled)
    if (themeSettings.autoplayVideos && newContent?.id && trailerKeys[newContent.id]) {
      // Clear any existing timeout for this content first
      if (timeoutRefs.current[newContent.id]) {
        clearTimeout(timeoutRefs.current[newContent.id]);
      }
      
      timeoutRefs.current[newContent.id] = setTimeout(() => {
        setShowTrailer(prev => ({ ...prev, [newContent.id]: true }));
      }, 5000); // Show cover content for 5 seconds before starting trailer
    }
  }, [filteredItems, trailerKeys, themeSettings.autoplayVideos]);

  const handleManualSlideChange = (index: number) => {
    if (index < 0 || index >= filteredItems.length || index === currentSlide) {
      console.log('handleManualSlideChange: Skipping change', { index, currentSlide, reason: 'invalid or same' });
      return; // Safety check to prevent invalid index or unnecessary changes
    }
    
    console.log('handleManualSlideChange: Changing slide', { from: currentSlide, to: index });
    
    // Handle the slide change first with current slide info
    handleSlideChange(index, currentSlide);
    
    // Then update the slide state
    setCurrentSlide(index);
    
    setIsManuallyControlled(true);
    
    if (manualControlTimeoutRef.current) {
      clearTimeout(manualControlTimeoutRef.current);
    }
    manualControlTimeoutRef.current = setTimeout(() => {
      setIsManuallyControlled(false);
    }, 30000);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Use YouTube postMessage API to control mute without restarting video
    const currentContent = filteredItems[currentSlide];
    if (currentContent && videoRefs.current[currentContent.id]) {
      const iframe = videoRefs.current[currentContent.id];
      if (iframe && iframe.contentWindow) {
        try {
          const command = newMutedState ? 'mute' : 'unMute';
          
          console.log('🔊 Sending mute command:', { command, contentId: currentContent.id, newMutedState });
          
          // Send the mute/unmute command
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: command,
              args: ''
            }),
            '*'
          );
          
          // Also try setting volume as a backup method
          const volume = newMutedState ? 0 : 100;
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'setVolume',
              args: [volume]
            }),
            '*'
          );
        } catch (error) {
          console.log('🔊 Mute command failed:', error);
        }
      } else {
        console.log('🔊 No iframe or contentWindow available:', { 
          hasIframe: !!iframe, 
          hasContentWindow: !!(iframe && iframe.contentWindow),
          contentId: currentContent.id 
        });
      }
    } else {
      console.log('🔊 No current content or video ref:', { 
        hasCurrentContent: !!currentContent,
        hasVideoRef: !!(currentContent && videoRefs.current[currentContent.id]),
        currentSlide 
      });
    }
  };

  const pauseTrailer = (contentId: number) => {
    console.log('⏸️ Pausing trailer for content:', contentId);
    
    // Mark trailer as stopped for this content
    setTrailerStopped(prev => ({ ...prev, [contentId]: true }));
    
    // Hide the trailer and show the background image
    setShowTrailer(prev => ({ ...prev, [contentId]: false }));
    
    // Show text permanently
    setIsTextVisible(true);
    setIsTextPermanentlyVisible(true);
    
    // Clear any text fade timeout
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
  };

  const handleTextClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsTextPermanentlyVisible(!isTextPermanentlyVisible);
    setIsTextVisible(true);
    
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
  };

  const handleHeroClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't trigger actions if clicking on interactive buttons or their children
    if (target.closest('button') || 
        target.closest('.hero-controls') || 
        target.closest('[role="button"]') ||
        target.closest('.standardized-favorite-button') ||
        target.closest('iframe') ||
        target.closest('.mute-button') ||
        target.tagName.toLowerCase() === 'button' ||
        target.hasAttribute('onclick') ||
        target.closest('[data-interactive]')) {
      return;
    }
    
    // Allow clicking on text content to restore text
    if (target.closest('.hero-text-content')) {
      handleTextClick(e);
      return;
    }
    
    const currentContent = filteredItems[currentSlide];
    if (!currentContent) return;
    
    const isTrailerPlaying = isShowingTrailer && !trailerStopped[currentContent.id];
    const hasTrailerStopped = trailerStopped[currentContent.id];
    const hasTrailerKey = !!trailerKeys[currentContent.id];
    
    console.log('Home tab hero section interaction:', {
      contentId: currentContent.id,
      title: currentContent.title || currentContent.name,
      isTrailerPlaying,
      hasTrailerStopped,
      hasTrailerKey,
      isShowingTrailer
    });
    
    // Two-step interaction logic:
    // 1. First tap when trailer is playing → Stop trailer
    // 2. Second tap when trailer is stopped → Open modal
    
    if (isTrailerPlaying) {
      // First tap: Stop the trailer
      console.log('First tap: Stopping trailer');
      pauseTrailer(currentContent.id);
    } else if (hasTrailerKey && hasTrailerStopped) {
      // Second tap: Open modal (trailer was stopped)
      console.log('Second tap: Opening modal');
      handleItemClick(currentContent);
    } else if (!hasTrailerKey) {
      // No trailer available, open modal directly
      console.log('No trailer available, opening modal');
      handleItemClick(currentContent);
    } else {
      // Fallback case: Open modal
      console.log('Fallback: Opening modal');
      handleItemClick(currentContent);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && filteredItems.length > 0 && !isExpanded) {
      checkScrollArrows();
      
      const handleScroll = () => {
        checkScrollArrows();
      };
      
      container.addEventListener('scroll', handleScroll, { passive: true });
      const observer = new ResizeObserver(checkScrollArrows);
      observer.observe(container);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [filteredItems, isExpanded]);



  if (filteredItems.length === 0) {
    return null;
  }

  // Enhanced section styling - unified purple theme
  const getSectionIcon = () => {
    return null; // Icons removed from all content sections
  };

  const currentContent = isExpanded ? filteredItems[currentSlide] : null;
  const currentTrailer = currentContent ? trailerKeys[currentContent.id] : null;
  const { isModalOpen } = useModal();
  const isShowingTrailer = currentContent ? showTrailer[currentContent.id] && currentTrailer && !isModalOpen() : false;

  // Get filtered items for See More page
  const getSeeMoreFilteredItems = () => {
    // For See More page, use all available items (up to 50) and apply the See More filter
    let allItems = items.filter(item => 
      (selectedFilter === 'all' || item.media_type === selectedFilter) &&
      !isInHidden(item.id)
    ).slice(0, 50);
    
    if (seeMoreFilter !== 'all') {
      allItems = allItems.filter(item => item.media_type === seeMoreFilter);
    }
    return allItems;
  };

  // Render See More page
  if (isShowingSeeMorePage) {
    const seeMoreItems = getSeeMoreFilteredItems();

    return (
      <div className="min-h-screen bg-black text-white">
        <header className="fixed top-0 left-0 right-0 bg-toolbar border-b toolbar-height toolbar-padding z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid items-center gap-4 h-full grid-cols-[auto_1fr_auto]">
              <div className="flex justify-start">
                <button
                  onClick={handleBackFromSeeMore}
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
                <div className="w-full">
                  <div className="relative">
                    <div className="w-full py-2 text-center">
                      <h1 className="text-xl font-bold text-white">{title}</h1>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="relative">
                  <button
                    onClick={() => setShowSeeMoreFilterDropdown(!showSeeMoreFilterDropdown)}
                    className="flex items-center space-x-2 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl px-4 py-2 text-gray-200 transition-colors border border-gray-800/20"
                  >
                    <Filter className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">
                      {seeMoreFilter === 'all' ? 'All' : seeMoreFilter === 'movie' ? 'Movies' : 'TV Shows'}
                    </span>
                  </button>
                  
                  {showSeeMoreFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
                      <div className="py-2">
                        {(['all', 'movie', 'tv'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setSeeMoreFilter(filter);
                              setShowSeeMoreFilterDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-toolbar-hover transition-colors ${
                              seeMoreFilter === filter ? 'text-purple-400' : 'text-gray-200'
                            }`}
                          >
                            {filter === 'all' && 'All Content'}
                            {filter === 'movie' && 'Movies'}
                            {filter === 'tv' && 'TV Shows'}
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
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">
                {/* Empty space for alignment */}
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setPreferredViewMode('list')}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                    preferredViewMode === 'list'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreferredViewMode('grid')}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                    preferredViewMode === 'grid'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {preferredViewMode === 'grid' ? (
              // Grid View
              <div className={`grid ${getOptimalGridLayout(seeMoreItems.length)} gap-4`}>
                {seeMoreItems.map((item: SearchResult) => (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleItemClick(item)}
                      className="relative w-full aspect-[2/3] rounded-xl overflow-hidden group/item focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 flex flex-col justify-between p-3">
                          <div className="flex items-start justify-between">
                            {item.vote_average && item.vote_average > 0 && (
                              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-white text-xs font-medium">{item.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                            <div className="bg-purple-600/80 text-white text-xs px-2.5 py-0.5 rounded-md font-medium">
                              {item.media_type === 'movie' ? 'Movie' : 'TV'}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-center">
                              <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight mb-1">
                                {item.title || item.name}
                              </h3>
                              {(item.release_date || item.first_air_date) && (
                                <span className="text-gray-300 text-xs">
                                  {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="flex items-center justify-center w-8 h-8 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                                aria-label="Play"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                              
                              <StandardizedFavoriteButton
                                item={item}
                                size="md"
                                className="!w-8 !h-8"
                              />
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item);
                                }}
                                className="flex items-center justify-center w-8 h-8 bg-gray-600/80 text-white rounded-full hover:bg-gray-700 transition-colors"
                                aria-label="More info"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 ring-1 ring-white/10 rounded-xl group-hover/item:ring-purple-500/50 group-hover/item:ring-2 transition-all duration-300" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {seeMoreItems.map((item: SearchResult) => (
                  <div
                    key={item.id}
                    className="relative flex items-center space-x-4 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all transform hover:scale-105"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-lg line-clamp-1">
                          {item.title || item.name}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                          {(item.release_date || item.first_air_date) && (
                            <span>
                              {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                            </span>
                          )}
                          {item.vote_average && item.vote_average > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>{item.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                          <span className="bg-purple-600/80 text-white text-xs px-2.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                            {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                          </span>
                        </div>
                      </div>
                      
                      {item.overview && (
                        <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                          {item.overview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {selectedItem && (
          <MovieModal
            item={selectedItem}
            streamingServices={streamingData[selectedItem.id] || []}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    );
  }

  return (
            <div className={`bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl transition-all duration-500 ${isExpanded ? 'pb-0' : ''}`} data-expanded={isExpanded ? "true" : "false"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {getSectionIcon()}
        </div>
        
        <div className="flex items-center space-x-2">
          {filteredItems.length > 0 && (
            <button
              onClick={handleSeeMoreClick}
              className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap"
            >
              See More
            </button>
          )}
          
          <button 
            onClick={() => onExpandedChange?.(!isExpanded)}
            className="flex items-center justify-center w-10 h-10 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-lg"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded ? (
        // Expanded Hero-style View
        <div 
          className="relative w-full h-96 rounded-xl overflow-hidden mb-6 cursor-pointer"
          onClick={handleHeroClick}
        >
          {currentContent && (
            <>
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={`https://image.tmdb.org/t/p/original${currentContent.backdrop_path || currentContent.poster_path}`}
                  alt={currentContent.title || currentContent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
              </div>

              {/* Trailer Video */}
              {isShowingTrailer && (
                <div className="absolute inset-0 z-10">
                  <iframe
                    key={`${currentContent.id}-${currentTrailer}`}
                    ref={(el) => { if (el) videoRefs.current[currentContent.id] = el; }}
                    src={`https://www.youtube.com/embed/${currentTrailer}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                    className="w-full h-full"
                    style={{ pointerEvents: 'none' }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Top-Right Corner Controls - Actor Detail Page Style */}
              <div className="absolute top-6 right-6 z-30 flex space-x-2">
                {/* Mute Button */}
                {isShowingTrailer && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="flex items-center justify-center w-7 h-7 bg-black/80 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-black/90 hover:border-white/40 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110"
                    style={{ pointerEvents: 'auto' }}
                    aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                
                {/* Standardized Favorite Button */}
                <StandardizedFavoriteButton
                  item={currentContent}
                  size="md"
                  ariaLabel="Add to Favorite or manage lists"
                />
              </div>

              {/* Content Information */}
              <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${
                isTextVisible ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="max-w-2xl space-y-3" onClick={handleTextClick}>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    {/* Release Year */}
                    {(currentContent.release_date || currentContent.first_air_date) && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {currentContent.release_date?.split('-')[0] || currentContent.first_air_date?.split('-')[0]}
                        </span>
                      </div>
                    )}
                    {/* Rating */}
                    {currentContent.vote_average && currentContent.vote_average > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{currentContent.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                    {/* Type of Film */}
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full font-medium">
                      {currentContent.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {currentContent.title || currentContent.name}
                  </h3>

                  {currentContent.overview && (
                    <p className="text-sm text-gray-200 leading-relaxed max-w-xl line-clamp-3">
                      {currentContent.overview}
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start space-x-3 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(currentContent);
                      }}
                      className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(currentContent);
                      }}
                      className="flex items-center space-x-2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium border border-white/20 hover:bg-black/80 hover:border-white/40 transition-all duration-200 shadow-xl"
                    >
                      <Info className="w-3 h-3" />
                      <span className="text-xs">More Info</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Horizontal Scroll View - always visible */}
      <div className="relative">
        {showLeftArrow && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('left')}
              className="absolute -left-2 top-1/2 -translate-y-1/2 p-3 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 border border-gray-600/20 z-20 transition-all shadow-xl"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        )}

        {showRightArrow && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              className="absolute -right-2 top-1/2 -translate-y-1/2 p-3 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 border border-gray-600/20 z-20 transition-all shadow-xl"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        <div 
          ref={scrollContainerRef}
          className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
        >
          {filteredItems.slice(0, 20).map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative group"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    if (isExpanded) {
                      // When expanded, find the index and change slide or open modal
                      const itemIndex = filteredItems.findIndex(filteredItem => filteredItem.id === item.id);
                      console.log('Thumbnail click in expanded mode:', { itemId: item.id, itemIndex, currentSlide, title: item.title || item.name });
                      
                      if (itemIndex !== -1 && itemIndex !== currentSlide) {
                        // First click: Change to this slide
                        handleManualSlideChange(itemIndex);
                      } else if (itemIndex === currentSlide) {
                        // Second click: Open modal for current hero item
                        console.log('Opening modal for current hero item:', { itemId: item.id, title: item.title || item.name });
                        handleItemClick(item);
                      }
                    } else {
                      // When not expanded, open modal normally
                      console.log('Thumbnail click in collapsed mode:', { itemId: item.id, title: item.title || item.name });
                      handleItemClick(item);
                    }
                  } catch (error) {
                    handleError('Error in thumbnail click handler', {
                      context: { itemId: item.id, itemTitle: item.title || item.name }
                    });
                  }
                }}
                className="relative w-36 h-54 flex-shrink-0 rounded-xl overflow-hidden group/item focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105 hover:z-10 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  onLoad={handleImageLoad}
                />
                
                {/* Enhanced Overlay with Contextual Information */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300 ${
                  hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  {/* Content Metadata */}
                  <div className="absolute top-2 left-2 right-2">
                    <div className="flex items-center justify-between">
                      {/* Rating */}
                      {item.vote_average && item.vote_average > 0 && (
                        <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white text-xs font-medium">{item.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      
                      {/* Media Type Badge */}
                      <div className="bg-purple-600/80 text-white text-xs px-2 py-1 rounded-md font-medium">
                        {item.media_type === 'movie' ? 'Movie' : 'TV'}
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-center mb-3">
                      <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                        {item.title || item.name}
                      </h3>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        {(item.release_date || item.first_air_date) && (
                          <span className="text-gray-400 text-xs">
                            {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="flex items-center justify-center w-7 h-7 bg-white/90 text-black rounded-full hover:bg-white transition-all shadow-lg"
                        aria-label="Play"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      
                      <StandardizedFavoriteButton
                        item={item}
                        size="md"
                      />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="flex items-center justify-center w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-gray-700/80 transition-all border border-white/20 shadow-lg"
                        aria-label="More info"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Border Effects */}
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-xl group-hover/item:ring-purple-500/50 group-hover/item:ring-2 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          streamingServices={streamingData[selectedItem.id] || []}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default ContentSection;