/**
 * Section Theme Utilities
 * 
 * Provides consistent theming and styling for section containers
 * across the application. Used to standardize section appearance.
 */

export interface SectionTheme {
  container: string;
  header: string;
  title: string;
  subtitle?: string;
  expandButton: string;
  seeMoreButton: string;
  content: string;
}

/**
 * Default section theme used across most components
 */
export const DEFAULT_SECTION_THEME: SectionTheme = {
  container: 'bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl transition-all duration-500',
  header: 'flex items-center justify-between mb-6',
  title: 'text-2xl font-bold text-white',
  subtitle: 'text-sm text-gray-400 mt-1',
  expandButton: 'flex items-center justify-center w-10 h-10 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-lg',
  seeMoreButton: 'text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap',
  content: 'relative'
};

/**
 * Compact section theme for smaller containers
 */
export const COMPACT_SECTION_THEME: SectionTheme = {
  container: 'bg-black/15 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-500/15 shadow-lg transition-all duration-300',
  header: 'flex items-center justify-between mb-4',
  title: 'text-lg font-semibold text-white',
  subtitle: 'text-xs text-gray-400 mt-0.5',
  expandButton: 'flex items-center justify-center w-8 h-8 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-md',
  seeMoreButton: 'text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap',
  content: 'relative'
};

/**
 * Hero section theme for featured content
 */
export const HERO_SECTION_THEME: SectionTheme = {
  container: 'bg-black/25 backdrop-blur-md rounded-3xl p-8 mb-10 border border-purple-500/25 shadow-3xl transition-all duration-700',
  header: 'flex items-center justify-between mb-8',
  title: 'text-3xl font-bold text-white',
  subtitle: 'text-base text-gray-300 mt-2',
  expandButton: 'flex items-center justify-center w-12 h-12 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-xl',
  seeMoreButton: 'text-base text-purple-400 hover:text-purple-300 underline underline-offset-6 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap',
  content: 'relative'
};

/**
 * Live content section theme
 */
export const LIVE_SECTION_THEME: SectionTheme = {
  container: 'bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl transition-all duration-500',
  header: 'flex items-center justify-between mb-6',
  title: 'text-2xl font-bold text-white flex-shrink-0',
  subtitle: 'text-sm text-gray-400 mt-1 flex items-center space-x-2',
  expandButton: 'flex items-center justify-center w-10 h-10 text-purple-400/60 hover:text-purple-300/80 transition-all hover:bg-purple-600/10 rounded-lg',
  seeMoreButton: 'text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/60 hover:decoration-purple-300/80 transition-all whitespace-nowrap',
  content: 'relative'
};

/**
 * Get section theme based on context and preferences
 */
export const getSectionTheme = (
  variant: 'default' | 'compact' | 'hero' | 'live' = 'default',
  isExpanded: boolean = false
): SectionTheme => {
  let baseTheme: SectionTheme;
  
  switch (variant) {
    case 'compact':
      baseTheme = COMPACT_SECTION_THEME;
      break;
    case 'hero':
      baseTheme = HERO_SECTION_THEME;
      break;
    case 'live':
      baseTheme = LIVE_SECTION_THEME;
      break;
    default:
      baseTheme = DEFAULT_SECTION_THEME;
  }

  // Modify container class for expanded state
  if (isExpanded) {
    return {
      ...baseTheme,
      container: `${baseTheme.container} ${isExpanded ? 'pb-0' : ''}`
    };
  }

  return baseTheme;
};

/**
 * Get thumbnail overlay theme for content items
 */
export const getThumbnailOverlayTheme = () => ({
  overlay: 'absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300',
  ratingBadge: 'flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md',
  typeBadge: 'bg-purple-600/80 text-white text-xs px-2.5 py-0.5 rounded-md font-medium',
  favoriteButton: 'absolute top-2 right-2',
  playButton: 'absolute bottom-3 left-3 flex items-center space-x-2 bg-white/90 hover:bg-white text-black px-3 py-1.5 rounded-lg font-medium text-sm transition-colors'
});

/**
 * Get view mode toggle theme
 */
export const getViewModeToggleTheme = () => ({
  container: 'flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1',
  button: 'flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200',
  activeButton: 'bg-purple-600 text-white shadow-sm',
  inactiveButton: 'text-gray-400 hover:text-gray-200'
});

/**
 * Get section icon theme based on section type
 */
export const getSectionIconTheme = (sectionType?: string) => {
  const baseClasses = 'w-5 h-5 ml-2';
  
  switch (sectionType) {
    case 'trending':
      return `${baseClasses} text-orange-400`;
    case 'new':
      return `${baseClasses} text-green-400`;
    case 'expiring':
      return `${baseClasses} text-red-400`;
    case 'popular':
      return `${baseClasses} text-yellow-400`;
    case 'live':
      return `${baseClasses} text-red-500`;
    case 'upcoming':
      return `${baseClasses} text-blue-400`;
    default:
      return `${baseClasses} text-purple-400`;
  }
}; 