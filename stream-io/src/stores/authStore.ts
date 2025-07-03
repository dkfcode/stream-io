import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { smartToast } from '../utils/toastUtils';

// Types for our new backend API
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthError {
  message: string;
  code?: string;
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Future OAuth methods (placeholder)
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      // Actions
      signIn: async (email: string, password: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          const authData: AuthResponse = response.data;

          set((state) => {
            state.user = authData.user;
            state.accessToken = authData.access_token;
            state.refreshToken = authData.refresh_token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
          });

          smartToast.success('Successfully signed in!');
        } catch (error) {
          const authError: AuthError = {
            message: error instanceof Error ? error.message : 'Sign in failed',
          };

          set((state) => {
            state.loading = false;
            state.error = authError;
          });

          smartToast.error(authError.message);
          throw error;
        }
      },

      signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await apiCall('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ 
              email, 
              password, 
              first_name: firstName,
              last_name: lastName 
            }),
          });

          const authData: AuthResponse = response.data;

          set((state) => {
            state.user = authData.user;
            state.accessToken = authData.access_token;
            state.refreshToken = authData.refresh_token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
          });

          smartToast.success('Account created successfully!');
        } catch (error) {
          const authError: AuthError = {
            message: error instanceof Error ? error.message : 'Sign up failed',
          };

          set((state) => {
            state.loading = false;
            state.error = authError;
          });

          smartToast.error(authError.message);
          throw error;
        }
      },

      signOut: async () => {
        set((state) => {
          state.loading = true;
        });

        try {
          const { refreshToken } = get();
          
          if (refreshToken) {
            await apiCall('/api/auth/logout', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
          }

          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
          });

          smartToast.success('Signed out successfully');
        } catch (error) {
          // Even if logout API fails, clear local state
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.loading = false;
          });

          console.warn('Logout API failed, but local state cleared:', error);
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await apiCall('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          const authData: AuthResponse = response.data;

          set((state) => {
            state.user = authData.user;
            state.accessToken = authData.access_token;
            state.refreshToken = authData.refresh_token;
            state.isAuthenticated = true;
          });
        } catch (error) {
          // If refresh fails, clear auth state
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          });

          throw error;
        }
      },

      updatePassword: async (newPassword: string) => {
        // TODO: Implement when backend endpoint is ready
        throw new Error('Password update not yet implemented');
      },

      sendVerificationEmail: async (email: string) => {
        try {
          await apiCall('/api/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });

          smartToast.success('Verification email sent!');
        } catch (error) {
          const authError: AuthError = {
            message: error instanceof Error ? error.message : 'Failed to send verification email',
          };

          smartToast.error(authError.message);
          throw error;
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.loading = loading;
        });
      },

      // OAuth methods (placeholders for future implementation)
      signInWithGoogle: async () => {
        throw new Error('Google OAuth not yet implemented');
      },

      signInWithApple: async () => {
        throw new Error('Apple OAuth not yet implemented');
      },

      signInWithFacebook: async () => {
        throw new Error('Facebook OAuth not yet implemented');
      },

      signInWithMicrosoft: async () => {
        throw new Error('Microsoft OAuth not yet implemented');
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hook for easy access to auth state
export const useAuth = () => {
  const auth = useAuthStore();
  return {
    ...auth,
    // Computed properties
    isLoading: auth.loading,
    hasError: !!auth.error,
  };
};

// API request helper with automatic token refresh
export const authenticatedApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { accessToken, refreshTokens } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    return await apiCall(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  } catch (error) {
    // If we get a 401, try to refresh tokens and retry once
    if (error instanceof Error && error.message.includes('401')) {
      try {
        await refreshTokens();
        const { accessToken: newToken } = useAuthStore.getState();
        
        return await apiCall(endpoint, {
          ...options,
          headers: {
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      } catch (refreshError) {
        // If refresh fails, sign out user
        useAuthStore.getState().signOut();
        throw refreshError;
      }
    }
    
    throw error;
  }
}; 