/**
 * Scroll Arrow Utilities
 * 
 * Provides utilities for managing scroll arrows in horizontal scroll containers.
 * Used across multiple components to detect scroll position and show/hide arrows.
 */

import React from 'react';

export interface ScrollState {
  showLeft: boolean;
  showRight: boolean;
}

export interface ScrollContainerRef {
  current: HTMLDivElement | null;
}

/**
 * Check if scroll arrows should be shown based on container scroll position
 * 
 * @param container - The scrollable container element
 * @param threshold - Scroll threshold in pixels to trigger arrow visibility
 * @returns Object indicating which arrows should be shown
 */
export const checkScrollArrows = (
  container: HTMLDivElement | null,
  threshold: number = 20
): ScrollState => {
  if (!container) {
    return { showLeft: false, showRight: false };
  }

  const { scrollLeft, scrollWidth, clientWidth } = container;
  
  return {
    showLeft: scrollLeft > threshold,
    showRight: scrollLeft < scrollWidth - clientWidth - threshold
  };
};

/**
 * Scroll a container in the specified direction
 * 
 * @param container - The scrollable container element
 * @param direction - Direction to scroll ('left' or 'right')
 * @param amount - Amount to scroll in pixels (default: 400)
 */
export const scrollContainer = (
  container: HTMLDivElement | null,
  direction: 'left' | 'right',
  amount: number = 400
): void => {
  if (!container) return;

  const scrollAmount = direction === 'left' ? -amount : amount;
  container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};

/**
 * Set up scroll event listener for a container with automatic arrow updates
 * 
 * @param container - The scrollable container element
 * @param setScrollState - State setter function for scroll arrows
 * @param threshold - Scroll threshold in pixels
 * @returns Cleanup function to remove event listener
 */
export const setupScrollListener = (
  container: HTMLDivElement | null,
  setScrollState: (state: ScrollState) => void,
  threshold: number = 20
): (() => void) => {
  if (!container) {
    return () => {};
  }

  const handleScroll = () => {
    const state = checkScrollArrows(container, threshold);
    setScrollState(state);
  };

  // Initial check
  handleScroll();

  // Add event listener
  container.addEventListener('scroll', handleScroll);

  // Return cleanup function
  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
};

/**
 * Hook-style utility for managing scroll state in React components
 * 
 * @param containerRef - Ref to the scrollable container
 * @param threshold - Scroll threshold in pixels
 * @returns Current scroll state and scroll function
 */
export const useScrollArrows = (
  containerRef: ScrollContainerRef,
  threshold: number = 20
) => {
  const [scrollState, setScrollState] = React.useState<ScrollState>({
    showLeft: false,
    showRight: false
  });

  React.useEffect(() => {
    const cleanup = setupScrollListener(
      containerRef.current,
      setScrollState,
      threshold
    );

    return cleanup;
  }, [containerRef, threshold]);

  const scroll = React.useCallback((direction: 'left' | 'right', amount?: number) => {
    scrollContainer(containerRef.current, direction, amount);
  }, [containerRef]);

  return { scrollState, scroll };
};

/**
 * Generate scroll arrow component props for consistent styling
 */
export const getScrollArrowProps = (
  direction: 'left' | 'right',
  onClick: () => void,
  visible: boolean = true
) => {
  const isLeft = direction === 'left';
  
  return {
    onClick,
    className: `absolute ${isLeft ? '-left-2' : '-right-2'} top-1/2 -translate-y-1/2 p-3 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 border border-gray-600/20 z-20 transition-all shadow-xl`,
    'aria-label': `Scroll ${direction}`,
    style: { display: visible ? 'block' : 'none' }
  };
};

/**
 * Generate gradient overlay props for scroll containers
 */
export const getScrollGradientProps = (direction: 'left' | 'right', visible: boolean = true) => {
  const isLeft = direction === 'left';
  
  return {
    className: `absolute ${isLeft ? 'left-0' : 'right-0'} top-0 bottom-0 w-20 bg-gradient-to-${isLeft ? 'r' : 'l'} from-black/20 to-transparent z-10 pointer-events-none`,
    style: { display: visible ? 'block' : 'none' }
  };
}; 