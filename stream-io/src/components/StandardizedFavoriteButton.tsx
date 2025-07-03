import React, { useState, useRef, useEffect } from 'react';
import { Star, Check, Bookmark, Clock, Eye, EyeOff } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';
import { useWatchlistStore } from '../stores/watchlistStore';
import ListSelectionDialog from './ListSelectionDialog';

interface StandardizedFavoriteButtonProps {
  item: SearchResult;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

const StandardizedFavoriteButton: React.FC<StandardizedFavoriteButtonProps> = ({
  item,
  size = 'md',
  className = '',
  ariaLabel
}) => {
  const [showListDialog, setShowListDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'expanding' | 'expanded' | 'contracting'>('idle');
  
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialPositionRef = useRef({ x: 0, y: 0 });
  
  const { 
    addToFavorite, 
    removeFromFavorite, 
    isInFavorite,
    addToWatchLater,
    markAsWatched,
    addToHidden,
    removeFromHidden,
    isInHidden,
    isItemInWatchlist,
    watchlists
  } = useWatchlistStore();

  // Size configurations
  const sizeConfig = {
    sm: { 
      container: 'w-6 h-6', 
      icon: 'w-3 h-3', 
      buttonHeight: 24,
      expandedHeight: 120, // 24 + (4 buttons * 24px each) - 3 dropdown lists + More Lists
      buttonSpacing: 24
    },
    md: { 
      container: 'w-7 h-7', 
      icon: 'w-3 h-3', 
      buttonHeight: 28,
      expandedHeight: 140, // 28 + (4 buttons * 28px each) - 3 dropdown lists + More Lists
      buttonSpacing: 28
    },
    lg: { 
      container: 'w-10 h-10', 
      icon: 'w-4 h-4', 
      buttonHeight: 40,
      expandedHeight: 200, // 40 + (4 buttons * 40px each) - 3 dropdown lists + More Lists
      buttonSpacing: 40
    }
  };

  const currentSize = sizeConfig[size];

  // Get available list options (simplified for current store)
  const dropdownLists = [
    { id: 'watch-later', name: 'Watch Later', isDefault: true },
    { id: 'watched', name: 'Watched', isDefault: true },
    { id: 'hidden', name: 'Hidden', isDefault: true }
  ];

  // Get current state
  const isInFavoriteList = isInFavorite(item.id);
  const isInWatchLater = isItemInWatchlist(item.id, item.media_type as 'movie' | 'tv');
  const isInHiddenList = isInHidden(item.id);
  const isInOtherLists = isInWatchLater || isInHiddenList;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleCloseDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Determine visual state
  const getButtonState = () => {
    if (isInFavoriteList) {
      // In favorite list - show star with purple background
      return {
        icon: Star,
        bg: 'bg-purple-600',
        text: 'text-white',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      };
    } else if (isInOtherLists) {
      // In other lists but not favorite - show check circle with purple background
      return {
        icon: Check,
        bg: 'bg-purple-600',
        text: 'text-white', 
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      };
    } else {
      // Default state - show star with black background
      return {
        icon: Star,
        bg: 'bg-black/60',
        text: 'text-white',
        border: 'border-white/20',
        hover: 'hover:bg-gray-700/80'
      };
    }
  };

  const buttonState = getButtonState();
  const IconComponent = buttonState.icon;

  // Get list icon
  const getListIcon = (listId: string) => {
    switch (listId) {
      case 'favorite':
        return Star;
      case 'watch-later':
        return Clock;
      case 'watched-already':
        return Eye; // Using Eye icon for "Seen" instead of Check
      case 'hidden':
        return EyeOff;
      default:
        return Bookmark;
    }
  };

  // Handle list toggle from dropdown
  const handleListToggle = async (listId: string) => {
    try {
      const watchlistItem = {
        tmdb_id: item.id,
        media_type: item.media_type as 'movie' | 'tv',
        title: item.title || item.name || '',
        poster_path: item.poster_path || undefined,
        release_date: item.release_date || item.first_air_date,
        rating: item.vote_average,
        is_watched: false
      };

      if (listId === 'favorite') {
        if (isInFavoriteList) {
          await removeFromFavorite(item.id);
        } else {
          await addToFavorite(watchlistItem);
        }
      } else if (listId === 'watch-later') {
        await addToWatchLater(watchlistItem);
      } else if (listId === 'watched') {
        await markAsWatched(watchlistItem);
      } else if (listId === 'hidden') {
        if (isInHiddenList) {
          removeFromHidden(item.id);
        } else {
          addToHidden(item.id);
        }
      }
    } catch (error) {
      console.error('Failed to toggle list:', error);
    }
    
    handleCloseDropdown();
  };

  // Calculate which button is being hovered during drag
  const calculateHighlightedButton = (clientY: number) => {
    if (!buttonRef.current) return 0;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const relativeY = clientY - buttonRect.top - currentSize.buttonHeight;
    
    if (relativeY < 0) return 0; // Still on original button
    
    const buttonIndex = Math.floor(relativeY / currentSize.buttonSpacing);
    const maxIndex = dropdownLists.length; // Include "More Lists" button
    
    return Math.max(0, Math.min(buttonIndex, maxIndex));
  };

  // Handle dropdown close with animation
  const handleCloseDropdown = () => {
    setAnimationPhase('contracting');
    setTimeout(() => {
      setShowDropdown(false);
      setAnimationPhase('idle');
      setIsDragging(false);
      setHighlightedIndex(0);
    }, 200);
  };

  // Handle long press detection
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    initialPositionRef.current = { x: clientX, y: clientY };
    setIsPressed(true);
    longPressTriggered.current = false;
    
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setAnimationPhase('expanding');
      setShowDropdown(true);
      setIsPressed(false);
      
      // Complete expansion animation
      window.setTimeout(() => {
        setAnimationPhase('expanded');
      }, 300);
    }, 500); // 500ms for long press
  };

  const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!longPressTriggered.current || !showDropdown) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    
    // Calculate which button is highlighted
    const newHighlightedIndex = calculateHighlightedButton(clientY);
    setHighlightedIndex(newHighlightedIndex);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (longPressTriggered.current && showDropdown) {
      // Handle drag selection
      if (isDragging) {
        if (highlightedIndex === dropdownLists.length) {
          // "More Lists" button selected
          handleMoreLists();
        } else {
          // Regular list button selected
          const selectedList = dropdownLists[highlightedIndex];
          if (selectedList) {
            handleListToggle(selectedList.id);
          }
        }
      } else {
        // Just close dropdown if no drag occurred
        handleCloseDropdown();
      }
    } else if (!longPressTriggered.current) {
      // Handle normal tap
      handleTap();
    }
  };

  const handleTap = async () => {
    try {
      if (isInFavoriteList) {
        // Remove from favorite list
        await removeFromFavorite(item.id);
      } else {
        // Add to favorite list
        const watchlistItem = {
          tmdb_id: item.id,
          media_type: item.media_type as 'movie' | 'tv',
          title: item.title || item.name || '',
          poster_path: item.poster_path || undefined,
          release_date: item.release_date || item.first_air_date,
          rating: item.vote_average,
          is_watched: false
        };
        await addToFavorite(watchlistItem);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handlePressCancel = () => {
    setIsPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (showDropdown) {
      handleCloseDropdown();
    }
  };

  const handleDialogClose = () => {
    setShowListDialog(false);
  };

  const handleItemAdded = () => {
    // Force re-render by updating state
    // The component will automatically update based on the store state
  };

  // Handle more lists button (opens full dialog)
  const handleMoreLists = () => {
    handleCloseDropdown();
    setShowListDialog(true);
  };

  // Calculate dynamic height for animation
  const getDropdownHeight = () => {
    if (animationPhase === 'expanding') {
      return currentSize.expandedHeight;
    } else if (animationPhase === 'expanded') {
      return currentSize.expandedHeight;
    } else if (animationPhase === 'contracting') {
      return currentSize.buttonHeight;
    }
    return currentSize.buttonHeight;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`
          relative overflow-hidden backdrop-blur-sm rounded-full border transition-all duration-300 shadow-lg
          ${buttonState.bg}
          ${buttonState.border}
          ${showDropdown ? 'z-50' : 'z-10'}
        `}
        style={{
          width: currentSize.container.split(' ')[0].replace('w-', '') === '6' ? '24px' : 
                 currentSize.container.split(' ')[0].replace('w-', '') === '7' ? '28px' : '40px',
          height: `${getDropdownHeight()}px`,
          maxHeight: showDropdown ? `${currentSize.expandedHeight}px` : `${currentSize.buttonHeight}px`,
          transition: animationPhase === 'expanding' || animationPhase === 'contracting' 
            ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'none'
        }}
      >
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={handlePressStart}
          onMouseMove={handlePressMove}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressCancel}
          onTouchStart={handlePressStart}
          onTouchMove={handlePressMove}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressCancel}
          className={`
            absolute top-0 left-0 right-0
            flex items-center justify-center transition-all duration-200
            ${buttonState.text}
            ${buttonState.hover}
            ${isPressed ? 'scale-95' : 'scale-100'}
            ${className}
          `}
          style={{ height: `${currentSize.buttonHeight}px` }}
          aria-label={ariaLabel || (isInFavoriteList ? "Remove from Favorite" : "Add to Favorite")}
        >
          <IconComponent className={`${currentSize.icon} ${buttonState.icon === Star ? 'fill-current' : ''}`} />
        </button>

        {/* Expanded Button List */}
        {showDropdown && animationPhase !== 'idle' && (
          <div 
            className="absolute top-0 left-0 right-0 flex flex-col"
            style={{ 
              paddingTop: `${currentSize.buttonHeight}px`,
              opacity: animationPhase === 'expanded' ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            {dropdownLists.map((list, index) => {
              const ListIcon = getListIcon(list.id);
              const isItemInList = list.id === 'hidden' ? isInHiddenList : 
                                   list.id === 'watch-later' ? isInWatchLater : 
                                   false;
              const isHighlighted = highlightedIndex === index && isDragging;
              
              return (
                <div
                  key={list.id}
                  className={`
                    flex items-center justify-center transition-all duration-150
                    ${isHighlighted ? 'bg-white/20 scale-110' : ''}
                    ${isItemInList ? 'text-yellow-300' : buttonState.text}
                  `}
                  style={{ 
                    height: `${currentSize.buttonSpacing}px`,
                    transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <ListIcon 
                    className={`
                      ${currentSize.icon} 
                      ${isItemInList && list.id === 'favorite' ? 'fill-current' : ''}
                      ${isHighlighted ? 'drop-shadow-lg' : ''}
                    `} 
                  />
                </div>
              );
            })}
            
            {/* More Lists Button */}
            <div
              className={`
                flex items-center justify-center transition-all duration-150
                ${highlightedIndex === dropdownLists.length && isDragging ? 'bg-white/20 scale-110' : ''}
                ${buttonState.text}
              `}
              style={{ 
                height: `${currentSize.buttonSpacing}px`,
                transform: highlightedIndex === dropdownLists.length && isDragging ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <ListSelectionDialog
        item={item}
        isOpen={showListDialog}
        onClose={handleDialogClose}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default StandardizedFavoriteButton; 