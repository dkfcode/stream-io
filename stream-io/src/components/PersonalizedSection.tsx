import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles, Star, Clock, Play, Plus, Info, MessageCircle, ChevronDown, ChevronUp, Volume2, VolumeX, Calendar, Bookmark, ArrowLeft, LayoutGrid, List, Filter, X } from 'lucide-react';
import { getTrending, getStreamingServices, getVideos } from '../services/tmdb';
import type { SearchResult, StreamingService } from '../types/tmdb';
import { usePreferences } from '../stores';
import { useTheme, useModal, useTrailer } from '../stores';
import MovieModal from './MovieModal';
import { useWatchlistStore } from '../stores/watchlistStore';
import StandardizedFavoriteButton from './StandardizedFavoriteButton';
import VideoPlayer from './VideoPlayer';
import { useScrollArrows } from '../utils/scrollArrowUtils';
import { getOptimalGridLayout } from '../utils/gridLayoutUtils';
import { handleAsyncError } from '../services/errorHandler';
import StandardizedThumbnail from './shared/StandardizedThumbnail';

interface PersonalizedSectionProps {
  selectedFilter: 'all' | 'movie' | 'tv';
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const PersonalizedSection: React.FC<PersonalizedSectionProps> = ({ 
  selectedFilter,
  isExpanded = false,
  onExpandedChange
}) => {
  const { themeSettings } = useTheme();
  const { openTrailer, closeTrailer, isOpen: isTrailerActive } = useTrailer();
  const { isOpen: isModalOpen } = useModal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const { preferences, setPreferredViewMode } = usePreferences();
  const selectedGenres = preferences.selected_genres || [];
  const preferredViewMode = preferences.preferredViewMode;
  const [loadedImages, setLoadedImages] = useState(0);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [streamingData, setStreamingData] = useState<Record<number, StreamingService[]>>({});
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [moodQuery, setMoodQuery] = useState('');

  // See More state
  const [showSeeMorePage, setShowSeeMorePage] = useState(false);
  const [seeMoreFilter, setSeeMoreFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [showSeeMoreFilterDropdown, setShowSeeMoreFilterDropdown] = useState(false);

  // Hero slideshow state for expanded view
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<number, string>>({});
  const [showTrailer, setShowTrailer] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  
  // Enhanced interaction state for touch gestures
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isTrailerPaused, setIsTrailerPaused] = useState(false);
  const [lastPlayPosition, setLastPlayPosition] = useState(0);
  const dragThreshold = 40;
  const tapTimeThreshold = 250;
  
  const timeoutRefs = useRef<Record<number, number>>({});
  const videoRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const manualControlTimeoutRef = useRef<number | null>(null);
  const textFadeTimeoutRef = useRef<number | null>(null);

  const { data: movies = [] } = useQuery({
    queryKey: ['trending', 'movie'],
    queryFn: () => getTrending('movie'),
  });

  const { data: shows = [] } = useQuery({
    queryKey: ['trending', 'tv'],
    queryFn: () => getTrending('tv'),
  });

  // Watchlist store methods
  const { isInHidden } = useWatchlistStore();

  const combinedContent = useMemo(() => {
    let content = [...movies, ...shows];
    
    // Remove duplicates by ID first
    const uniqueContent = Array.from(new Map(content.map(item => [item.id, item])).values());
    content = uniqueContent;
    
    if (selectedFilter !== 'all') {
      content = content.filter(item => item.media_type === selectedFilter);
    }
    
    // Filter out hidden items
    content = content.filter(item => !isInHidden(item.id));
    
    // Smart content curation based on preferences and mood
    const genreWeighted = content.map(item => {
      const matchingGenres = item.genre_ids?.filter(genreId => 
        selectedGenres.some(selectedGenre => Number(selectedGenre) === genreId)
      ).length || 0;
      
      // Simple mood-based filtering (could be enhanced with AI/ML in the future)
      let moodBoost = 0;
      if (moodQuery) {
        const queryLower = moodQuery.toLowerCase();
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        
        if (title.includes(queryLower) || overview.includes(queryLower)) {
          moodBoost = 3;
        }
        
        // Basic mood keywords
        if (queryLower.includes('action') && item.genre_ids?.includes(28)) moodBoost += 2;
        if (queryLower.includes('comedy') && item.genre_ids?.includes(35)) moodBoost += 2;
        if (queryLower.includes('romance') && item.genre_ids?.includes(10749)) moodBoost += 2;
        if (queryLower.includes('horror') && item.genre_ids?.includes(27)) moodBoost += 2;
        if (queryLower.includes('drama') && item.genre_ids?.includes(18)) moodBoost += 2;
      }
      
      return {
        ...item,
        relevanceScore: (item.vote_average || 0) * 0.4 + 
                       (item.popularity || 0) * 0.001 + 
                       matchingGenres * 2 + 
                       moodBoost
      };
    });
    
    return genreWeighted
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, showSeeMorePage ? 100 : 20);
  }, [movies, shows, selectedFilter, selectedGenres, moodQuery, showSeeMorePage, isInHidden]);

  const handleItemClick = async (item: SearchResult) => {
    setSelectedItem(item);
    if (!streamingData[item.id]) {
      const services = await getStreamingServices(item.id, item.media_type as 'movie' | 'tv');
      setStreamingData(prev => ({ ...prev, [item.id]: services }));
    }
  };

  const handleMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowMoodInput(false);
  };

  // See More handlers
  const handleSeeMoreClick = () => {
    setShowSeeMorePage(true);
  };

  const handleBackFromSeeMore = () => {
    setShowSeeMorePage(false);
  };

  const getOptimalGridLayout = (itemCount: number) => {
    if (itemCount === 0) return 'grid-cols-1';
    // Use consistent grid layout regardless of item count to prevent stretching
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  };

  // Fetch trailers when expanded
  useEffect(() => {
    if (isExpanded && combinedContent.length > 0) {
      const fetchTrailers = async () => {
        try {
          const trailerPromises = combinedContent.slice(0, 10).map(async (item) => {
            try {
              const videos = await getVideos(item.id, item.media_type as 'movie' | 'tv');
              const trailer = videos.find(video => 
                video.site === 'YouTube' && 
                (video.type === 'Trailer' || video.type === 'Teaser') &&
                video.official
              );
              return { id: item.id, key: trailer?.key || null };
            } catch (error) {
              console.error(`Error fetching trailer for ${item.id}:`, error);
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
          console.error('Error fetching trailers:', error);
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
  }, [isExpanded, combinedContent]);

  // Initialize slideshow when expanded
  useEffect(() => {
    if (isExpanded && combinedContent.length > 0) {
      setCurrentSlide(0);
      setIsManuallyControlled(false);
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(false);
      
      // Clear existing trailers and stop any active ones
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Stop any currently active trailers for this section
      closeTrailer();
      setShowTrailer({});
      
      // Clear text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      // Start trailer for first slide after 5 seconds when expanded (only if autoplay is enabled)
      if (themeSettings.autoplayVideos && trailerKeys[combinedContent[0].id]) {
        timeoutRefs.current[combinedContent[0].id] = setTimeout(() => {
          const content = combinedContent[0];
          const trailerKey = trailerKeys[content.id];
          const title = content.title || content.name || '';
          const mediaType = content.media_type as 'movie' | 'tv';
          openTrailer(trailerKey, title, mediaType);
          setShowTrailer(prev => ({ ...prev, [content.id]: true }));
        }, 5000); // Show cover content for 5 seconds before starting trailer
      }
      
      // Start text fade-out after 13 seconds (8 seconds after trailer starts)
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 13000); // Extended to 13 seconds to account for delayed trailer start
    }
  }, [isExpanded, combinedContent, trailerKeys, isTextPermanentlyVisible, themeSettings.autoplayVideos, openTrailer, closeTrailer]);

  // Auto-advance slides when expanded
  useEffect(() => {
    if (isExpanded && !isManuallyControlled && combinedContent.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % combinedContent.length;
          handleSlideChange(nextSlide, prev);
          return nextSlide;
        });
      }, 21000);

      return () => clearInterval(interval);
    }
  }, [isExpanded, isManuallyControlled, combinedContent.length]);

  const handleSlideChange = (newSlide: number, fromSlide?: number) => {
    if (newSlide < 0 || newSlide >= combinedContent.length) {
      return;
    }

    const previousSlide = fromSlide !== undefined ? fromSlide : currentSlide;
    const currentContent = combinedContent[previousSlide];
    const newContent = combinedContent[newSlide];

    if (!newContent) return;

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
    if (currentContent?.id) {
      closeTrailer();
      setShowTrailer(prev => ({ ...prev, [currentContent.id]: false }));
      if (timeoutRefs.current[currentContent.id]) {
        clearTimeout(timeoutRefs.current[currentContent.id]);
        delete timeoutRefs.current[currentContent.id];
      }
    }

    // Start new trailer after showing cover content for 5 seconds (only if autoplay is enabled)
    if (themeSettings.autoplayVideos && newContent?.id && trailerKeys[newContent.id]) {
      if (timeoutRefs.current[newContent.id]) {
        clearTimeout(timeoutRefs.current[newContent.id]);
      }
      
      timeoutRefs.current[newContent.id] = setTimeout(() => {
        const trailerKey = trailerKeys[newContent.id];
        const title = newContent.title || newContent.name || '';
        const mediaType = newContent.media_type as 'movie' | 'tv';
        openTrailer(trailerKey, title, mediaType);
        setShowTrailer(prev => ({ ...prev, [newContent.id]: true }));
      }, 5000); // Show cover content for 5 seconds before starting trailer
    }
  };

  const handleManualSlideChange = (index: number) => {
    if (index < 0 || index >= combinedContent.length || index === currentSlide) {
      return;
    }
    
    handleSlideChange(index, currentSlide);
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
    setIsMuted(!isMuted);
    setIframeKey(prev => prev + 1);
  };

  // Drag handlers for touch gestures
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setTouchStartTime(Date.now());
    setIsManuallyControlled(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setDragCurrent({ x: clientX, y: clientY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = Math.abs(dragCurrent.y - dragStart.y);
    const touchDuration = Date.now() - touchStartTime;
    
    // Enhanced swipe detection with better sensitivity
    if (Math.abs(deltaX) > dragThreshold && deltaY < 100 && touchDuration > tapTimeThreshold) {
      if (deltaX > 0) {
        // Swipe right - go to previous slide
        const prevIndex = (currentSlide - 1 + combinedContent.length) % combinedContent.length;
        console.log(`Expanded section drag gesture: swiping right to slide ${prevIndex}`);
        handleManualSlideChange(prevIndex);
      } else {
        // Swipe left - go to next slide
        const nextIndex = (currentSlide + 1) % combinedContent.length;
        console.log(`Expanded section drag gesture: swiping left to slide ${nextIndex}`);
        handleManualSlideChange(nextIndex);
      }
    }
    
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragCurrent({ x: 0, y: 0 });
    setTouchStartTime(0);
  };

  // Complex interaction functions
  const pauseTrailer = (contentId: number) => {
    setIsTrailerPaused(true);
    setShowTrailer(prev => ({ ...prev, [contentId]: false }));
    
    // Store current play position (simplified)
    setLastPlayPosition(Date.now() % 100);
    
    if (timeoutRefs.current[contentId]) {
      clearTimeout(timeoutRefs.current[contentId]);
    }
  };

  const restoreTextAndShowCover = (contentId: number) => {
    // Bring back text and make it permanently visible
    setIsTextVisible(true);
    setIsTextPermanentlyVisible(true);
    
    // Hide trailer to show cover image
    setShowTrailer(prev => ({ ...prev, [contentId]: false }));
    setIsTrailerPaused(true);
    
    // Clear text fade timeout
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
  };

  const resumeTrailer = (contentId: number) => {
    // Resume trailer from where it left off
    setIsTrailerPaused(false);
    setShowTrailer(prev => ({ ...prev, [contentId]: true }));
    
    // Reset text fade behavior for next cycle
    setIsTextPermanentlyVisible(false);
    
    // Start new text fade-out after 7 seconds
    textFadeTimeoutRef.current = setTimeout(() => {
      if (!isTextPermanentlyVisible) {
        setIsTextVisible(false);
      }
    }, 7000);
  };

  const handleTextClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const currentContent = combinedContent[currentSlide];
    if (!currentContent) return;
    
    // If trailer is playing and text has faded, bring it back
    const isTrailerPlaying = showTrailer[currentContent.id] && trailerKeys[currentContent.id] && !isTrailerPaused;
    
    if (isTrailerPlaying && !isTextVisible) {
      restoreTextAndShowCover(currentContent.id);
    } else {
      // Otherwise, just restore text permanently
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(true);
      
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
    }
  };

  const handleHeroClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger actions if we were actually dragging
    const touchDuration = Date.now() - touchStartTime;
    const distance = Math.sqrt(
      Math.pow(dragCurrent.x - dragStart.x, 2) + 
      Math.pow(dragCurrent.y - dragStart.y, 2)
    );
    
    // If it was a long touch or significant movement, it was probably a drag, not a tap
    if (isDragging && (touchDuration > tapTimeThreshold || distance > 20)) {
      return;
    }
    
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
    
    // Allow clicking on text content to restore text
    if (target.closest('.hero-text-content')) {
      handleTextClick(e);
      return;
    }
    
    const currentContent = combinedContent[currentSlide];
    if (!currentContent) return;
    
    const isTrailerPlaying = showTrailer[currentContent.id] && trailerKeys[currentContent.id] && !isTrailerPaused;
    
    console.log('Expanded hero section interaction:', {
      isTrailerPlaying,
      isTextVisible,
      isTrailerPaused,
      textPermanentlyVisible: isTextPermanentlyVisible
    });
    
    // Complex interaction logic based on current state
    if (!isTrailerPlaying) {
      // State 1: No trailer playing → Open modal
      console.log('No trailer playing, opening modal');
      handleItemClick(currentContent);
    } else if (isTrailerPlaying && isTextVisible && !isTextPermanentlyVisible) {
      // State 2: Trailer playing + text visible → Pause trailer
      console.log('Trailer playing with text visible, pausing trailer');
      pauseTrailer(currentContent.id);
    } else if (isTrailerPlaying && (!isTextVisible || isTextPermanentlyVisible)) {
      // State 3: Trailer playing + text not visible OR permanently visible → Restore text and pause
      console.log('Trailer playing with text hidden/permanent, restoring text and pausing');
      restoreTextAndShowCover(currentContent.id);
    } else {
      // Fallback: Resume trailer if paused
      console.log('Fallback: resuming trailer');
      resumeTrailer(currentContent.id);
    }
  };

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
      if (newCount === combinedContent.length) {
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && combinedContent.length > 0 && !isExpanded) {
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
  }, [combinedContent, isExpanded]);

  if (combinedContent.length === 0) return null;

  // Get filtered items for See More page
  const getSeeMoreFilteredItems = () => {
    let items = combinedContent;
    if (seeMoreFilter !== 'all') {
      items = combinedContent.filter(item => item.media_type === seeMoreFilter);
    }
    return items;
  };

  // Render See More page
  if (showSeeMorePage) {
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
                      <h1 className="text-xl font-bold text-white">Curated for You</h1>
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
              <div className={`grid ${getOptimalGridLayout(seeMoreItems.length)} gap-2`}>
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
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl" data-expanded={isExpanded ? "true" : "false"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMoodInput(!showMoodInput)}
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors hover:bg-purple-600/10 p-1 rounded-lg"
              aria-label="Customize recommendations"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white">Curated for You</h2>
          </div>
        </div>
        
        <div className="relative flex items-center space-x-2">
          {combinedContent.length > 0 && (
            <button
              onClick={handleSeeMoreClick}
              className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap"
            >
              See More
            </button>
          )}
          
          {onExpandedChange && (
            <button
              onClick={() => onExpandedChange(!isExpanded)}
              className="flex items-center space-x-2 text-sm text-purple-400/60 hover:text-purple-300/80 transition-colors font-medium hover:bg-purple-600/10 px-3 py-2 rounded-lg"
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
          
          {showMoodInput && (
            <div className="absolute right-0 top-full mt-2 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-purple-600/30 shadow-xl z-30 w-80">
              <form onSubmit={handleMoodSubmit}>
                <label className="block text-sm text-gray-300 mb-2">
                  Tell us what you're in the mood to watch
                </label>
                <input
                  type="text"
                  value={moodQuery}
                  onChange={(e) => setMoodQuery(e.target.value)}
                  placeholder="e.g., something funny, action-packed, romantic..."
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMoodQuery('');
                      setShowMoodInput(false);
                    }}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {isExpanded ? (
        // Expanded Hero-style View
        <div 
          className={`relative w-full h-96 rounded-xl overflow-hidden mb-6 select-none transition-all duration-300 ${
            isDragging ? 'cursor-grabbing scale-[0.98]' : 'cursor-grab'
          }`}
          onClick={handleHeroClick}
          // Mouse drag events
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          // Touch drag events
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleDragStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        >
          {combinedContent[currentSlide] && (
            <>
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={`https://image.tmdb.org/t/p/original${combinedContent[currentSlide].backdrop_path || combinedContent[currentSlide].poster_path}`}
                  alt={combinedContent[currentSlide].title || combinedContent[currentSlide].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
              </div>

              {/* Trailer Video */}
              {showTrailer[combinedContent[currentSlide].id] && trailerKeys[combinedContent[currentSlide].id] && isTrailerActive('personalizedSection', combinedContent[currentSlide].id) && !isModalOpen && (
                <div className="absolute inset-0 z-10">
                  <iframe
                    key={`${combinedContent[currentSlide].id}-${iframeKey}`}
                    ref={(el) => { if (el) videoRefs.current[combinedContent[currentSlide].id] = el; }}
                    src={`https://www.youtube.com/embed/${trailerKeys[combinedContent[currentSlide].id]}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Content Information */}
              <div className={`hero-text-content absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${
                isTextVisible ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="max-w-2xl space-y-3 cursor-pointer" onClick={handleTextClick}>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    {/* Release Year */}
                    {(combinedContent[currentSlide].release_date || combinedContent[currentSlide].first_air_date) && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {combinedContent[currentSlide].release_date?.split('-')[0] || combinedContent[currentSlide].first_air_date?.split('-')[0]}
                        </span>
                      </div>
                    )}
                    {/* Rating */}
                    {combinedContent[currentSlide].vote_average && combinedContent[currentSlide].vote_average > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{combinedContent[currentSlide].vote_average.toFixed(1)}</span>
                      </div>
                    )}
                    {/* Type of Film */}
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full font-medium">
                      {combinedContent[currentSlide].media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {combinedContent[currentSlide].title || combinedContent[currentSlide].name}
                  </h3>

                  {combinedContent[currentSlide].overview && (
                    <p className="text-sm text-gray-200 leading-relaxed max-w-xl line-clamp-3">
                      {combinedContent[currentSlide].overview}
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start space-x-3 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(combinedContent[currentSlide]);
                      }}
                      className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(combinedContent[currentSlide]);
                      }}
                      className="flex items-center space-x-2 bg-gray-600/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600/80 transition-colors text-sm border border-white/20"
                    >
                      <Info className="w-4 h-4" />
                      <span>More Info</span>
                    </button>

                    {showTrailer[combinedContent[currentSlide].id] && isTrailerActive('personalizedSection', combinedContent[currentSlide].id) && !isModalOpen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute();
                        }}
                        className="flex items-center justify-center w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors border border-white/20"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide Navigation Dots */}
              {/* Removed slideshow indicators as requested */}
            </>
          )}
        </div>
      ) : null}
      
      {/* Horizontal Scroll View - always visible */}
      <div className="relative">
        {showLeftArrow && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/40 to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-sm text-white rounded-xl hover:bg-black/60 border border-gray-600/30 z-20 transition-all shadow-xl"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}

      {showRightArrow && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-sm text-white rounded-xl hover:bg-black/60 border border-gray-600/30 z-20 transition-all shadow-xl"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      
      <div 
        ref={scrollContainerRef}
                  className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
      >
        {combinedContent.map((item) => (
          <div
            key={item.id}
            className="relative group"
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  if (isExpanded) {
                    // When expanded, find the index and change slide or open modal
                    const itemIndex = combinedContent.findIndex(contentItem => contentItem.id === item.id);
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
                  console.error('Error in thumbnail click handler:', error);
                }
              }}
              className="relative w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden group/item focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105 hover:z-10"
            >
              <img
                src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                alt={item.title || item.name}
                className="w-full h-full object-cover transition-transform duration-300"
                onLoad={handleImageLoad}
              />

              {/* Enhanced Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300 ${
                hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
              }`}>
                {/* Content Metadata */}
                <div className="absolute top-2 right-2">
                  {item.vote_average && item.vote_average > 0 && (
                    <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-medium">{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-center mb-3">
                    <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                      {item.title || item.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-300 text-xs">
                        {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                      </span>
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
            </button>
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

export default PersonalizedSection;