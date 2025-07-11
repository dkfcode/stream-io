import React, { useState, useRef, useEffect } from 'react';
import { Star, Check, Bookmark, Clock, Eye, EyeOff, Plus } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';
import { useWatchlistStore } from '../stores/watchlistStore';
import ListSelectionDialog from './ListSelectionDialog';

interface StandardizedFavoriteButtonProps {
  item: SearchResult;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  onDropdownStateChange?: (isOpen: boolean) => void;
}

const StandardizedFavoriteButton: React.FC<StandardizedFavoriteButtonProps> = ({
  item,
  size = 'md',
  className = '',
  ariaLabel,
  onDropdownStateChange
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
    isInWatchLater,
    markAsWatched,
    addToHidden,
    removeFromHidden,
    isInHidden,
    isItemInWatchlist,
    watchlists,
    isInWatched
  } = useWatchlistStore();

  // Size configurations
  const sizeConfig = {
    sm: { 
      container: 'w-6 h-6', 
      icon: 'w-3 h-3', 
      buttonHeight: 24,
      buttonSpacing: 24
    },
    md: { 
      container: 'w-7 h-7', 
      icon: 'w-3 h-3', 
      buttonHeight: 28,
      buttonSpacing: 28
    },
    lg: { 
      container: 'w-10 h-10', 
      icon: 'w-4 h-4', 
      buttonHeight: 40,
      buttonSpacing: 40
    }
  };

  const currentSize = sizeConfig[size];

  // Get available list options (excluding favorite since main button handles that)
  const dropdownLists = [
    { id: 'watch-later', name: 'Watch Later', isDefault: true },
    { id: 'watched', name: 'Watched', isDefault: true },
    { id: 'hidden', name: 'Hidden', isDefault: true }
  ];

  // Get current state  
  const isInFavoriteList = isInFavorite(item.id);
  const isInWatchLaterList = isInWatchLater(item.id);
  const isInWatchedList = isInWatched(item.id);
  const isInHiddenList = isInHidden(item.id);
  const isInOtherLists = isInWatchLaterList || isInWatchedList || isInHiddenList;

  // Check if item is in any custom lists (non-default lists)
  const isInCustomLists = watchlists.some(watchlist => 
    watchlist.list_type === 'custom' && 
    watchlist.items?.some(watchlistItem => 
      watchlistItem.tmdb_id === item.id && watchlistItem.media_type === item.media_type
    )
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleCloseDropdown();
      }
    };

    if (showDropdown) {
      // Handle both mouse and touch events for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  // NEW: Notify parent component of dropdown state changes
  useEffect(() => {
    if (onDropdownStateChange) {
      onDropdownStateChange(showDropdown);
    }
  }, [showDropdown, onDropdownStateChange]);

  // Determine visual state
  const getButtonState = () => {
    if (isInFavoriteList) {
      // In favorite list - show filled star with white color and purple background
      return {
        icon: Star,
        bg: 'bg-purple-500/80', // Purple background when in favorites
        text: 'text-white', // White star when in favorites
        border: 'border-purple-400/40',
        hover: 'hover:bg-purple-600/80',
        fillStar: true // Fill the star when in favorites
      };
    } else {
      // Not in favorites - show unfilled star with white color and black background
      return {
        icon: Star,
        bg: 'bg-black/60',
        text: 'text-white', // White color when not in favorites
        border: 'border-white/20',
        hover: 'hover:bg-gray-700/80',
        fillStar: false // Don't fill the star when not in favorites
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
        return Bookmark; // Changed from Clock to Bookmark as requested
      case 'watched':
        return Check; // Changed from Eye to Check as requested
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

      if (listId === 'watch-later') {
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
    setShowDropdown(false);
    setIsPressed(false);
    setAnimationPhase('contracting');
    
    // Notify parent that dropdown is closed
    if (onDropdownStateChange) {
      onDropdownStateChange(false);
    }
    
    setTimeout(() => {
      setAnimationPhase('idle');
    }, 300);
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

    // Check if this was a long press that triggered dropdown AND we're dragging
    if (longPressTriggered.current && isDragging && showDropdown) {
      // Handle drag selection within dropdown
      if (highlightedIndex === dropdownLists.length) {
        // "More Lists" button selected
        handleMoreLists();
      } else if (highlightedIndex < dropdownLists.length) {
        // Regular list button selected
        const selectedList = dropdownLists[highlightedIndex];
        if (selectedList) {
          handleListToggle(selectedList.id);
        }
      }
    } else if (longPressTriggered.current && !isDragging && showDropdown) {
      // Long press was triggered but no dragging occurred - keep dropdown open
      // Reset dragging state for next interaction
      setIsDragging(false);
      setHighlightedIndex(0);
    } else {
      // Handle normal tap (either dropdown not open, or normal tap on main button)
      handleTap();
    }
    
    // Reset long press state for next interaction
    longPressTriggered.current = false;
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
    // Don't close dropdown if it's already expanded and visible
    // This prevents auto-dismiss when mouse moves into dropdown area on desktop
    if (showDropdown && animationPhase === 'expanded') {
      // Dropdown is already open and fully expanded, don't close it
      // Let the outside click detection handle closing instead
      return;
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
    if (animationPhase === 'idle') {
      return currentSize.buttonHeight;
    }
    
    // Calculate actual number of items being displayed
    const baseItems = dropdownLists.length; // 3 default items (watch-later, watched, hidden) - favorite handled by main button
    const customListIndicator = isInCustomLists ? 1 : 0; // Only add if custom lists exist
    const plusButton = 1; // Always present
    const totalItems = baseItems + customListIndicator + plusButton;
    
    const dynamicHeight = currentSize.buttonHeight + (totalItems * currentSize.buttonSpacing);
    
    if (animationPhase === 'expanding' || animationPhase === 'expanded') {
      return dynamicHeight;
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
          maxHeight: showDropdown ? `${getDropdownHeight()}px` : `${currentSize.buttonHeight}px`,
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
            ${showDropdown ? 'z-10' : 'z-0'}
            ${buttonState.text}
            ${buttonState.hover}
            ${isPressed ? 'scale-95' : 'scale-100'}
            ${className}
          `}
          style={{ height: `${currentSize.buttonHeight}px` }}
          aria-label={ariaLabel || (isInFavoriteList ? "Remove from Favorite" : "Add to Favorite")}
        >
          <IconComponent className={`${currentSize.icon} ${buttonState.fillStar ? 'fill-current' : ''}`} />
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
                                   list.id === 'watch-later' ? isInWatchLaterList : 
                                   list.id === 'watched' ? isInWatchedList :
                                   false;
              const isHighlighted = highlightedIndex === index && isDragging;
              
              return (
                <button
                  key={list.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleListToggle(list.id);
                  }}
                  className={`
                    relative flex items-center justify-center transition-all duration-150 cursor-pointer hover:bg-white/10
                    ${isHighlighted ? 'bg-white/20 scale-110' : ''}
                    ${isItemInList ? 'text-amber-400' : 'text-white'}
                  `}
                  style={{ 
                    height: `${currentSize.buttonSpacing}px`,
                    transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                  }}
                  aria-label={`${list.name} - ${isItemInList ? 'Remove from' : 'Add to'} ${list.name}`}
                >
                  <ListIcon 
                    className={`
                      ${currentSize.icon} 
                      ${isHighlighted ? 'drop-shadow-lg' : ''}
                    `} 
                  />
                </button>
              );
            })}
            
            {/* Custom List Indicator - Show vertical 3 dots when item is in custom lists */}
            {isInCustomLists && (
              <div className="flex items-center justify-center" style={{ height: `${currentSize.buttonSpacing}px` }}>
                <svg className={`${currentSize.icon} text-amber-400`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </div>
            )}
            
            {/* Add to Custom Lists Button - Plus icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMoreLists();
              }}
              className={`
                flex items-center justify-center transition-all duration-150 cursor-pointer hover:bg-white/10
                text-white
              `}
              style={{ 
                height: `${currentSize.buttonSpacing}px`,
                transform: 'scale(1)' // Always normal scale, never highlighted
              }}
              aria-label="Add to Custom List"
            >
              <Plus className={currentSize.icon} />
            </button>
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