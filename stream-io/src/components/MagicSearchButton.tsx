import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Search, X, ArrowRight } from 'lucide-react';
import { useModal } from '../stores/uiStore';
import { useTrailer } from '../stores/uiStore';
import { useI18n } from '../constants/i18n';

interface MagicSearchButtonProps {
  /** Current active tab */
  activeTab: string;
  /** Whether user is currently scrolling */
  isScrolling: boolean;
  /** Whether the hero section is currently in view (for home tab) */
  isHeroInView?: boolean;
  /** Search query submission handler */
  onSearch: (query: string, tab: string) => void;
}

// Input validation to ensure safe and friendly content
const validateInput = (input: string): { isValid: boolean; message?: string } => {
  const trimmedInput = input.trim();
  
  // Check minimum length
  if (trimmedInput.length < 2) {
    return { isValid: true }; // Allow short inputs while typing
  }
  
  // Maximum length check
  if (trimmedInput.length > 200) {
    return { isValid: false, message: "Please keep your search under 200 characters" };
  }
  
  // Basic inappropriate content filtering
  const inappropriatePatterns = [
    /\b(porn|sex|nude|naked|xxx|adult|explicit)\b/i,
    /\b(violence|kill|murder|death|blood)\b/i,
    /\b(hate|racist|discrimination)\b/i,
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmedInput)) {
      return { isValid: false, message: "Please use family-friendly search terms for movie and TV recommendations" };
    }
  }
  
  return { isValid: true };
};

const MagicSearchButton: React.FC<MagicSearchButtonProps> = ({
  activeTab,
  isScrolling,
  isHeroInView = true,
  onSearch
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [inputHeight, setInputHeight] = useState(44); // Start with h-11 equivalent (smaller)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [justExpanded, setJustExpanded] = useState(false); // Track when component was just expanded
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenMeasureRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isOpen: isAnyModalOpen } = useModal();
  const { isOpen: activeTrailer } = useTrailer();

  // Detect if device supports touch
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Calculate dynamic height based on content
  const calculateHeight = (text: string) => {
    if (!hiddenMeasureRef.current) return 44;
    
    hiddenMeasureRef.current.textContent = text || 'What do you want to watch?';
    const scrollHeight = hiddenMeasureRef.current.scrollHeight;
    
    // Minimum height of 44px (h-11), allow up to 160px for more lines
    return Math.min(Math.max(scrollHeight + 16, 44), 160);
  };

  // Update height when query changes
  useEffect(() => {
    if (isExpanded) {
      const newHeight = calculateHeight(query);
      setInputHeight(newHeight);
    } else {
      setInputHeight(44);
    }
  }, [query, isExpanded]);

  // Improved scroll and visibility detection
  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsAtTop(scrollTop < 50); // Consider "at top" if within 50px of top
    };

    const checkSectionExpansion = () => {
      // Look for expanded content sections
      const expandedSections = document.querySelectorAll('[data-expanded="true"]');
      
      if (expandedSections.length === 0) {
        setIsSectionExpanded(false);
        return;
      }
      
      // Check if any expanded section is significantly visible
      let hasVisibleExpandedSection = false;
      expandedSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Only consider it "blocking" if the section takes up more than 40% of viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
          const percentageVisible = visibleHeight / viewportHeight;
          
          if (percentageVisible > 0.4) {
            hasVisibleExpandedSection = true;
          }
        }
      });
      
      setIsSectionExpanded(hasVisibleExpandedSection);
    };

    const handleScroll = () => {
      setIsUserScrolling(true);
      checkScrollPosition();
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Stop considering user as scrolling after 500ms of no scroll events
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        checkSectionExpansion();
      }, 500);
    };

    // Initial checks
    checkScrollPosition();
    checkSectionExpansion();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also observe DOM changes for section expansion
    const observer = new MutationObserver(() => {
      setTimeout(checkSectionExpansion, 50);
    });
    observer.observe(document.body, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['data-expanded'] 
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced visibility logic - show on home, live, and watchlist tabs
  const allowedTabs = ['home', 'live', 'watchlist'];
  
  // Updated visibility logic to be more permissive like before
  const shouldShowButton = (() => {
    // Must be on allowed tab and no modal open
    if (!allowedTabs.includes(activeTab) || isAnyModalOpen) {
      return false;
    }
    
    // Hide when user is actively scrolling for better UX
    if (isUserScrolling) {
      return false;
    }
    
    // For home tab - show the button regardless of hero visibility (restored behavior)
    if (activeTab === 'home') {
      // Only hide if a section is significantly expanded to avoid obstruction
      return !isSectionExpanded;
    }
    
    // For other tabs (live, watchlist), show unless section is expanded or trailer is active
    return !activeTrailer && !isSectionExpanded;
  })();

  // Periodic check to re-show button if conditions are met
  useEffect(() => {
    const checkVisibility = () => {
      // Force re-evaluation of visibility every 2 seconds if button should be shown but isn't
      if (allowedTabs.includes(activeTab) && !isAnyModalOpen && !isUserScrolling) {
        // For home tab, reset section expansion to show button
        if (activeTab === 'home') {
          setIsSectionExpanded(false);
        }
        // For other tabs, use existing logic
        else if (activeTab !== 'home' && !activeTrailer) {
          setIsSectionExpanded(false);
        }
      }
    };

    const interval = setInterval(checkVisibility, 2000);
    return () => clearInterval(interval);
  }, [activeTab, isAnyModalOpen, activeTrailer, isUserScrolling, allowedTabs]);

  // Handle button click - expand to input (with improved iPhone touch handling)
  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 Magic Search Button clicked/touched');
    
    // Simplified touch device handling - no timing restrictions
    if (isTouchDevice) {
      setLastTouchTime(Date.now());
    }
    
    setIsAnimating(true);
    setIsExpanded(true);
    setJustExpanded(true); // Mark that we just expanded
    setValidationError(null);
    
    // Clear the justExpanded flag after a short delay to allow expansion to complete
    setTimeout(() => {
      setJustExpanded(false);
    }, 500); // Give enough time for touch events to settle
    
    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus();
      setIsAnimating(false);
      
      // Additional focus attempt for iOS devices
      if (isTouchDevice) {
        setTimeout(() => {
          inputRef.current?.focus();
          // Trigger click to ensure iOS keyboard appears
          inputRef.current?.click();
        }, 100);
      }
    }, 350);
  };

  // Handle search submission
  const handleSearch = () => {
    const validation = validateInput(query);
    
    if (!validation.isValid) {
      setValidationError(validation.message || "Please enter a valid search term");
      return;
    }
    
    if (query.trim()) {
      console.log('MagicSearchButton: Submitting search:', query.trim(), 'on tab:', activeTab);
      onSearch(query.trim(), activeTab);
      handleClose();
    } else {
      setValidationError("Please enter a search term");
    }
  };

  // Handle input changes with validation
  const handleInputChange = (value: string) => {
    setQuery(value);
    setValidationError(null);
    
    // Real-time validation for inappropriate content
    const validation = validateInput(value);
    if (!validation.isValid) {
      setValidationError(validation.message || "Invalid input");
    }
  };

  // Handle input submission
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Close and collapse
  const handleClose = () => {
    setIsAnimating(true);
    setIsExpanded(false);
    setJustExpanded(false); // Reset the flag when closing
    setQuery('');
    setValidationError(null);
    setInputHeight(44);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 350);
  };

  // Enhanced click-outside handling for mobile devices (improved to not interfere with button)
  useEffect(() => {
    const handleOutsideInteraction = (event: Event) => {
      if (!isExpanded || !containerRef.current) {
        return;
      }

      // Don't close if the component was just expanded (prevent immediate closure)
      if (justExpanded) {
        console.log('🔘 Ignoring outside interaction - component just expanded');
        return;
      }

      const target = event.target as Node;
      
      // Don't close if the interaction is with the button itself (when collapsed)
      if (!isExpanded && containerRef.current.contains(target)) {
        return;
      }
      
      // Check if the click/touch is outside the container
      if (!containerRef.current.contains(target)) {
        console.log('🔘 Closing due to outside interaction');
        handleClose();
      }
    };

    // Use touchend instead of touchstart for better compatibility
    if (isTouchDevice) {
      document.addEventListener('touchend', handleOutsideInteraction, { passive: true });
    } else {
      document.addEventListener('mousedown', handleOutsideInteraction);
    }

    return () => {
      document.removeEventListener('touchend', handleOutsideInteraction);
      document.removeEventListener('mousedown', handleOutsideInteraction);
    };
  }, [isExpanded, isTouchDevice, justExpanded]); // Added justExpanded to dependencies

  // Auto-close if tab changes or modal opens
  useEffect(() => {
    if (!shouldShowButton && isExpanded) {
      handleClose();
    }
  }, [shouldShowButton, isExpanded]);

  // Handle container touch events to prevent event bubbling - REMOVED (this was causing the issue)
  // const handleContainerTouch = (e: React.TouchEvent) => {
  //   e.stopPropagation();
  // };

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ease-out ${
        shouldShowButton 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      } ${isExpanded ? 'w-80' : 'w-11'}`}
      style={{
        transitionProperty: 'all',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation', // Prevent double-tap zoom on mobile
      }}
      // REMOVED: onTouchStart={handleContainerTouch}
      // REMOVED: onTouchEnd={handleContainerTouch}
    >
      {/* Hidden element for measuring text height */}
      <div
        ref={hiddenMeasureRef}
        className="absolute invisible whitespace-pre-wrap text-sm leading-relaxed"
        style={{
          width: '280px', // Match expanded input width minus padding
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          lineHeight: '1.625',
          padding: '0 1rem',
        }}
      />

      {!isExpanded ? (
        // Magic Wand Button - simplified touch handling for iPhone compatibility
        <button
          onClick={handleButtonClick}
          // REMOVED: onTouchEnd={handleButtonClick} - this was causing double firing
          className={`w-11 h-11 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 
                     hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
                     text-white rounded-full shadow-2xl hover:shadow-purple-500/25
                     flex items-center justify-center transition-all duration-300
                     hover:scale-110 active:scale-95 border border-purple-500/30
                     backdrop-blur-sm hover:animate-none`}
          style={{
            transformOrigin: 'center',
            animation: 'pulse 6s ease-in-out infinite', // Much slower, very subtle pulse
            animationIterationCount: '3', // Only pulse 3 times then stop
            touchAction: 'manipulation', // Prevent double-tap zoom
          }}
          aria-label="AI Search"
        >
          <Wand2 className="w-4 h-4" />
        </button>
      ) : (
        // Expanded Search Input - Removed purple background rectangle and fixed centering
        <div
          className={`w-full relative transition-all duration-350 ease-out transform
                     ${isAnimating ? 'scale-95 opacity-90' : 'scale-100 opacity-100'}`}
          style={{
            height: `${inputHeight}px`,
            transformOrigin: 'right center',
            touchAction: 'manipulation', // Prevent double-tap zoom
          }}
          // REMOVED: onTouchStart={handleContainerTouch}
          // REMOVED: onTouchEnd={handleContainerTouch}
        >
          {/* Purple gradient border using the app's theme colors */}
          <div 
            className="absolute inset-0 rounded-full p-[2px] shadow-2xl"
            style={{
              background: 'linear-gradient(45deg, #9333ea, #a855f7, #7c3aed, #9333ea)',
              borderRadius: '24px',
            }}
          >
            <div 
              className="bg-black/90 backdrop-blur-md h-full w-full flex items-center px-5 py-3"
              style={{ borderRadius: '22px' }}
            >
              <Wand2 className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
              
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onTouchStart={(e) => e.stopPropagation()}
                  placeholder="What do you want to watch?"
                  className="w-full bg-transparent text-white placeholder-gray-400 
                           focus:outline-none text-sm leading-relaxed resize-none overflow-hidden"
                  style={{
                    minHeight: '20px',
                    height: `${Math.max(20, inputHeight - 24)}px`, // Account for container padding
                    lineHeight: '1.625',
                    touchAction: 'manipulation', // Prevent double-tap zoom
                  }}
                  rows={1}
                  autoComplete="off"
                  spellCheck="false"
                />
                
                {/* Validation error */}
                {validationError && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-500/90 backdrop-blur-sm rounded-lg text-white text-xs">
                    {validationError}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-3">
                {query && !validationError && (
                  <button
                    onClick={handleSearch}
                    onTouchEnd={(e) => { e.stopPropagation(); handleSearch(); }}
                    className="p-1.5 bg-purple-600 hover:bg-purple-500 rounded-full
                             transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Search"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                
                <button
                  onClick={handleClose}
                  onTouchEnd={(e) => { e.stopPropagation(); handleClose(); }}
                  className="p-1.5 hover:bg-gray-700/50 rounded-full transition-all duration-200
                           hover:scale-105 active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicSearchButton; 