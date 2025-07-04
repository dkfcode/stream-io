import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authenticatedApiCall } from './authStore';
import { smartToast } from '../utils/toastUtils';

interface StreamingPlatform {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface WatchlistItem {
  id: string;
  watchlist_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  release_date?: string;
  rating?: number;
  genres?: string[];
  streaming_platforms?: StreamingPlatform[];
  notes?: string;
  watched_date?: string;
  is_watched: boolean;
  added_at: string;
  updated_at: string;
}

interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  list_type: 'favorites' | 'watch_later' | 'watched' | 'custom';
  sort_order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items?: WatchlistItem[];
}

interface WatchlistState {
  // State
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  loading: boolean;
  error: string | null;
  
  // Recently added tracking
  lastAddedMovie: WatchlistItem | null;
  lastAddedShow: WatchlistItem | null;
  hiddenItems: number[]; // Array of TMDB IDs that are hidden
  
  // Actions
  loadWatchlists: () => Promise<void>;
  createWatchlist: (name: string, description?: string, isPublic?: boolean) => Promise<Watchlist>;
  updateWatchlist: (id: string, updates: Partial<Pick<Watchlist, 'name' | 'description' | 'is_public'>>) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  setActiveWatchlist: (id: string | null) => void;
  
  // Item management
  addToWatchlist: (watchlistId: string, item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => Promise<void>;
  removeFromWatchlist: (itemId: string) => Promise<void>;
  updateWatchlistItem: (itemId: string, updates: Partial<Pick<WatchlistItem, 'notes' | 'is_watched' | 'watched_date'>>) => Promise<void>;
  toggleWatched: (itemId: string) => Promise<void>;
  
  // Quick actions
  addToFavorites: (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => Promise<void>;
  addToFavorite: (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => Promise<void>; // Alias for compatibility
  addToWatchLater: (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => Promise<void>;
  markAsWatched: (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => Promise<void>;
  
  // Favorites management
  removeFromFavorite: (tmdbId: number) => Promise<void>;
  isInFavorite: (tmdbId: number) => boolean;
  
  // Watch Later management
  isInWatchLater: (tmdbId: number) => boolean;
  removeFromWatchLater: (tmdbId: number) => Promise<void>;
  
  // Watched management
  isInWatched: (tmdbId: number) => boolean;
  removeFromWatched: (tmdbId: number) => Promise<void>;
  
  // Hidden items management
  addToHidden: (tmdbId: number) => void;
  removeFromHidden: (tmdbId: number) => void;
  isInHidden: (tmdbId: number) => boolean;
  
  // Utility functions
  clearError: () => void;
  getWatchlistById: (id: string) => Watchlist | undefined;
  getWatchlistByType: (type: Watchlist['list_type']) => Watchlist | undefined;
  isItemInWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv', watchlistId?: string) => boolean;
  getItemFromWatchlists: (tmdbId: number, mediaType: 'movie' | 'tv') => WatchlistItem | undefined;
  ensureDefaultWatchlists: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      watchlists: [],
      activeWatchlistId: null,
      loading: false,
      error: null,

      // Recently added tracking
      lastAddedMovie: null,
      lastAddedShow: null,
      hiddenItems: [],

      // Helper function to ensure default watchlists exist
      ensureDefaultWatchlists: () => {
        const { watchlists } = get();
        const defaultLists = [
          { list_type: 'favorites', name: 'Favorite' },
          { list_type: 'watch_later', name: 'Watch Later' },
          { list_type: 'watched', name: 'Watched Already' },
        ] as const;

        let hasChanges = false;
        const updatedWatchlists = [...watchlists];

        defaultLists.forEach(({ list_type, name }) => {
          if (!watchlists.find(w => w.list_type === list_type)) {
            const newList: Watchlist = {
              id: list_type, // Use list_type as ID for default lists
              user_id: 'local', // Local user ID
              name,
              description: `Default ${name.toLowerCase()} watchlist`,
              is_default: true,
              list_type,
              sort_order: defaultLists.findIndex(l => l.list_type === list_type),
              is_public: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: [],
            };
            updatedWatchlists.push(newList);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          set((state) => {
            state.watchlists = updatedWatchlists;
          });
        }
      },

      // Actions
      loadWatchlists: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall('/api/watchlist');
          const watchlists: Watchlist[] = response.data;

          set((state) => {
            state.watchlists = watchlists;
            state.loading = false;
            
            // Set the first watchlist as active if none is set
            if (!state.activeWatchlistId && watchlists.length > 0) {
              state.activeWatchlistId = watchlists[0].id;
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load watchlists';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          console.warn('Watchlists load failed:', errorMessage);
        }
      },

      createWatchlist: async (name: string, description?: string, isPublic: boolean = false) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // Try to call the backend first
          const response = await authenticatedApiCall('/api/watchlist', {
            method: 'POST',
            body: JSON.stringify({ name, description, is_public: isPublic }),
          });

          const newWatchlist: Watchlist = response.data;

          set((state) => {
            state.watchlists.push(newWatchlist);
            state.loading = false;
          });

          smartToast.success(`Created watchlist "${name}"`);
          return newWatchlist;
        } catch (error) {
          // Backend not available, use local storage fallback
          console.log('Backend not available, using local storage for watchlist creation');
          
          const newWatchlist: Watchlist = {
            id: `local_${Date.now()}_${Math.random()}`, // Generate local ID
            user_id: 'local',
            name,
            description: description || undefined,
            is_default: false,
            list_type: 'custom',
            sort_order: get().watchlists.length,
            is_public: isPublic,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [],
          };

          set((state) => {
            state.watchlists.push(newWatchlist);
            state.loading = false;
            state.error = null; // Clear any error since we handled it locally
          });

          smartToast.success(`Created watchlist "${name}"`);
          return newWatchlist;
        }
      },

      updateWatchlist: async (id: string, updates: Partial<Pick<Watchlist, 'name' | 'description' | 'is_public'>>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall(`/api/watchlist/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const updatedWatchlist: Watchlist = response.data;

          set((state) => {
            const index = state.watchlists.findIndex(w => w.id === id);
            if (index > -1) {
              state.watchlists[index] = { ...state.watchlists[index], ...updatedWatchlist };
            }
            state.loading = false;
          });

          smartToast.success('Watchlist updated successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update watchlist';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          smartToast.error(errorMessage);
          throw error;
        }
      },

      deleteWatchlist: async (id: string) => {
        const watchlist = get().getWatchlistById(id);
        if (!watchlist) return;

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          await authenticatedApiCall(`/api/watchlist/${id}`, {
            method: 'DELETE',
          });

          set((state) => {
            state.watchlists = state.watchlists.filter(w => w.id !== id);
            
            // If this was the active watchlist, set a new one
            if (state.activeWatchlistId === id) {
              state.activeWatchlistId = state.watchlists.length > 0 ? state.watchlists[0].id : null;
            }
            
            state.loading = false;
          });

          smartToast.success(`Deleted watchlist "${watchlist.name}"`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete watchlist';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          smartToast.error(errorMessage);
          throw error;
        }
      },

      setActiveWatchlist: (id: string | null) => {
        set((state) => {
          state.activeWatchlistId = id;
        });
      },

      // Item management
      addToWatchlist: async (watchlistId: string, item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // Try to call the backend first
          const response = await authenticatedApiCall(`/api/watchlist/${watchlistId}/items`, {
            method: 'POST',
            body: JSON.stringify(item),
          });

          const newItem: WatchlistItem = response.data;

          set((state) => {
            const watchlist = state.watchlists.find(w => w.id === watchlistId);
            if (watchlist) {
              if (!watchlist.items) watchlist.items = [];
              watchlist.items.push(newItem);
            }
            state.loading = false;
          });

          smartToast.success(`Added "${item.title}" to watchlist`);
        } catch (error) {
          // Backend not available, use local storage fallback
          console.log('Backend not available, using local storage for watchlist');
          
          const newItem: WatchlistItem = {
            ...item,
            id: `local_${Date.now()}_${Math.random()}`, // Generate local ID
            watchlist_id: watchlistId,
            added_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => {
            const watchlist = state.watchlists.find(w => w.id === watchlistId);
            if (watchlist) {
              if (!watchlist.items) watchlist.items = [];
              // Check if item already exists to prevent duplicates
              const exists = watchlist.items.some(existingItem => 
                existingItem.tmdb_id === item.tmdb_id && existingItem.media_type === item.media_type
              );
              if (!exists) {
                watchlist.items.push(newItem);
              }
            }
            state.loading = false;
            state.error = null; // Clear any error since we handled it locally
          });

          smartToast.success(`Added "${item.title}" to watchlist`);
        }
      },

      removeFromWatchlist: async (itemId: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // Try to call the backend first
          await authenticatedApiCall(`/api/watchlist/items/${itemId}`, {
            method: 'DELETE',
          });

          set((state) => {
            state.watchlists.forEach(watchlist => {
              if (watchlist.items) {
                watchlist.items = watchlist.items.filter(item => item.id !== itemId);
              }
            });
            state.loading = false;
          });

          smartToast.success('Removed from watchlist');
        } catch (error) {
          // Backend not available, use local storage fallback
          console.log('Backend not available, using local storage for watchlist removal');
          
          set((state) => {
            state.watchlists.forEach(watchlist => {
              if (watchlist.items) {
                watchlist.items = watchlist.items.filter(item => item.id !== itemId);
              }
            });
            state.loading = false;
            state.error = null; // Clear any error since we handled it locally
          });

          smartToast.success('Removed from watchlist');
        }
      },

      updateWatchlistItem: async (itemId: string, updates: Partial<Pick<WatchlistItem, 'notes' | 'is_watched' | 'watched_date'>>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await authenticatedApiCall(`/api/watchlist/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const updatedItem: WatchlistItem = response.data;

          set((state) => {
            state.watchlists.forEach(watchlist => {
              if (watchlist.items) {
                const itemIndex = watchlist.items.findIndex(item => item.id === itemId);
                if (itemIndex > -1) {
                  watchlist.items[itemIndex] = { ...watchlist.items[itemIndex], ...updatedItem };
                }
              }
            });
            state.loading = false;
          });

          smartToast.success('Item updated successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          smartToast.error(errorMessage);
          throw error;
        }
      },

      toggleWatched: async (itemId: string) => {
        const item = get().watchlists
          .flatMap(w => w.items || [])
          .find(item => item.id === itemId);
        
        if (!item) return;

        const updates = {
          is_watched: !item.is_watched,
          watched_date: !item.is_watched ? new Date().toISOString() : undefined,
        };

        await get().updateWatchlistItem(itemId, updates);
      },

      // Quick actions
      addToFavorites: async (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const favoritesWatchlist = get().getWatchlistByType('favorites');
        if (favoritesWatchlist) {
          await get().addToWatchlist(favoritesWatchlist.id, item);
          
          // Track recently added
          set((state) => {
            if (item.media_type === 'movie') {
              state.lastAddedMovie = { ...item, id: '', watchlist_id: favoritesWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            } else if (item.media_type === 'tv') {
              state.lastAddedShow = { ...item, id: '', watchlist_id: favoritesWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            }
          });
        }
      },

      addToFavorite: async (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => {
        // Alias for compatibility - calls addToFavorites
        await get().addToFavorites(item);
      },

      addToWatchLater: async (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchLaterWatchlist = get().getWatchlistByType('watch_later');
        if (watchLaterWatchlist) {
          await get().addToWatchlist(watchLaterWatchlist.id, item);
          
          // Track recently added
          set((state) => {
            if (item.media_type === 'movie') {
              state.lastAddedMovie = { ...item, id: '', watchlist_id: watchLaterWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            } else if (item.media_type === 'tv') {
              state.lastAddedShow = { ...item, id: '', watchlist_id: watchLaterWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            }
          });
        }
      },

      markAsWatched: async (item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'added_at' | 'updated_at'>) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchedWatchlist = get().getWatchlistByType('watched');
        if (watchedWatchlist) {
          await get().addToWatchlist(watchedWatchlist.id, { ...item, is_watched: true, watched_date: new Date().toISOString() });
          
          // Track recently added
          set((state) => {
            if (item.media_type === 'movie') {
              state.lastAddedMovie = { ...item, id: '', watchlist_id: watchedWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            } else if (item.media_type === 'tv') {
              state.lastAddedShow = { ...item, id: '', watchlist_id: watchedWatchlist.id, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            }
          });
        }
      },

      // Favorites management
      removeFromFavorite: async (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const favoritesWatchlist = get().getWatchlistByType('favorites');
        if (favoritesWatchlist) {
          const itemToRemove = favoritesWatchlist.items?.find(i => i.tmdb_id === tmdbId);
          if (itemToRemove) {
            await get().removeFromWatchlist(itemToRemove.id);
          }
        }
      },

      isInFavorite: (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const favoritesWatchlist = get().getWatchlistByType('favorites');
        return favoritesWatchlist?.items?.some(i => i.tmdb_id === tmdbId) || false;
      },

      // Watch Later management
      isInWatchLater: (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchLaterWatchlist = get().getWatchlistByType('watch_later');
        return watchLaterWatchlist?.items?.some(i => i.tmdb_id === tmdbId) || false;
      },

      removeFromWatchLater: async (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchLaterWatchlist = get().getWatchlistByType('watch_later');
        if (watchLaterWatchlist) {
          const itemToRemove = watchLaterWatchlist.items?.find(i => i.tmdb_id === tmdbId);
          if (itemToRemove) {
            await get().removeFromWatchlist(itemToRemove.id);
          }
        }
      },

      // Watched management
      isInWatched: (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchedWatchlist = get().getWatchlistByType('watched');
        return watchedWatchlist?.items?.some(i => i.tmdb_id === tmdbId) || false;
      },

      removeFromWatched: async (tmdbId: number) => {
        // Ensure default watchlists exist first
        get().ensureDefaultWatchlists();
        
        const watchedWatchlist = get().getWatchlistByType('watched');
        if (watchedWatchlist) {
          const itemToRemove = watchedWatchlist.items?.find(i => i.tmdb_id === tmdbId);
          if (itemToRemove) {
            await get().removeFromWatchlist(itemToRemove.id);
          }
        }
      },

      // Hidden items management
      addToHidden: (tmdbId: number) => {
        set((state) => {
          if (!state.hiddenItems.includes(tmdbId)) {
            state.hiddenItems.push(tmdbId);
          }
        });
      },

      removeFromHidden: (tmdbId: number) => {
        set((state) => {
          state.hiddenItems = state.hiddenItems.filter(id => id !== tmdbId);
        });
      },

      isInHidden: (tmdbId: number) => {
        return get().hiddenItems.includes(tmdbId);
      },

      // Utility functions
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      getWatchlistById: (id: string): Watchlist | undefined => {
        return get().watchlists.find(w => w.id === id);
      },

      getWatchlistByType: (type: Watchlist['list_type']): Watchlist | undefined => {
        return get().watchlists.find(w => w.list_type === type);
      },

      isItemInWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv', watchlistId?: string): boolean => {
        const { watchlists } = get();
        const targetWatchlists = watchlistId 
          ? watchlists.filter(w => w.id === watchlistId)
          : watchlists;

        return targetWatchlists.some(watchlist => 
          watchlist.items?.some(item => 
            item.tmdb_id === tmdbId && item.media_type === mediaType
          )
        );
      },

      getItemFromWatchlists: (tmdbId: number, mediaType: 'movie' | 'tv'): WatchlistItem | undefined => {
        const { watchlists } = get();
        for (const watchlist of watchlists) {
          if (watchlist.items) {
            const item = watchlist.items.find(item => 
              item.tmdb_id === tmdbId && item.media_type === mediaType
            );
            if (item) return item;
          }
        }
        return undefined;
      },
    })),
    {
      name: 'watchlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeWatchlistId: state.activeWatchlistId,
        lastAddedMovie: state.lastAddedMovie,
        lastAddedShow: state.lastAddedShow,
        hiddenItems: state.hiddenItems, // Already an array, no conversion needed
        // Don't persist watchlists as they should be loaded fresh from API
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as any;
        return {
          ...currentState,
          ...persisted,
          hiddenItems: persisted?.hiddenItems || [], // Already an array, no conversion needed
        };
      },
    }
  )
);

// Helper hooks
export const useActiveWatchlist = () => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  return watchlists.find(w => w.id === activeWatchlistId);
};

export const useWatchlistItems = (watchlistId?: string) => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  const targetId = watchlistId || activeWatchlistId;
  const watchlist = watchlists.find(w => w.id === targetId);
  return watchlist?.items || [];
};

export const useDefaultWatchlists = () => {
  const { watchlists, addToFavorites, addToWatchLater, markAsWatched } = useWatchlistStore();
  
  return {
    favorites: watchlists.find(w => w.list_type === 'favorites'),
    watchLater: watchlists.find(w => w.list_type === 'watch_later'),
    watched: watchlists.find(w => w.list_type === 'watched'),
    addToFavorites,
    addToWatchLater,
    markAsWatched,
  };
};

// Main watchlist hook
export const useWatchlist = () => {
  const store = useWatchlistStore();
  return {
    ...store,
    // Computed properties
    isLoading: store.loading,
    hasError: !!store.error,
    hasWatchlists: store.watchlists.length > 0,
    activeWatchlist: store.watchlists.find(w => w.id === store.activeWatchlistId),
  };
}; 