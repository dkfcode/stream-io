// Import stores
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';
import { usePreferencesStore } from './preferencesStore';
import { useWatchlistStore } from './watchlistStore';
import { useUIStore } from './uiStore';

// Authentication Store
export {
  useAuthStore,
  useAuth,
  authenticatedApiCall
} from './authStore';

// Settings Store
export {
  useSettingsStore,
  useSettings,
  useNotificationSettings,
  usePrivacySettings,
  useAppSettings
} from './settingsStore';

// Preferences Store
export {
  usePreferencesStore,
  usePreferences,
  useThemePreferences,
  useLocalizationPreferences,
  useContentPreferences
} from './preferencesStore';

// Watchlist Store
export {
  useWatchlistStore,
  useWatchlist,
  useActiveWatchlist,
  useWatchlistItems,
  useDefaultWatchlists
} from './watchlistStore';

// UI Store
export {
  useUIStore,
  useUI,
  useModal,
  useTrailer,
  useTheme,
  useSearch,
  useGlobalLoading,
  useSidebar,
  useSectionExpansion
} from './uiStore';

// Store initialization helper
export const initializeStores = async () => {
  // Initialize auth store - check for stored tokens and validate
  const { refreshTokens, isAuthenticated } = useAuthStore.getState();
  
  if (isAuthenticated) {
    try {
      await refreshTokens();
      
      // Load user-specific data after successful auth
      const { loadSettings } = useSettingsStore.getState();
      const { loadPreferences } = usePreferencesStore.getState();
      const { loadWatchlists } = useWatchlistStore.getState();
      
      await Promise.allSettled([
        loadSettings(),
        loadPreferences(),
        loadWatchlists()
      ]);
    } catch (error) {
      console.warn('Store initialization failed:', error);
      // Don't throw - let app continue without user data
    }
  }
  
  // Initialize theme system
  const { setSystemTheme } = useUIStore.getState();
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setSystemTheme(systemTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    setSystemTheme(e.matches ? 'dark' : 'light');
  });
  
  // Initialize responsive state
  const { setIsMobile } = useUIStore.getState();
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
};

// Store reset helper (for sign out)
export const resetUserStores = () => {
  // Reset all user-specific stores
  useSettingsStore.getState().resetSettings();
  usePreferencesStore.getState().resetPreferences();
  useWatchlistStore.setState({ watchlists: [], activeWatchlistId: null });
  useUIStore.getState().closeModal();
  useUIStore.getState().closeTrailer();
  useUIStore.getState().clearSearch();
}; 