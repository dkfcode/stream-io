import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authenticatedApiCall } from './authStore';
import { smartToast } from '../utils/toastUtils';

interface UserPreferences {
  id?: string;
  user_id?: string;
  selected_genres: string[];
  selected_services: string[];
  selected_providers: string[];
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
  
  // Theme setting updates
  updateThemeSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  
  // View mode management
  setPreferredViewMode: (viewMode: 'grid' | 'list') => void;
  
  // Computed getters
  getPreferenceValue: <K extends keyof UserPreferences>(key: K) => UserPreferences[K];
  isGenreSelected: (genreId: string) => boolean;
  isServiceSelected: (serviceId: string) => boolean;
  isProviderSelected: (providerId: string) => boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  selected_genres: [],
  selected_services: [],
  selected_providers: [],
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load preferences';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          console.warn('Preferences load failed, using defaults:', errorMessage);
          // Don't show toast for load failures, just use defaults
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

      // Theme setting updates
      updateThemeSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        set((state) => {
          state.preferences[key] = value;
          state.hasUnsavedChanges = true;
        });
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
    })),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        hasUnsavedChanges: state.hasUnsavedChanges,
      }),
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
  const { selected_genres, selected_services, selected_providers } = usePreferencesStore((state) => state.preferences);
  const {
    addGenre, removeGenre, toggleGenre,
    addService, removeService, toggleService,
    addProvider, removeProvider, toggleProvider,
    isGenreSelected, isServiceSelected, isProviderSelected
  } = usePreferencesStore();

  return {
    selected_genres,
    selected_services,
    selected_providers,
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