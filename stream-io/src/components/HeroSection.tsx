import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Star, Calendar, Info, Plus, Check, VolumeX, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SearchResult, VideoResult } from '../types/tmdb';
import { getVideos, getTopContentForAllPlatforms } from '../services/tmdb';
import { STREAMING_SERVICES } from '../constants/streamingServices';
import { useTheme, useModal, useTrailer } from '../stores';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import StandardizedFavoriteButton from './StandardizedFavoriteButton';

interface HeroSectionProps {
  onPlay: (content: SearchResult) => void;
  selectedFilter: 'all' | 'movie' | 'tv';
  isPaused?: boolean;
}

export interface HeroSectionRef {
  handleModalClose: (contentId: number) => void;
}

const HeroSection = React.forwardRef<HeroSectionRef, HeroSectionProps>(({ onPlay, selectedFilter, isPaused = false }, ref) => {
  const { preferences } = usePreferencesStore();
  const { openTrailer, closeTrailer, isOpen: isTrailerActive } = useTrailer();
  const { isOpen: isModalOpen } = useModal();
  const [platformContent, setPlatformContent] = useState<SearchResult[]>([]);
  const [allPlatformContent, setAllPlatformContent] = useState<SearchResult[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<number, string>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Text fade-out state
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState(0);
  const dragThreshold = 40; // Reduced for better sensitivity
  const tapTimeThreshold = 250; // Reduced for more responsive tap detection
  
  // Simplified interaction state - track clicks to determine behavior
  const [trailerStopped, setTrailerStopped] = useState<Record<number, boolean>>({});
  const [modalJustClosed, setModalJustClosed] = useState<Record<number, boolean>>({});
  
  const timeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const videoRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const manualControlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No need for useEffect, we'll call onModalClose directly when needed

  // Fetch platform content on mount
  useEffect(() => {
    const fetchPlatformContent = async () => {
      setIsLoading(true);
      try {
        const content = await getTopContentForAllPlatforms();
        setAllPlatformContent(content);
        
        // Fetch trailers for all content
        const trailerPromises = content.map(async (item) => {
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
        console.error('Error fetching platform content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformContent();

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
  }, []);

  // Import hidden items check from watchlist store
  const { isInHidden } = useWatchlistStore();

  // Filter content based on selectedFilter and hidden status
  useEffect(() => {
    let filteredContent = allPlatformContent.filter(item => !isInHidden(item.id)); // Filter out hidden items
    
    if (selectedFilter === 'movie') {
      filteredContent = filteredContent.filter(item => item.media_type === 'movie');
    } else if (selectedFilter === 'tv') {
      filteredContent = filteredContent.filter(item => item.media_type === 'tv');
    }
    
    setPlatformContent(filteredContent);
    
    // Reset to first slide when filter changes
    if (filteredContent.length > 0) {
      setCurrentSlide(0);
      setIsManuallyControlled(false);
      
      // Reset text visibility state
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(false);
      
      // Clear existing trailers
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Stop any active trailers
      if (filteredContent.length > 0) {
        closeTrailer();
      }
      setTrailerStopped({});
      setModalJustClosed({});
      
      // Clear text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      // Start trailer for first slide after 4 seconds (only if not paused, autoplay is enabled, and trailer hasn't been manually stopped)
      if (!isPaused && preferences.autoplayVideos && trailerKeys[filteredContent[0].id] && !trailerStopped[filteredContent[0].id]) {
        timeoutRefs.current[filteredContent[0].id] = setTimeout(() => {
          const item = filteredContent[0];
          const trailerKey = trailerKeys[item.id];
          if (trailerKey) {
            openTrailer(trailerKey, item.title || item.name || '', item.media_type as 'movie' | 'tv');
          }
        }, 4000);
      }
      
      // Start text fade-out after 7 seconds (only if autoplay is enabled and not permanently visible)
      if (preferences.autoplayVideos) {
        textFadeTimeoutRef.current = setTimeout(() => {
          if (!isTextPermanentlyVisible) {
            setIsTextVisible(false);
          }
        }, 7000);
      }
    }
  }, [selectedFilter, allPlatformContent, trailerKeys, isTextPermanentlyVisible, isPaused, preferences.autoplayVideos, isInHidden]);

  // Auto-advance slides (pause when a section is expanded)
  useEffect(() => {
    if (!isManuallyControlled && !isPaused && platformContent.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % platformContent.length;
          handleSlideChange(nextSlide);
          return nextSlide;
        });
      }, 21000); // 21 seconds per slide to allow time for trailer engagement

      return () => clearInterval(interval);
    }
  }, [isManuallyControlled, isPaused, platformContent.length]);

  // Stop all trailers when paused
  useEffect(() => {
    if (isPaused) {
      // Clear all trailer timeouts
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Stop any active trailer - we don't know the specific ID, so we'll rely on the TrailerContext
    }
  }, [isPaused]);

  const handleSlideChange = (newSlide: number) => {
    if (newSlide === currentSlide) return;

    const currentContent = platformContent[currentSlide];
    const newContent = platformContent[newSlide];

    // Reset text visibility for new slide (unless permanently visible)
    if (!isTextPermanentlyVisible) {
      setIsTextVisible(true);
      
      // Clear existing text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      // Only start text fade-out if autoplay is enabled
      if (preferences.autoplayVideos) {
        textFadeTimeoutRef.current = setTimeout(() => {
          if (!isTextPermanentlyVisible) {
            setIsTextVisible(false);
          }
        }, 7000);
      }
    }

    // Stop current trailer
    if (currentContent) {
      closeTrailer();
      if (timeoutRefs.current[currentContent.id]) {
        clearTimeout(timeoutRefs.current[currentContent.id]);
      }
    }

    // Start new trailer immediately (only if not paused, autoplay is enabled, and trailer hasn't been manually stopped)
    if (!isPaused && preferences.autoplayVideos && newContent && trailerKeys[newContent.id] && !trailerStopped[newContent.id]) {
      timeoutRefs.current[newContent.id] = setTimeout(() => {
        const trailerKey = trailerKeys[newContent.id];
        const title = newContent.title || newContent.name || '';
        const mediaType = newContent.media_type as 'movie' | 'tv';
        openTrailer(trailerKey, title, mediaType);
      }, 0); // Start immediately
    }
  };

  const handleManualSlideChange = (index: number) => {
    setCurrentSlide(index);
    handleSlideChange(index);
    setIsManuallyControlled(true);
    
    // Clear any existing manual control timeout
    if (manualControlTimeoutRef.current) {
      clearTimeout(manualControlTimeoutRef.current);
    }
    
    // Reset auto-advance after 15 seconds of inactivity
    manualControlTimeoutRef.current = setTimeout(() => {
      setIsManuallyControlled(false);
    }, 15000);
  };

  // Drag handlers
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
        const prevIndex = (currentSlide - 1 + platformContent.length) % platformContent.length;
        console.log(`Drag gesture detected: swiping right to slide ${prevIndex}`);
        handleManualSlideChange(prevIndex);
      } else {
        // Swipe left - go to next slide
        const nextIndex = (currentSlide + 1) % platformContent.length;
        console.log(`Drag gesture detected: swiping left to slide ${nextIndex}`);
        handleManualSlideChange(nextIndex);
      }
    } else {
      console.log(`Drag gesture not triggered: deltaX=${deltaX}, deltaY=${deltaY}, duration=${touchDuration}`);
    }
    
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragCurrent({ x: 0, y: 0 });
    setTouchStartTime(0);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Use YouTube postMessage API to control mute without restarting video
    const currentContent = platformContent[currentSlide];
    if (currentContent && videoRefs.current[currentContent.id]) {
      const iframe = videoRefs.current[currentContent.id];
      if (iframe && iframe.contentWindow) {
        try {
          const command = newMutedState ? 'mute' : 'unMute';
          
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
          console.log('Mute command failed:', error);
        }
      }
    }
  };

  const pauseTrailer = (contentId: number) => {
    setTrailerStopped(prev => ({ ...prev, [contentId]: true }));
    closeTrailer();
    
    if (timeoutRefs.current[contentId]) {
      clearTimeout(timeoutRefs.current[contentId]);
    }
  };

  const restoreTextAndShowCover = (contentId: number) => {
    // Bring back text and make it permanently visible
    setIsTextVisible(true);
    setIsTextPermanentlyVisible(true);
    
    // Hide trailer to show cover image
    closeTrailer();
    setTrailerStopped(prev => ({ ...prev, [contentId]: true }));
    
    // Clear text fade timeout
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
  };

  const resumeTrailer = (contentId: number) => {
    console.log('Resuming trailer for content:', contentId);
    
          // Only resume trailer if autoplay is enabled
      if (!preferences.autoplayVideos) {
        console.log('Autoplay disabled, not resuming trailer');
        setModalJustClosed(prev => ({ ...prev, [contentId]: false }));
        return;
      }
    
    // Resume trailer from where it left off
    setTrailerStopped(prev => ({ ...prev, [contentId]: false }));
    const currentContent = platformContent.find(item => item.id === contentId);
    if (currentContent && trailerKeys[contentId]) {
      const trailerKey = trailerKeys[contentId];
      const title = currentContent.title || currentContent.name || '';
      const mediaType = currentContent.media_type as 'movie' | 'tv';
      openTrailer(trailerKey, title, mediaType);
    }
    setModalJustClosed(prev => ({ ...prev, [contentId]: false }));
    
    // Reset text fade behavior for next cycle
    setIsTextPermanentlyVisible(false);
    setIsTextVisible(true); // Show text again when trailer resumes
    
    // Start new text fade-out after 7 seconds (only if autoplay is enabled)
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
    if (preferences.autoplayVideos) {
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 7000);
    }
  };

  // Function to handle modal closure - resume trailer if it was stopped for modal
  const handleModalCloseInternal = (contentId: number) => {
    console.log('handleModalCloseInternal called with contentId:', contentId);
    const currentContent = platformContent[currentSlide];
    console.log('Current content:', currentContent?.id, 'Current slide:', currentSlide);
    console.log('Trailer stopped state:', trailerStopped[contentId]);
    console.log('Has trailer key:', !!trailerKeys[contentId]);
    
    if (currentContent && currentContent.id === contentId && trailerStopped[contentId] && trailerKeys[contentId]) {
      console.log('Modal closed, resuming trailer in 5 seconds');
      setModalJustClosed(prev => ({ ...prev, [contentId]: true }));
      // Wait 5 seconds after modal closes before resuming trailer
      setTimeout(() => {
        console.log('Auto-resuming trailer after modal close');
        resumeTrailer(contentId);
      }, 5000); // Changed from 3 seconds to 5 seconds
    } else {
      console.log('Not resuming trailer - conditions not met:', {
        hasCurrentContent: !!currentContent,
        contentIdMatches: currentContent?.id === contentId,
        isTrailerStopped: trailerStopped[contentId],
        hasTrailerKey: !!trailerKeys[contentId]
      });
    }
  };

  // Expose functions to parent component via ref
  React.useImperativeHandle(ref, () => ({
    handleModalClose: handleModalCloseInternal
  }), [platformContent, currentSlide, trailerStopped, trailerKeys, resumeTrailer]);

  const handleTextClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const currentContent = platformContent[currentSlide];
    if (!currentContent) return;
    
    // If trailer is playing and text has faded, bring it back
    const isTrailerPlaying = isTrailerActive && trailerKeys[currentContent.id] && !trailerStopped[currentContent.id];
    
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
    
    // Enhanced button detection to handle all interactive elements
    if (target.closest('button') || 
        target.closest('.hero-controls') || 
        target.closest('[role="button"]') ||
        target.closest('.standardized-favorite-button') ||
        target.closest('.mute-button')) {
      return;
    }
    
    // Allow clicking on text content to restore text
    if (target.closest('.hero-text-content')) {
      handleTextClick(e);
      return;
    }
    
    const currentContent = platformContent[currentSlide];
    if (!currentContent) return;
    
    const isTrailerPlaying = isTrailerActive && trailerKeys[currentContent.id] && !trailerStopped[currentContent.id];
    const hasTrailerStopped = trailerStopped[currentContent.id];
    const wasModalJustClosed = modalJustClosed[currentContent.id];
    const hasTrailerKey = !!trailerKeys[currentContent.id];
    
    console.log('Hero section interaction:', {
      contentId: currentContent.id,
      isTrailerPlaying,
      hasTrailerStopped,
      wasModalJustClosed,
      hasTrailerKey,
      showTrailer: isTrailerActive,
      trailerStopped: trailerStopped[currentContent.id]
    });
    
    // New simplified interaction logic:
    // 1. First tap when trailer is playing → Stop trailer
    // 2. Second tap when trailer is stopped → Open modal  
    // 3. When modal closes → Resume trailer
    
    if (isTrailerPlaying) {
      // First tap: Stop the trailer
      console.log('First tap: Stopping trailer');
      pauseTrailer(currentContent.id);
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(true);
    } else if (hasTrailerKey && hasTrailerStopped) {
      // Second tap: Stop any trailer and open modal
      console.log('Second tap: Stopping trailer and opening modal');
      pauseTrailer(currentContent.id);
      onPlay(currentContent);
    } else if (!hasTrailerKey) {
      // No trailer available, open modal directly
      console.log('No trailer available, opening modal');
      onPlay(currentContent);
    } else {
      // Fallback case: Stop any trailer and open modal
      console.log('Fallback: Stopping trailer and opening modal');
      if (hasTrailerKey) {
        pauseTrailer(currentContent.id);
      }
      onPlay(currentContent);
    }
  };

  // Enhanced rendering with better visual hierarchy and interactions
  const currentContent = platformContent[currentSlide];
  const currentPlatform = STREAMING_SERVICES.find(service => service.id === currentContent?.platform);
  const title = currentContent?.title || currentContent?.name;
  const backdrop = currentContent?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${currentContent.backdrop_path}`
    : `https://image.tmdb.org/t/p/w780${currentContent?.poster_path}`;

  if (isLoading) {
    return (
      <div className="relative w-full h-[60vh] min-h-[455px] max-h-[555px] overflow-hidden rounded-2xl mb-8 flex items-center justify-center bg-gray-900 focus:outline-none">
        <div className="text-white text-lg animate-pulse">Loading featured content...</div>
      </div>
    );
  }

  if (platformContent.length === 0) {
    return (
      <div className="relative w-full h-[60vh] min-h-[455px] max-h-[555px] overflow-hidden rounded-2xl mb-8 ring-1 ring-gray-800/30 flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">No featured content available</div>
      </div>
    );
  } 

  return(
    <div 
      className={`relative w-full h-[60vh] min-h-[455px] max-h-[555px] overflow-hidden rounded-2xl mb-8 ring-1 ring-gray-800/30 select-none transition-all duration-300 group focus:outline-none ${
        isDragging ? 'cursor-grabbing scale-[0.98]' : 'cursor-grab'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={(e) => {
        setIsHovered(false);
        handleDragEnd();
      }}
      onClick={handleHeroClick}
      // Mouse drag events
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
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
      {/* Background Image/Video */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ${
          isTrailerActive && trailerKeys[currentContent.id] ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        }`}
        style={{ backgroundImage: `url(${backdrop})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Enhanced Trailer Video with Black Bar Elimination */}
      {isTrailerActive && trailerKeys[currentContent.id] && !isModalOpen && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative w-full h-full">
            <iframe
              ref={(el) => { videoRefs.current[currentContent.id] = el; }}
              key={iframeKey}
              src={`https://www.youtube.com/embed/${trailerKeys[currentContent.id]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKeys[currentContent.id]}&start=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
              className="absolute top-1/2 left-1/2 transition-transform duration-1000 group-hover:scale-105"
              style={{ 
                // Calculate dimensions to ensure complete coverage with no black bars
                width: 'max(177.78vh, calc(100vw + 40px))',
                height: 'max(100vh, calc(56.25vw + 40px))',
                minWidth: 'calc(100% + 40px)',
                minHeight: 'calc(100% + 40px)',
                transform: 'translate(-50%, -50%) scale(1.08)',
                pointerEvents: 'none',
                border: 'none',
                filter: 'contrast(1.05) saturate(1.1)',
                objectFit: 'cover'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {/* Enhanced gradients for better content readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
        </div>
      )}

      {/* Enhanced Controls - Smaller and positioned better */}
      <div className="absolute top-6 right-6 z-30 flex space-x-2">
        {/* Trailer Control Button - Always visible and on top */}
        {isTrailerActive && trailerKeys[currentContent.id] && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMute();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMute();
            }}
            className="mute-button flex items-center justify-center w-7 h-7 bg-black/80 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-black/90 hover:border-white/40 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 cursor-pointer"
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

      {/* Enhanced Platform Badge - Fixed position */}
      {currentPlatform && (
        <div className="absolute top-6 left-6 z-20">
          <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/30 shadow-2xl">
            <img 
              src={currentPlatform.logo} 
              alt={currentPlatform.name}
              className="w-6 h-6 rounded object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-white text-sm font-medium">{currentPlatform.name}</span>
          </div>
        </div>
      )}

      {/* Progress Indicators */}
      {platformContent.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex space-x-2">
            {platformContent.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSlideChange(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Content Information */}
      <div className="relative h-full flex items-end z-20">
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl w-full">
          {/* Clickable text content with fade effect */}
          <div 
            className={`hero-text-content cursor-pointer transition-all duration-1000 ease-in-out ${
              isTextVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
            }`}
            onClick={handleTextClick}
            onTouchEnd={handleTextClick}
          >
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-2xl leading-tight">
              {title}
            </h1>

            {/* Content Metadata */}
            <div className="flex items-center space-x-4 mb-2">
              {/* Release Year */}
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{currentContent?.release_date?.split('-')[0] || currentContent?.first_air_date?.split('-')[0] || 'N/A'}</span>
              </div>
              {/* Rating */}
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{currentContent?.vote_average?.toFixed(1) || 'N/A'}</span>
              </div>
              {/* Type of Film */}
              <div className="px-2 py-1 bg-purple-600/80 text-white text-xs font-medium rounded-md backdrop-blur-sm">
                {currentContent?.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-200 text-sm md:text-base mb-6 max-w-2xl drop-shadow-lg leading-relaxed line-clamp-3">
              {currentContent?.overview || 'No description available.'}
            </p>
          </div>

          {/* Action Buttons - Always visible - Smaller and better positioned */}
          <div className="hero-controls flex items-center justify-center md:justify-start space-x-3 mb-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Watch Now always stops trailer and opens modal
                console.log('Watch Now button clicked: Stopping trailer and opening modal');
                if (trailerKeys[currentContent.id]) {
                  pauseTrailer(currentContent.id);
                }
                onPlay(currentContent);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-white/20 transform hover:scale-105"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="text-xs">Watch Now</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // More Info always stops trailer and opens modal
                console.log('More Info button clicked: Stopping trailer and opening modal');
                if (trailerKeys[currentContent.id]) {
                  pauseTrailer(currentContent.id);
                }
                onPlay(currentContent);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-lg font-medium border border-white/20 hover:bg-black/80 hover:border-white/40 transition-all duration-200 shadow-xl"
            >
              <Info className="w-3 h-3" />
              <span className="text-xs">More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HeroSection; 