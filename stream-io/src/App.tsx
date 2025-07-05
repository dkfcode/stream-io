import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Settings, Filter } from 'lucide-react';
import SearchBar from './components/SearchBar';
import Navigation from './components/Navigation';
import MagicSearchButton from './components/MagicSearchButton';
import ErrorBoundary, { AppSectionErrorBoundary } from './components/ErrorBoundary';
import { performAISearch } from './services/aiSearchService';
import type { AISearchResult } from './services/aiSearchService';
import { handleAsyncError } from './services/errorHandler';
import toast from 'react-hot-toast';

// Lazy load major tab components to improve performance
const WatchlistContent = React.lazy(() => import('./components/WatchlistContent'));
const LiveContent = React.lazy(() => import('./components/LiveContent'));
const RemoteContent = React.lazy(() => import('./components/RemoteContent'));
const HomePage = React.lazy(() => import('./components/HomePage'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));
const AISearchResultsPage = React.lazy(() => import('./components/AISearchResultsPage'));
const WelcomeScreen = React.lazy(() => import('./components/WelcomeScreen'));
const SetupOverview = React.lazy(() => import('./components/SetupOverview'));

// Loading fallback component
const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
};

// Onboarding flow type
type OnboardingStep = 'welcome' | 'setup' | 'complete';

function App() {
  // Onboarding state - check localStorage for completion status
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    return completed === 'true' ? 'complete' : 'welcome';
  });

  // Main app state
  const [activeTab, setActiveTab] = useState('home');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [liveFilter, setLiveFilter] = useState('all');
  const [showAIResults, setShowAIResults] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResult | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showHomeFilterDropdown, setShowHomeFilterDropdown] = useState(false);
  const [showWatchlistFilterDropdown, setShowWatchlistFilterDropdown] = useState(false);
  const [showLiveFilterDropdown, setShowLiveFilterDropdown] = useState(false);
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  
  // Add missing state for search functionality
  const [watchlistSearchTerm, setWatchlistSearchTerm] = useState('');

  // 🔧 ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS OR CONDITIONAL LOGIC

  // Add useEffect to track onboarding state changes
  useEffect(() => {
    console.log('🔄 Onboarding step changed to:', onboardingStep);
  }, [onboardingStep]);

  // Add useEffect to track active tab changes
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab);
  }, [activeTab]);

  // TEMPORARY DEBUG TOOL - Add global function to reset onboarding for testing
  useEffect(() => {
    (window as any).resetOnboarding = () => {
      localStorage.removeItem('onboardingCompleted');
      setOnboardingStep('welcome');
      console.log('🔄 DEBUG: Onboarding reset to welcome screen');
    };
    
    (window as any).debugAppState = () => {
      console.log('🐛 DEBUG APP STATE:', {
        onboardingStep,
        activeTab,
        mediaFilter,
        showAIResults,
        localStorage: localStorage.getItem('onboardingCompleted')
      });
    };
    
    console.log('🔧 DEBUG TOOLS READY: Use resetOnboarding() or debugAppState() in console');
  }, [onboardingStep, activeTab, mediaFilter, showAIResults]);

  // Track scrolling for magic search button
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowHomeFilterDropdown(false);
        setShowLiveFilterDropdown(false);
        setShowWatchlistFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Onboarding flow handlers
  const handleGetStarted = () => {
    setOnboardingStep('setup');
  };

  const handleStartDiscovering = () => {
    console.log('🚀 Starting main app - onboarding complete');
    console.log('Current onboarding step before update:', onboardingStep);
    
    // Set localStorage to mark onboarding as complete
    localStorage.setItem('onboardingCompleted', 'true');
    console.log('✅ localStorage set to onboardingCompleted: true');
    
    // Set onboarding step to complete (this will trigger main app render)
    setOnboardingStep('complete');
    console.log('✅ setOnboardingStep called with: complete');
    
    // Also ensure we start on the home tab
    setActiveTab('home');
    console.log('✅ setActiveTab called with: home');
    
    console.log('✅ Onboarding complete, should render main app now');
  };

  // Early return for onboarding flow
  if (onboardingStep === 'welcome') {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<LoadingFallback />}>
          <WelcomeScreen onGetStarted={handleGetStarted} />
        </React.Suspense>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
          }}
        />
      </ErrorBoundary>
    );
  }

  if (onboardingStep === 'setup') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <React.Suspense fallback={<LoadingFallback />}>
            <SetupOverview onNext={handleStartDiscovering} />
          </React.Suspense>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
          }}
        />
      </ErrorBoundary>
    );
  }

  const handleTabChange = (tab: string) => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
    setShowAIResults(false);
    setSearchResults(null);
    // Clear search when switching tabs
    setWatchlistSearchTerm('');
  };

  const handleAISearch = async (query: string, tab: string) => {
    try {
      console.log('🚀 Phase 3: AI Search triggered:', { query, tab });
      
      setIsAISearchLoading(true);
      
      // Show immediate feedback to user
      toast.loading('AI is analyzing your request...', { id: 'ai-search' });
      
      // Call the actual AI search service (Phase 3 integration!)
      const aiResults = await performAISearch(query, tab);
      
      console.log('✅ Phase 3: AI Search results:', aiResults);
      
      // Show success message with AI insight
      toast.success(
        aiResults.aiPowered 
          ? `Found ${aiResults.results.length} results using Gemini AI`
          : `Found ${aiResults.results.length} results using smart search`,
        { id: 'ai-search', duration: 3000 }
      );
      
      setSearchResults(aiResults);
      setShowAIResults(true);
      
    } catch (error) {
      console.error('❌ Phase 3: AI Search error:', error);
      
      handleAsyncError(error as Error, {
        operation: 'handleAISearch',
        query,
        tab
      });
      
      toast.error('AI search failed. Please try again.', { id: 'ai-search' });
    } finally {
      setIsAISearchLoading(false);
    }
  };

  const handleBackFromAI = () => {
    setShowAIResults(false);
    setSearchResults(null);
  };

  const handleItemClick = () => {
    // Handle item click from AI results
  };

  // Handle watchlist search
  const handleWatchlistSearch = (searchTerm: string) => {
    setWatchlistSearchTerm(searchTerm);
  };

  const renderHomeFilterDropdown = () => {
    const filterOptions = [
      { value: 'all', label: 'All' },
      { value: 'movie', label: 'Movies' },
      { value: 'tv', label: 'TV Shows' }
    ];

    const currentLabel = filterOptions.find(option => option.value === mediaFilter)?.label || 'All';

    return (
      <div className="relative">
        <button
          onClick={() => setShowHomeFilterDropdown(!showHomeFilterDropdown)}
          className="flex items-center space-x-2 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl px-3 py-2 text-gray-200 transition-colors border border-gray-800/20"
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium text-sm">
            {currentLabel}
          </span>
        </button>
        
        {showHomeFilterDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
            <div className="py-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setMediaFilter(option.value as 'all' | 'movie' | 'tv');
                    setShowHomeFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-toolbar-hover transition-colors ${
                    mediaFilter === option.value ? 'text-purple-400' : 'text-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWatchlistFilterDropdown = () => {
    const filterOptions = [
      { value: 'all', label: 'All' },
      { value: 'movie', label: 'Movies' },
      { value: 'tv', label: 'TV Shows' }
    ];

    const currentLabel = filterOptions.find(option => option.value === mediaFilter)?.label || 'All';

    return (
      <div className="relative">
        <button
          onClick={() => setShowWatchlistFilterDropdown(!showWatchlistFilterDropdown)}
          className="flex items-center space-x-2 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl px-3 py-2 text-gray-200 transition-colors border border-gray-800/20"
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium text-sm">
            {currentLabel}
          </span>
        </button>
        
        {showWatchlistFilterDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
            <div className="py-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setMediaFilter(option.value as 'all' | 'movie' | 'tv');
                    setShowWatchlistFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-toolbar-hover transition-colors ${
                    mediaFilter === option.value ? 'text-purple-400' : 'text-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHeaderContent = () => {
    // Don't show header content on AI search results page
    if (showAIResults && searchResults) {
      return null;
    }

    // Remote tab has different header content (handled in RemoteContent component)
    if (activeTab === 'remote') {
      return (
        <div className="flex items-center space-x-4 w-full">
          {/* Settings button - left aligned */}
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="flex items-center justify-center w-10 h-10 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl text-gray-200 transition-colors border border-gray-800/20 flex-shrink-0"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Remote header container - expands to fill space */}
          <div id="remote-header-container" className="flex-1 flex items-center"></div>
          
          {/* Power button - right aligned */}
          <div id="remote-power-container" className="flex-shrink-0"></div>
        </div>
      );
    }

    // Standard tabs with searchbar and filter
    return (
      <div className="flex items-center space-x-4 w-full">
        {/* Settings button - left aligned */}
        <button
          onClick={() => setShowSettingsPanel(true)}
          className="flex items-center justify-center w-10 h-10 bg-toolbar-hover hover:bg-toolbar-hover rounded-xl text-gray-200 transition-colors border border-gray-800/20 flex-shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        {/* SearchBar - expands to fill space */}
        <div className="flex-1">
          <SearchBar 
            currentTab={activeTab}
            onWatchlistSearch={handleWatchlistSearch}
          />
        </div>
        
        {/* Filter buttons - right aligned */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Filter button for home and watchlist tabs */}
          {(activeTab === 'home') && renderHomeFilterDropdown()}
          {(activeTab === 'watchlist') && renderWatchlistFilterDropdown()}
          
          {/* Live filter container - populated by LiveContent component */}
          {activeTab === 'live' && (
            <div id="live-filter-container"></div>
          )}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    console.log('📱 Rendering main content - activeTab:', activeTab, 'showAIResults:', showAIResults);
    
    if (showAIResults) {
      console.log('🔍 Rendering AI Search Results');
      return (
        <React.Suspense fallback={<LoadingFallback />}>
          <AISearchResultsPage 
            searchResult={searchResults!}
            onBack={handleBackFromAI}
            onItemClick={handleItemClick}
            isLoading={isAISearchLoading}
          />
        </React.Suspense>
      );
    }

    switch (activeTab) {
      case 'home':
        console.log('🏠 Rendering HomePage component');
        console.log('🏠 HomePage props - selectedFilter:', mediaFilter);
        return (
          <AppSectionErrorBoundary sectionName="Home">
            <HomePage selectedFilter={mediaFilter} />
          </AppSectionErrorBoundary>
        );
      case 'live':
        console.log('📺 Rendering LiveContent component');
        return (
          <AppSectionErrorBoundary sectionName="Live">
            <LiveContent 
              selectedFilter={liveFilter}
              onFilterChange={setLiveFilter}
              showFilterDropdown={showLiveFilterDropdown}
              onShowFilterDropdown={setShowLiveFilterDropdown}
            />
          </AppSectionErrorBoundary>
        );
      case 'watchlist':
        console.log('📚 Rendering WatchlistContent component');
        return (
          <AppSectionErrorBoundary sectionName="Watchlist">
            <WatchlistContent selectedFilter={mediaFilter} searchTerm={watchlistSearchTerm} />
          </AppSectionErrorBoundary>
        );
      case 'remote':
        console.log('📺 Rendering RemoteContent component');
        return (
          <AppSectionErrorBoundary sectionName="Remote">
            <RemoteContent />
          </AppSectionErrorBoundary>
        );
      default:
        console.log('🏠 Rendering HomePage component (default case)');
        console.log('🏠 HomePage props (default) - selectedFilter:', mediaFilter);
        return (
          <AppSectionErrorBoundary sectionName="Home">
            <HomePage selectedFilter={mediaFilter} />
          </AppSectionErrorBoundary>
        );
    }
  };

  console.log('🏠 Rendering main app - onboarding step:', onboardingStep, 'active tab:', activeTab);
  
  // Only render main app when onboarding is complete
  if (onboardingStep !== 'complete') {
    console.log('⚠️ Onboarding not complete, step:', onboardingStep);
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <LoadingFallback />
        </div>
      </ErrorBoundary>
    );
  }

  console.log('✅ Onboarding complete, rendering main app');
  console.log('✅ About to render main app with activeTab:', activeTab);
  console.log('✅ mediaFilter:', mediaFilter, 'showAIResults:', showAIResults);
  console.log('✅ Main app div rendering - about to return JSX');
  console.log('✅ Main app layout div rendering');
  console.log('✅ Main content area rendering');
  console.log('🚀 DEBUGGING: About to call renderMainContent()');
  console.log('🚀 DEBUGGING: Inside main app div render');
  console.log('🚀 DEBUGGING: Inside flex layout div');
  console.log('🚀 DEBUGGING: Inside header element');
  console.log('🚀 DEBUGGING: Inside main element - about to render Suspense');
  console.log('🚀 DEBUGGING: Inside Suspense - about to call renderMainContent');
  console.log('🚀 DEBUGGING: Inside footer element');
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
        <div className="flex flex-col h-screen">
          {/* Header with Search/Controls */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-purple-500/20 py-4 relative z-50">
            <div className="px-4 sm:px-6 max-w-7xl mx-auto">
              {renderHeaderContent()}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <React.Suspense fallback={<LoadingFallback />}>
              {renderMainContent()}
            </React.Suspense>
          </main>

          {/* Navigation */}
          <footer className="bg-black/90 backdrop-blur-sm border-t border-purple-500/20 safe-area-inset-bottom">
            <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
          </footer>
        </div>

        {/* Magic Search Button */}
        <MagicSearchButton 
          activeTab={activeTab}
          isScrolling={isScrolling}
          onSearch={handleAISearch}
        />

        {/* Settings Panel */}
        {showSettingsPanel && (
          <React.Suspense fallback={<LoadingFallback />}>
            <AppSectionErrorBoundary sectionName="Settings">
              <SettingsPanel 
                isOpen={showSettingsPanel} 
                onClose={() => setShowSettingsPanel(false)} 
              />
            </AppSectionErrorBoundary>
          </React.Suspense>
        )}

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;