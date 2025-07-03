/**
 * Grid Layout Utilities
 * 
 * Provides optimal grid layout calculations for content grids.
 * Used across multiple components to ensure consistent responsive layouts.
 */

export interface GridLayoutConfig {
  /** Maximum number of columns for large screens */
  maxColumns?: number;
  /** Whether to optimize for square layouts where possible */
  preferSquareLayouts?: boolean;
  /** Custom breakpoint configurations */
  breakpoints?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

/**
 * Calculate optimal grid layout based on item count and configuration
 * 
 * @param itemCount - Number of items to display
 * @param config - Optional configuration to customize layout behavior
 * @returns Tailwind CSS grid classes string
 */
export const getOptimalGridLayout = (
  itemCount: number, 
  config: GridLayoutConfig = {}
): string => {
  const {
    maxColumns = 4,
    preferSquareLayouts = true,
    breakpoints = {
      small: 'sm',
      medium: 'md',
      large: 'lg'
    }
  } = config;

  if (itemCount === 0) return 'grid-cols-1';
  if (itemCount === 1) return 'grid-cols-1'; // Single item centered
  if (itemCount === 2) return 'grid-cols-2'; // Two items side by side
  if (itemCount === 3) return 'grid-cols-3'; // Three items in a row
  
  // Perfect square layouts
  if (preferSquareLayouts) {
    if (itemCount === 4) return `grid-cols-2 ${breakpoints.small}:grid-cols-4`; // Perfect 2x2 square or single row
    if (itemCount === 9) return 'grid-cols-3'; // Perfect 3x3 square
    if (itemCount === 16) return `grid-cols-2 ${breakpoints.small}:grid-cols-4`; // 4x4 square
  }
  
  // Optimal layouts for common counts
  if (itemCount <= 6) return `grid-cols-2 ${breakpoints.small}:grid-cols-3`; // 2x3 or 3x2 layout
  if (itemCount <= 8) return `grid-cols-2 ${breakpoints.small}:grid-cols-4`; // 2x4 or 4x2 layout
  if (itemCount <= 12) return `grid-cols-3 ${breakpoints.small}:grid-cols-4`; // 3x4 rectangle
  if (itemCount <= 20) return `grid-cols-2 ${breakpoints.small}:grid-cols-4`; // Maintain max columns
  
  // For larger lists, progressive responsive layout optimized for scrolling
  return `grid-cols-2 ${breakpoints.small}:grid-cols-3 ${breakpoints.medium}:grid-cols-${Math.min(maxColumns, 4)}`;
};

/**
 * Get responsive grid layout for see more pages
 * Uses consistent sizing regardless of item count to prevent stretching
 */
export const getSeeMoreGridLayout = (itemCount: number): string => {
  // Always use the same grid layout regardless of item count
  // This prevents items from stretching when there are fewer items
  if (itemCount === 0) return 'grid-cols-1';
  
  // Use consistent grid layout for all non-zero item counts
  // This matches the Live tab's consistent sizing approach
  return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
};

/**
 * Get compact grid layout for sidebar or small containers
 */
export const getCompactGridLayout = (itemCount: number): string => {
  return getOptimalGridLayout(itemCount, {
    maxColumns: 3,
    preferSquareLayouts: true,
    breakpoints: {
      small: 'sm',
      medium: 'md',
      large: 'lg'
    }
  });
};

/**
 * Get hero grid layout for featured content sections
 */
export const getHeroGridLayout = (itemCount: number): string => {
  return getOptimalGridLayout(itemCount, {
    maxColumns: 5,
    preferSquareLayouts: false,
    breakpoints: {
      small: 'sm',
      medium: 'md',
      large: 'xl'
    }
  });
}; 