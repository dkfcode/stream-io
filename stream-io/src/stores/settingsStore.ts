import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authenticatedApiCall } from './authStore';
import { smartToast } from '../utils/toastUtils';

interface UserSettings {
  id?: string;
  user_id?: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  auto_play_trailers: boolean;
  mature_content: boolean;
  privacy_mode: boolean;
  data_sharing: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SettingsState {
  // State
  settings: UserSettings;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateSettingsLocally: (updates: Partial<UserSettings>) => void;
  syncSettings: () => Promise<void>;
  resetSettings: () => void;
  clearError: () => void;
  
  // Computed getters
  getSettingValue: <K extends keyof UserSettings>(key: K) => UserSettings[K];
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  notifications_enabled: true,
  email_notifications: true,
  push_notifications: true,
  auto_play_trailers: true,
  mature_content: false,
  privacy_mode: false,
  data_sharing: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      settings: DEFAULT_SETTINGS,
      loading: false,
      error: null,
      hasUnsavedChanges: false,

      // Actions
      loadSettings: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // Try to load from backend if authentication is available
          const response = await authenticatedApiCall('/api/user/settings');
          const userSettings: UserSettings = response.data;

          set((state) => {
            state.settings = { ...DEFAULT_SETTINGS, ...userSettings };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });
          
          console.log('✅ Settings loaded from backend');
        } catch (error) {
          // Graceful fallback - use localStorage settings, no error toast
          set((state) => {
            state.loading = false;
            state.error = null; // Don't treat this as an error
          });

          console.log('ℹ️ Settings: Using localStorage (backend unavailable)');
          // Note: Persisted settings from localStorage are already loaded via Zustand persist
        }
      },

      updateSettings: async (updates: Partial<UserSettings>) => {
        // Always update locally first for immediate user feedback
        set((state) => {
          state.settings = { ...state.settings, ...updates };
          state.loading = true;
          state.error = null;
        });

        try {
          // Try to sync to backend
          const response = await authenticatedApiCall('/api/user/settings', {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const updatedSettings: UserSettings = response.data;

          set((state) => {
            state.settings = { ...state.settings, ...updatedSettings };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });

          smartToast.success('Settings saved to account');
        } catch (error) {
          // Backend failed, but local update succeeded
          set((state) => {
            state.loading = false;
            state.hasUnsavedChanges = true; // Mark for later sync
            state.error = null; // Don't show as error since local save worked
          });

          console.log('ℹ️ Settings saved locally (will sync when connected)');
          smartToast.success('Settings saved locally');
        }
      },

      updateSettingsLocally: (updates: Partial<UserSettings>) => {
        set((state) => {
          state.settings = { ...state.settings, ...updates };
          state.hasUnsavedChanges = true;
        });
      },

      syncSettings: async () => {
        const { settings, hasUnsavedChanges } = get();
        
        if (!hasUnsavedChanges) {
          return; // Nothing to sync
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall('/api/user/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
          });

          const updatedSettings: UserSettings = response.data;

          set((state) => {
            state.settings = { ...state.settings, ...updatedSettings };
            state.loading = false;
            state.hasUnsavedChanges = false;
          });

          smartToast.success('Settings synced to account');
        } catch (error) {
          // Sync failed, but don't treat as critical error
          set((state) => {
            state.loading = false;
            // Keep hasUnsavedChanges = true for retry later
            state.error = null;
          });

          console.log('ℹ️ Settings sync failed, will retry when backend available');
          // Don't show error toast for sync failures in demo mode
        }
      },

      resetSettings: () => {
        set((state) => {
          state.settings = { ...DEFAULT_SETTINGS };
          state.hasUnsavedChanges = true;
          state.error = null;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      getSettingValue: <K extends keyof UserSettings>(key: K): UserSettings[K] => {
        return get().settings[key];
      },
    })),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        hasUnsavedChanges: state.hasUnsavedChanges,
      }),
    }
  )
);

// Helper hooks for specific setting categories
export const useNotificationSettings = () => {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettingsLocally = useSettingsStore((state) => state.updateSettingsLocally);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return {
    notifications_enabled: settings.notifications_enabled,
    email_notifications: settings.email_notifications,
    push_notifications: settings.push_notifications,
    updateNotificationSettings: (updates: Partial<Pick<UserSettings, 'notifications_enabled' | 'email_notifications' | 'push_notifications'>>) => {
      updateSettingsLocally(updates);
    },
    saveNotificationSettings: (updates: Partial<Pick<UserSettings, 'notifications_enabled' | 'email_notifications' | 'push_notifications'>>) => {
      return updateSettings(updates);
    },
  };
};

export const usePrivacySettings = () => {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettingsLocally = useSettingsStore((state) => state.updateSettingsLocally);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return {
    mature_content: settings.mature_content,
    privacy_mode: settings.privacy_mode,
    data_sharing: settings.data_sharing,
    updatePrivacySettings: (updates: Partial<Pick<UserSettings, 'mature_content' | 'privacy_mode' | 'data_sharing'>>) => {
      updateSettingsLocally(updates);
    },
    savePrivacySettings: (updates: Partial<Pick<UserSettings, 'mature_content' | 'privacy_mode' | 'data_sharing'>>) => {
      return updateSettings(updates);
    },
  };
};

export const useAppSettings = () => {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettingsLocally = useSettingsStore((state) => state.updateSettingsLocally);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return {
    auto_play_trailers: settings.auto_play_trailers,
    updateAppSettings: (updates: Partial<Pick<UserSettings, 'auto_play_trailers'>>) => {
      updateSettingsLocally(updates);
    },
    saveAppSettings: (updates: Partial<Pick<UserSettings, 'auto_play_trailers'>>) => {
      return updateSettings(updates);
    },
  };
};

// Main settings hook
export const useSettings = () => {
  const store = useSettingsStore();
  return {
    ...store,
    // Computed properties
    isLoading: store.loading,
    hasError: !!store.error,
  };
}; 