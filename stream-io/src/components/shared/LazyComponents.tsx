import React, { Suspense } from 'react';
import { Loader } from 'lucide-react';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <Loader className="w-6 h-6 animate-spin text-purple-500" />
      <span className="text-gray-400">{message}</span>
    </div>
  </div>
);

// Lazy loaded components for better code splitting
export const LazyMovieModal = React.lazy(() => import('../MovieModal'));
export const LazyActorDetailPage = React.lazy(() => import('../ActorDetailPage'));
export const LazyRemoteContent = React.lazy(() => import('../RemoteContent'));
export const LazySettingsPanel = React.lazy(() => import('../SettingsPanel'));
export const LazyVideoPlayer = React.lazy(() => import('../VideoPlayer'));
export const LazyLiveContent = React.lazy(() => import('../LiveContent'));
export const LazyWatchlistContent = React.lazy(() => import('../WatchlistContent'));
export const LazyAISearchResultsPage = React.lazy(() => import('../AISearchResultsPage'));

// Heavy feature components
export const LazyPersonalizedSection = React.lazy(() => import('../PersonalizedSection'));
export const LazyContentSection = React.lazy(() => import('../ContentSection'));

// Wrapper components with proper loading states
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  fallback,
  errorFallback
}) => {
  const defaultFallback = fallback || <LoadingFallback />;
  
  return (
    <Suspense fallback={defaultFallback}>
      <ErrorBoundary fallback={errorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

// Error boundary for lazy loaded components
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">Something went wrong</div>
              <button 
                onClick={() => this.setState({ hasError: false })}
                className="text-purple-500 hover:text-purple-400 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Specific lazy component wrappers with optimized loading
export const LazyMovieModalWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading movie details..." />}>
    <LazyMovieModal {...props} />
  </LazyComponentWrapper>
);

export const LazyActorDetailPageWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading actor details..." />}>
    <LazyActorDetailPage {...props} />
  </LazyComponentWrapper>
);

export const LazyRemoteContentWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading remote control..." />}>
    <LazyRemoteContent {...props} />
  </LazyComponentWrapper>
);

export const LazySettingsPanelWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading settings..." />}>
    <LazySettingsPanel {...props} />
  </LazyComponentWrapper>
);

export const LazyLiveContentWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading live content..." />}>
    <LazyLiveContent {...props} />
  </LazyComponentWrapper>
);

export const LazyWatchlistContentWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading watchlist..." />}>
    <LazyWatchlistContent {...props} />
  </LazyComponentWrapper>
);

export const LazyAISearchResultsPageWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading search results..." />}>
    <LazyAISearchResultsPage {...props} />
  </LazyComponentWrapper>
);

// Performance-optimized section wrappers
export const LazyPersonalizedSectionWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading personalized content..." />}>
    <LazyPersonalizedSection {...props} />
  </LazyComponentWrapper>
);

export const LazyContentSectionWrapper: React.FC<any> = (props) => (
  <LazyComponentWrapper fallback={<LoadingFallback message="Loading content..." />}>
    <LazyContentSection {...props} />
  </LazyComponentWrapper>
);

type ComponentType = React.ComponentType<Record<string, unknown>>;

export const LazyHomePage = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../HomePage')
);

export const LazyWatchlistContent = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../WatchlistContent')
);

export const LazyLiveContent = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../LiveContent')
);

export const LazyRemoteContent = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../RemoteContent')
);

export const LazySettingsPanel = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../SettingsPanel')
);

export const LazyAISearchResultsPage = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../AISearchResultsPage')
);

export const LazyStandardizedSeeMorePage = React.lazy((): Promise<{ default: ComponentType }> => 
  import('./StandardizedSeeMorePage')
);

export const LazyActorDetailPage = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../ActorDetailPage')
);

export const LazyVideoPlayer = React.lazy((): Promise<{ default: ComponentType }> => 
  import('../VideoPlayer')
); 