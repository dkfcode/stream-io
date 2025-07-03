import React from 'react';
import { Loader, Film, Tv, User, Search, Settings, Zap, Play } from 'lucide-react';

export interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Context type for appropriate icon */
  context?: 'general' | 'movie' | 'tv' | 'person' | 'search' | 'settings' | 'live' | 'hero';
  /** Show skeleton loader instead of spinner */
  showSkeleton?: boolean;
  /** Custom className */
  className?: string;
  /** Whether to show detailed loading info */
  showDetails?: boolean;
  /** Loading progress (0-100) */
  progress?: number;
}

export interface SkeletonProps {
  /** Type of skeleton to show */
  type: 'thumbnail' | 'section' | 'hero' | 'list' | 'grid';
  /** Number of skeleton items */
  count?: number;
  /** Custom className */
  className?: string;
}

// Enhanced loading spinner with context-aware icons
export const EnhancedLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  context = 'general',
  showSkeleton = false,
  className = '',
  showDetails = false,
  progress
}) => {
  const sizeClasses = {
    sm: { container: 'p-4', spinner: 'w-4 h-4', text: 'text-sm' },
    md: { container: 'p-6', spinner: 'w-6 h-6', text: 'text-base' },
    lg: { container: 'p-8', spinner: 'w-8 h-8', text: 'text-lg' },
    xl: { container: 'p-12', spinner: 'w-12 h-12', text: 'text-xl' }
  };

  const contextIcons = {
    general: Loader,
    movie: Film,
    tv: Tv,
    person: User,
    search: Search,
    settings: Settings,
    live: Zap,
    hero: Play
  };

  const IconComponent = contextIcons[context];
  const currentSize = sizeClasses[size];

  if (showSkeleton) {
    return <SkeletonLoader type="section" className={className} />;
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center ${currentSize.container} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center space-x-3 mb-2">
        <IconComponent 
          className={`${currentSize.spinner} animate-spin text-purple-500`}
          aria-hidden="true"
        />
        <span className={`text-gray-300 ${currentSize.text} font-medium`}>
          {message}
        </span>
      </div>
      
      {progress !== undefined && (
        <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            aria-label={`Loading progress: ${progress}%`}
          />
        </div>
      )}
      
      {showDetails && (
        <div className="mt-2 text-xs text-gray-400 text-center max-w-xs">
          <p>Please wait while we fetch the latest content...</p>
        </div>
      )}
    </div>
  );
};

// Skeleton loader for different content types
export const SkeletonLoader: React.FC<SkeletonProps> = ({
  type,
  count = 6,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'thumbnail':
        return (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-xl mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      
      case 'section':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 bg-gray-700 rounded w-48"></div>
              <div className="h-10 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[2/3] bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        );
      
      case 'hero':
        return (
          <div className={`animate-pulse h-96 bg-gray-700 rounded-2xl flex items-end p-8 ${className}`}>
            <div className="space-y-4 w-full max-w-2xl">
              <div className="h-8 bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-600 rounded w-2/3"></div>
              <div className="flex space-x-4 mt-6">
                <div className="h-12 bg-gray-600 rounded w-32"></div>
                <div className="h-12 bg-gray-600 rounded w-32"></div>
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="w-16 h-24 bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'grid':
        return (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        );
      
      default:
        return <div className="animate-pulse h-32 bg-gray-700 rounded"></div>;
    }
  };

  return (
    <div role="status" aria-label="Loading content">
      {renderSkeleton()}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Error state component with user-friendly messages
export interface ErrorStateProps {
  /** Error message */
  message?: string;
  /** Error type for appropriate styling */
  type?: 'network' | 'not-found' | 'server' | 'generic';
  /** Retry function */
  onRetry?: () => void;
  /** Custom className */
  className?: string;
  /** Show detailed error info in development */
  showDetails?: boolean;
  /** Detailed error information */
  details?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  type = 'generic',
  onRetry,
  className = '',
  showDetails = false,
  details
}) => {
  const errorMessages = {
    network: 'Unable to connect. Please check your internet connection.',
    'not-found': 'The requested content could not be found.',
    server: 'Our servers are experiencing issues. Please try again later.',
    generic: 'Something went wrong. Please try again.'
  };

  const displayMessage = message || errorMessages[type];

  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="text-6xl mb-4" aria-hidden="true">
        {type === 'network' ? '📡' : type === 'not-found' ? '🔍' : '⚠️'}
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        Oops! Something went wrong
      </h3>
      
      <p className="text-gray-400 mb-6 max-w-md">
        {displayMessage}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Try again"
        >
          Try Again
        </button>
      )}
      
      {showDetails && details && (
        <details className="mt-6 text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-400">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 bg-gray-800 rounded text-left overflow-auto max-w-md">
            {details}
          </pre>
        </details>
      )}
    </div>
  );
};

// Empty state component
export interface EmptyStateProps {
  /** Empty state message */
  message?: string;
  /** Empty state type */
  type?: 'no-results' | 'no-favorites' | 'no-watchlist' | 'no-content';
  /** Action button */
  actionLabel?: string;
  /** Action function */
  onAction?: () => void;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Custom className */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  type = 'no-content',
  actionLabel,
  onAction,
  icon,
  className = ''
}) => {
  const emptyStateConfig = {
    'no-results': {
      emoji: '🔍',
      title: 'No results found',
      message: 'Try adjusting your search criteria or explore our recommendations.'
    },
    'no-favorites': {
      emoji: '❤️',
      title: 'No favorites yet',
      message: 'Start adding movies and shows to your favorites to see them here.'
    },
    'no-watchlist': {
      emoji: '📺',
      title: 'Your watchlist is empty',
      message: 'Add movies and shows to your watchlist to keep track of what you want to watch.'
    },
    'no-content': {
      emoji: '📱',
      title: 'No content available',
      message: 'Check back later for new content or try refreshing the page.'
    }
  };

  const config = emptyStateConfig[type];

  return (
    <div 
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="text-6xl mb-4" aria-hidden="true">
        {icon || config.emoji}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">
        {config.title}
      </h3>
      
      <p className="text-gray-400 mb-6 max-w-md">
        {message || config.message}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Specialized loading fallbacks for different contexts
export const SectionLoadingFallback: React.FC = () => (
  <EnhancedLoadingState 
    context="general" 
    size="md" 
    message="Loading section..." 
    showSkeleton={true}
  />
);

export const HeroLoadingFallback: React.FC = () => (
  <SkeletonLoader type="hero" />
);

export const SearchLoadingFallback: React.FC = () => (
  <EnhancedLoadingState 
    context="search" 
    size="md" 
    message="Searching..." 
    showDetails={true}
  />
);

export const SettingsLoadingFallback: React.FC = () => (
  <EnhancedLoadingState 
    context="settings" 
    size="lg" 
    message="Loading settings..." 
  />
);

export const LiveContentLoadingFallback: React.FC = () => (
  <EnhancedLoadingState 
    context="live" 
    size="md" 
    message="Loading live content..." 
    showDetails={true}
  />
);

// Export all components
export default {
  EnhancedLoadingState,
  SkeletonLoader,
  ErrorState,
  EmptyState,
  SectionLoadingFallback,
  HeroLoadingFallback,
  SearchLoadingFallback,
  SettingsLoadingFallback,
  LiveContentLoadingFallback
}; 