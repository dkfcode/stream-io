import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authenticatedApiCall, useAuthStore } from './authStore';
import { smartToast } from '../utils/toastUtils';

interface UserPreferences {
  id?: string;
  user_id?: string;
  selected_genres: string[];
  selected_services: string[];
  selected_providers: string[];
  selected_broadcast_types: string[];
  language: string;
  region: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  // Theme settings for backward compatibility
  autoplayVideos: boolean;
  preferredAudioLanguage: string;
  preferredSubtitles: string;
  interfaceDensity: 'compact' | 'standard' | 'spacious';
  // View mode preferences
  preferredViewMode: 'grid' | 'list';
  created_at?: string;
  updated_at?: string;
}

interface PreferencesState {
  // State
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updatePreferencesLocally: (updates: Partial<UserPreferences>) => void;
  syncPreferences: () => Promise<void>;
  resetPreferences: () => void;
  clearError: () => void;
  
  // Genre management
  addGenre: (genreId: string) => void;
  removeGenre: (genreId: string) => void;
  toggleGenre: (genreId: string) => void;
  
  // Service management
  addService: (serviceId: string) => void;
  removeService: (serviceId: string) => void;
  toggleService: (serviceId: string) => void;
  
  // Provider management
  addProvider: (providerId: string) => void;
  removeProvider: (providerId: string) => void;
  toggleProvider: (providerId: string) => void;
  
  // Broadcast type management
  addBroadcastType: (broadcastTypeId: string) => void;
  removeBroadcastType: (broadcastTypeId: string) => void;
  toggleBroadcastType: (broadcastTypeId: string) => void;
  
  // Theme setting updates
  updateThemeSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  
  // View mode management
  setPreferredViewMode: (viewMode: 'grid' | 'list') => void;
  
  // Computed getters
  getPreferenceValue: <K extends keyof UserPreferences>(key: K) => UserPreferences[K];
  isGenreSelected: (genreId: string) => boolean;
  isServiceSelected: (serviceId: string) => boolean;
  isProviderSelected: (providerId: string) => boolean;
  isBroadcastTypeSelected: (broadcastTypeId: string) => boolean;
}

// Helper function to apply UI preferences to HTML element
const applyUIPreferences = (preferences: UserPreferences) => {
  const html = document.documentElement;
  
  // Apply interface density
  html.setAttribute('data-density', preferences.interfaceDensity);
  
  // Apply language for CSS pseudo-content and direction
  html.setAttribute('lang', preferences.language);
  
  // Apply theme preference
  html.setAttribute('data-theme', preferences.theme);
  
  console.log('✨ Applied UI preferences:', {
    density: preferences.interfaceDensity,
    language: preferences.language,
    theme: preferences.theme
  });
};

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  selected_genres: [],
  selected_services: [],
  selected_providers: [],
  selected_broadcast_types: [],
  language: 'en',
  region: 'US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  theme: 'dark',
  autoplayVideos: true,
  preferredAudioLanguage: 'en',
  preferredSubtitles: 'off',
  interfaceDensity: 'standard',
  preferredViewMode: 'grid',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      preferences: DEFAULT_PREFERENCES,
      loading: false,
      error: null,
      hasUnsavedChanges: false,

      // Actions
      loadPreferences: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall('/api/user/preferences');
          const userPreferences: UserPreferences = response.data;

          set((state) => {
            state.preferences = { ...DEFAULT_PREFERENCES, ...userPreferences };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });
          
          // Apply UI preferences to HTML element
          applyUIPreferences({ ...DEFAULT_PREFERENCES, ...userPreferences });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load preferences';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          console.warn('Preferences load failed, using defaults:', errorMessage);
          // Apply default preferences to HTML element
          applyUIPreferences(DEFAULT_PREFERENCES);
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall('/api/user/preferences', {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const updatedPreferences: UserPreferences = response.data;

          set((state) => {
            state.preferences = { ...state.preferences, ...updatedPreferences };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });

          smartToast.success('Preferences updated successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          smartToast.error(errorMessage);
          throw error;
        }
      },

      updatePreferencesLocally: (updates: Partial<UserPreferences>) => {
        set((state) => {
          state.preferences = { ...state.preferences, ...updates };
          state.hasUnsavedChanges = true;
        });
      },

      syncPreferences: async () => {
        const { preferences, hasUnsavedChanges } = get();
        
        if (!hasUnsavedChanges) {
          return; // Nothing to sync
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall('/api/user/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
          });

          const updatedPreferences: UserPreferences = response.data;

          set((state) => {
            state.preferences = { ...state.preferences, ...updatedPreferences };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });

          smartToast.success('Preferences synced successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync preferences';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          smartToast.error(errorMessage);
          throw error;
        }
      },

      resetPreferences: () => {
        set((state) => {
          state.preferences = { ...DEFAULT_PREFERENCES };
          state.hasUnsavedChanges = true;
          state.error = null;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Genre management
      addGenre: (genreId: string) => {
        set((state) => {
          if (!state.preferences.selected_genres.includes(genreId)) {
            state.preferences.selected_genres.push(genreId);
            state.hasUnsavedChanges = true;
          }
        });
      },

      removeGenre: (genreId: string) => {
        set((state) => {
          const index = state.preferences.selected_genres.indexOf(genreId);
          if (index > -1) {
            state.preferences.selected_genres.splice(index, 1);
            state.hasUnsavedChanges = true;
          }
        });
      },

      toggleGenre: (genreId: string) => {
        const { isGenreSelected, addGenre, removeGenre } = get();
        if (isGenreSelected(genreId)) {
          removeGenre(genreId);
        } else {
          addGenre(genreId);
        }
      },

      // Service management
      addService: (serviceId: string) => {
        set((state) => {
          if (!state.preferences.selected_services.includes(serviceId)) {
            state.preferences.selected_services.push(serviceId);
            state.hasUnsavedChanges = true;
          }
        });
      },

      removeService: (serviceId: string) => {
        set((state) => {
          const index = state.preferences.selected_services.indexOf(serviceId);
          if (index > -1) {
            state.preferences.selected_services.splice(index, 1);
            state.hasUnsavedChanges = true;
          }
        });
      },

      toggleService: (serviceId: string) => {
        const { isServiceSelected, addService, removeService } = get();
        if (isServiceSelected(serviceId)) {
          removeService(serviceId);
        } else {
          addService(serviceId);
        }
      },

      // Provider management
      addProvider: (providerId: string) => {
        set((state) => {
          if (!state.preferences.selected_providers.includes(providerId)) {
            state.preferences.selected_providers.push(providerId);
            state.hasUnsavedChanges = true;
          }
        });
      },

      removeProvider: (providerId: string) => {
        set((state) => {
          const index = state.preferences.selected_providers.indexOf(providerId);
          if (index > -1) {
            state.preferences.selected_providers.splice(index, 1);
            state.hasUnsavedChanges = true;
          }
        });
      },

      toggleProvider: (providerId: string) => {
        const { isProviderSelected, addProvider, removeProvider } = get();
        if (isProviderSelected(providerId)) {
          removeProvider(providerId);
        } else {
          addProvider(providerId);
        }
      },

      // Broadcast type management
      addBroadcastType: (broadcastTypeId: string) => {
        set((state) => {
          if (!state.preferences.selected_broadcast_types) {
            state.preferences.selected_broadcast_types = [];
          }
          if (!state.preferences.selected_broadcast_types.includes(broadcastTypeId)) {
            state.preferences.selected_broadcast_types.push(broadcastTypeId);
            state.hasUnsavedChanges = true;
          }
        });
      },

      removeBroadcastType: (broadcastTypeId: string) => {
        set((state) => {
          if (!state.preferences.selected_broadcast_types) {
            state.preferences.selected_broadcast_types = [];
            return;
          }
          const index = state.preferences.selected_broadcast_types.indexOf(broadcastTypeId);
          if (index > -1) {
            state.preferences.selected_broadcast_types.splice(index, 1);
            state.hasUnsavedChanges = true;
          }
        });
      },

      toggleBroadcastType: (broadcastTypeId: string) => {
        const { isBroadcastTypeSelected, addBroadcastType, removeBroadcastType } = get();
        if (isBroadcastTypeSelected(broadcastTypeId)) {
          removeBroadcastType(broadcastTypeId);
        } else {
          addBroadcastType(broadcastTypeId);
        }
      },

      // Theme setting updates
      updateThemeSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        set((state) => {
          state.preferences[key] = value;
          state.hasUnsavedChanges = true;
        });
        
        // Apply UI preferences to HTML element immediately
        const currentPreferences = get().preferences;
        applyUIPreferences(currentPreferences);
        
        // Auto-save to localStorage immediately for better UX
        // The Zustand persist middleware will handle the actual localStorage saving
        // We just need to make sure the change is persisted
        
        // Optional: Try to sync to backend if user is authenticated (non-blocking)
        setTimeout(async () => {
          try {
            // Check if user is authenticated before attempting backend sync
            const { isAuthenticated } = useAuthStore.getState();
            if (!isAuthenticated) {
              console.log('ℹ️ Theme setting saved locally (user not authenticated)');
              return;
            }

            const { updatePreferences } = get();
            const updates = { [key]: value } as Partial<UserPreferences>;
            await updatePreferences(updates);
            console.log('✅ Theme setting synced to backend');
          } catch (error) {
            // Ignore backend errors - local changes are already saved
            console.log('ℹ️ Theme setting saved locally (backend sync failed):', error instanceof Error ? error.message : 'Unknown error');
          }
        }, 100); // Small delay to avoid blocking UI
      },

      // View mode management
      setPreferredViewMode: (viewMode: 'grid' | 'list') => {
        set((state) => {
          state.preferences.preferredViewMode = viewMode;
          state.hasUnsavedChanges = true;
        });
      },

      // Computed getters
      getPreferenceValue: <K extends keyof UserPreferences>(key: K): UserPreferences[K] => {
        return get().preferences[key];
      },

      isGenreSelected: (genreId: string): boolean => {
        return get().preferences.selected_genres.includes(genreId);
      },

      isServiceSelected: (serviceId: string): boolean => {
        return get().preferences.selected_services.includes(serviceId);
      },

      isProviderSelected: (providerId: string): boolean => {
        return get().preferences.selected_providers.includes(providerId);
      },

      isBroadcastTypeSelected: (broadcastTypeId: string): boolean => {
        return (get().preferences.selected_broadcast_types || []).includes(broadcastTypeId);
      },
    })),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        hasUnsavedChanges: state.hasUnsavedChanges,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply UI preferences when store is rehydrated from localStorage
        if (state?.preferences) {
          applyUIPreferences(state.preferences);
        }
      },
    }
  )
);

// Helper hooks for specific preference categories
export const useThemePreferences = () => {
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const updatePreferencesLocally = usePreferencesStore((state) => state.updatePreferencesLocally);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);

  return {
    theme,
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      updatePreferencesLocally({ theme });
    },
    saveTheme: (theme: 'light' | 'dark' | 'system') => {
      return updatePreferences({ theme });
    },
  };
};

export const useLocalizationPreferences = () => {
  const { language, region, timezone } = usePreferencesStore((state) => state.preferences);
  const updatePreferencesLocally = usePreferencesStore((state) => state.updatePreferencesLocally);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);

  return {
    language,
    region,
    timezone,
    setLanguage: (language: string) => {
      updatePreferencesLocally({ language });
    },
    setRegion: (region: string) => {
      updatePreferencesLocally({ region });
    },
    setTimezone: (timezone: string) => {
      updatePreferencesLocally({ timezone });
    },
    saveLocalization: (updates: Partial<Pick<UserPreferences, 'language' | 'region' | 'timezone'>>) => {
      return updatePreferences(updates);
    },
  };
};

export const useContentPreferences = () => {
  const { selected_genres, selected_services, selected_providers, selected_broadcast_types } = usePreferencesStore((state) => state.preferences);
  const {
    addGenre, removeGenre, toggleGenre,
    addService, removeService, toggleService,
    addProvider, removeProvider, toggleProvider,
    addBroadcastType, removeBroadcastType, toggleBroadcastType,
    isGenreSelected, isServiceSelected, isProviderSelected, isBroadcastTypeSelected
  } = usePreferencesStore();

  return {
    selected_genres,
    selected_services,
    selected_providers,
    selected_broadcast_types,
    // Genre methods
    addGenre,
    removeGenre,
    toggleGenre,
    isGenreSelected,
    // Service methods
    addService,
    removeService,
    toggleService,
    isServiceSelected,
    // Provider methods
    addProvider,
    removeProvider,
    toggleProvider,
    isProviderSelected,
    // Broadcast type methods
    addBroadcastType,
    removeBroadcastType,
    toggleBroadcastType,
    isBroadcastTypeSelected,
  };
};

// Main preferences hook
export const usePreferences = () => {
  const store = usePreferencesStore();
  return {
    ...store,
    // Computed properties
    isLoading: store.loading,
    hasError: !!store.error,
  };
}; 