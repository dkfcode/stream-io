import { useState, useRef, useCallback } from 'react';
import type { SearchResult, StreamingService } from '../types/tmdb';

// Common UI interaction state hook
export const useUIInteractions = () => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [loadedImages, setLoadedImages] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });

  const resetInteractions = useCallback(() => {
    setHoveredItem(null);
    setSelectedItem(null);
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragCurrent({ x: 0, y: 0 });
  }, []);

  const handleImageLoad = useCallback(() => {
    setLoadedImages(prev => prev + 1);
  }, []);

  return {
    hoveredItem,
    setHoveredItem,
    selectedItem,
    setSelectedItem,
    loadedImages,
    handleImageLoad,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragCurrent,
    setDragCurrent,
    resetInteractions
  };
};

// Hero/Carousel state management hook
export const useHeroState = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<number, string>>({});
  const [showTrailer, setShowTrailer] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  const [isTrailerPaused, setIsTrailerPaused] = useState(false);
  const [lastPlayPosition, setLastPlayPosition] = useState(0);

  const timeoutRefs = useRef<Record<number, number>>({});
  const videoRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const manualControlTimeoutRef = useRef<number | null>(null);
  const textFadeTimeoutRef = useRef<number | null>(null);

  const resetHeroState = useCallback(() => {
    setCurrentSlide(0);
    setIsManuallyControlled(false);
    setShowTrailer({});
    setIsTextVisible(true);
    setIsTextPermanentlyVisible(false);
    setIsTrailerPaused(false);
    setLastPlayPosition(0);
  }, []);

  const updateTrailerKey = useCallback((id: number, key: string) => {
    setTrailerKeys(prev => ({ ...prev, [id]: key }));
  }, []);

  const toggleTrailer = useCallback((id: number) => {
    setShowTrailer(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    currentSlide,
    setCurrentSlide,
    isManuallyControlled,
    setIsManuallyControlled,
    trailerKeys,
    setTrailerKeys,
    updateTrailerKey,
    showTrailer,
    setShowTrailer,
    toggleTrailer,
    isMuted,
    setIsMuted,
    toggleMute,
    iframeKey,
    setIframeKey,
    isTextVisible,
    setIsTextVisible,
    isTextPermanentlyVisible,
    setIsTextPermanentlyVisible,
    isTrailerPaused,
    setIsTrailerPaused,
    lastPlayPosition,
    setLastPlayPosition,
    timeoutRefs,
    videoRefs,
    manualControlTimeoutRef,
    textFadeTimeoutRef,
    resetHeroState
  };
};

// See More page state management hook
export const useSeeMoreState = () => {
  const [showSeeMorePage, setShowSeeMorePage] = useState(false);
  const [seeMoreFilter, setSeeMoreFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [showSeeMoreFilterDropdown, setShowSeeMoreFilterDropdown] = useState(false);
  const [seeMoreSection, setSeeMoreSection] = useState<{
    title: string;
    items: SearchResult[];
    sectionId?: string;
    type?: 'movies' | 'shows';
    listId?: string;
  } | null>(null);

  const openSeeMore = useCallback((section: {
    title: string;
    items: SearchResult[];
    sectionId?: string;
    type?: 'movies' | 'shows';
    listId?: string;
  }) => {
    setSeeMoreSection(section);
    setShowSeeMorePage(true);
  }, []);

  const closeSeeMore = useCallback(() => {
    setShowSeeMorePage(false);
    setSeeMoreSection(null);
    setSeeMoreFilter('all');
  }, []);

  return {
    showSeeMorePage,
    setShowSeeMorePage,
    seeMoreFilter,
    setSeeMoreFilter,
    showSeeMoreFilterDropdown,
    setShowSeeMoreFilterDropdown,
    seeMoreSection,
    setSeeMoreSection,
    openSeeMore,
    closeSeeMore
  };
};

// Scroll management hook
export const useScrollState = () => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollArrows = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const targetScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  }, []);

  return {
    showLeftArrow,
    setShowLeftArrow,
    showRightArrow,
    setShowRightArrow,
    scrollContainerRef,
    checkScrollArrows,
    scroll
  };
};

// Streaming data management hook
export const useStreamingData = () => {
  const [streamingData, setStreamingData] = useState<Record<number, StreamingService[]>>({});

  const updateStreamingData = useCallback((itemId: number, services: StreamingService[]) => {
    setStreamingData(prev => ({ ...prev, [itemId]: services }));
  }, []);

  const getStreamingServices = useCallback((itemId: number) => {
    return streamingData[itemId] || [];
  }, [streamingData]);

  const hasStreamingData = useCallback((itemId: number) => {
    return itemId in streamingData;
  }, [streamingData]);

  return {
    streamingData,
    setStreamingData,
    updateStreamingData,
    getStreamingServices,
    hasStreamingData
  };
};

// Touch/gesture management hook
export const useTouchGestures = () => {
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [dragThreshold] = useState(40);
  const [tapTimeThreshold] = useState(250);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartTime(Date.now());
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, onTap?: () => void, onSwipe?: (direction: 'left' | 'right') => void) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration < tapTimeThreshold && onTap) {
      onTap();
    }
    // Additional swipe detection logic can be added here
  }, [touchStartTime, tapTimeThreshold]);

  return {
    touchStartTime,
    setTouchStartTime,
    dragThreshold,
    tapTimeThreshold,
    handleTouchStart,
    handleTouchEnd
  };
};

// Remove unused touchHandler parameters
const touchHandler = useCallback((e: TouchEvent) => {
  // Handle touch events
}, []); 