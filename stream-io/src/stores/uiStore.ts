import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for modals
interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: any;
}

// Types for section expansion
interface SectionExpansion {
  [sectionId: string]: boolean;
}

// Types for trailer modal
interface TrailerState {
  isOpen: boolean;
  trailerKey: string | null;
  title: string | null;
  mediaType: 'movie' | 'tv' | null;
}

// Types for theme
type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Modal management
  modal: ModalState;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  
  // Section expansion state
  sectionExpansion: SectionExpansion;
  toggleSection: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
  collapseSection: (sectionId: string) => void;
  isSectionExpanded: (sectionId: string) => boolean;
  
  // Trailer modal
  trailer: TrailerState;
  openTrailer: (trailerKey: string, title: string, mediaType: 'movie' | 'tv') => void;
  closeTrailer: () => void;
  
  // Theme management (UI-level)
  theme: Theme;
  systemTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  getEffectiveTheme: () => 'light' | 'dark';
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Sidebar/Navigation state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Mobile responsive state
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Modal state
      modal: {
        isOpen: false,
        type: null,
        data: null,
      },
      
      openModal: (type: string, data: any = null) => {
        set((state) => {
          state.modal = {
            isOpen: true,
            type,
            data,
          };
        });
      },
      
      closeModal: () => {
        set((state) => {
          state.modal = {
            isOpen: false,
            type: null,
            data: null,
          };
        });
      },
      
      // Section expansion
      sectionExpansion: {},
      
      toggleSection: (sectionId: string) => {
        set((state) => {
          state.sectionExpansion[sectionId] = !state.sectionExpansion[sectionId];
        });
      },
      
      expandSection: (sectionId: string) => {
        set((state) => {
          state.sectionExpansion[sectionId] = true;
        });
      },
      
      collapseSection: (sectionId: string) => {
        set((state) => {
          state.sectionExpansion[sectionId] = false;
        });
      },
      
      isSectionExpanded: (sectionId: string): boolean => {
        return get().sectionExpansion[sectionId] || false;
      },
      
      // Trailer state
      trailer: {
        isOpen: false,
        trailerKey: null,
        title: null,
        mediaType: null,
      },
      
      openTrailer: (trailerKey: string, title: string, mediaType: 'movie' | 'tv') => {
        set((state) => {
          state.trailer = {
            isOpen: true,
            trailerKey,
            title,
            mediaType,
          };
        });
      },
      
      closeTrailer: () => {
        set((state) => {
          state.trailer = {
            isOpen: false,
            trailerKey: null,
            title: null,
            mediaType: null,
          };
        });
      },
      
      // Theme management
      theme: 'dark',
      systemTheme: 'dark',
      
      setTheme: (theme: Theme) => {
        set((state) => {
          state.theme = theme;
        });
      },
      
      setSystemTheme: (theme: 'light' | 'dark') => {
        set((state) => {
          state.systemTheme = theme;
        });
      },
      
      getEffectiveTheme: (): 'light' | 'dark' => {
        const { theme, systemTheme } = get();
        return theme === 'system' ? systemTheme : theme;
      },
      
      // Search state
      searchQuery: '',
      
      setSearchQuery: (query: string) => {
        set((state) => {
          state.searchQuery = query;
        });
      },
      
      clearSearch: () => {
        set((state) => {
          state.searchQuery = '';
        });
      },
      
      // Global loading
      globalLoading: false,
      
      setGlobalLoading: (loading: boolean) => {
        set((state) => {
          state.globalLoading = loading;
        });
      },
      
      // Sidebar state
      sidebarOpen: false,
      
      setSidebarOpen: (open: boolean) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },
      
      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },
      
      // Mobile state
      isMobile: false,
      
      setIsMobile: (mobile: boolean) => {
        set((state) => {
          state.isMobile = mobile;
        });
      },
    })),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sectionExpansion: state.sectionExpansion,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Helper hooks for specific UI components
export const useModal = () => {
  const { modal, openModal, closeModal } = useUIStore();
  return {
    ...modal,
    openModal,
    closeModal,
    isModalOpen: (type?: string) => modal.isOpen && (type ? modal.type === type : true),
  };
};

export const useTrailer = () => {
  const { trailer, openTrailer, closeTrailer } = useUIStore();
  return {
    ...trailer,
    openTrailer,
    closeTrailer,
  };
};

export const useTheme = () => {
  const { theme, systemTheme, setTheme, setSystemTheme, getEffectiveTheme } = useUIStore();
  
  // Simplified themeSettings for backward compatibility
  // Components that need actual preferences should use usePreferences() directly
  const themeSettings = {
    autoplayVideos: true, // Default value
    language: 'en',
    region: 'US',
    preferredAudioLanguage: 'en',
    preferredSubtitles: 'off',
    interfaceDensity: 'standard' as const,
  };
  
  return {
    theme,
    systemTheme,
    setTheme,
    setSystemTheme,
    getEffectiveTheme,
    effectiveTheme: getEffectiveTheme(),
    isDark: getEffectiveTheme() === 'dark',
    isLight: getEffectiveTheme() === 'light',
    // Backward compatibility with default values
    themeSettings,
  };
};

export const useSearch = () => {
  const { searchQuery, setSearchQuery, clearSearch } = useUIStore();
  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    hasSearchQuery: searchQuery.trim().length > 0,
  };
};

export const useGlobalLoading = () => {
  const { globalLoading, setGlobalLoading } = useUIStore();
  return {
    globalLoading,
    setGlobalLoading,
    isLoading: globalLoading,
  };
};

export const useSidebar = () => {
  const { sidebarOpen, setSidebarOpen, toggleSidebar, isMobile } = useUIStore();
  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
    // Computed properties
    shouldShowSidebar: !isMobile || sidebarOpen,
  };
};

export const useSectionExpansion = () => {
  const { sectionExpansion, toggleSection, expandSection, collapseSection, isSectionExpanded } = useUIStore();
  return {
    sectionExpansion,
    toggleSection,
    expandSection,
    collapseSection,
    isSectionExpanded,
  };
};

// Main UI hook
export const useUI = () => {
  const store = useUIStore();
  return {
    ...store,
    // Computed properties
    hasActiveModal: store.modal.isOpen,
    hasActiveTrailer: store.trailer.isOpen,
    hasSearchQuery: store.searchQuery.trim().length > 0,
    effectiveTheme: store.getEffectiveTheme(),
  };
}; 