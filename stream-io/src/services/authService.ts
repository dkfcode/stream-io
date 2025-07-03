import { TV_PROVIDERS } from '../data/tvProviders';

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export class TVProviderAuthService {
  private static instance: TVProviderAuthService;
  private authWindows: Map<string, Window | null> = new Map();

  static getInstance(): TVProviderAuthService {
    if (!TVProviderAuthService.instance) {
      TVProviderAuthService.instance = new TVProviderAuthService();
    }
    return TVProviderAuthService.instance;
  }

  async authenticateProvider(providerId: string): Promise<AuthResult> {
    const provider = TV_PROVIDERS.find(p => p.id === providerId);
    
    if (!provider) {
      return {
        success: false,
        error: 'Provider not found'
      };
    }

    try {
      // Check if URL is accessible
      const isValidUrl = await this.validateUrl(provider.authUrl);
      
      if (!isValidUrl) {
        return {
          success: false,
          error: 'Provider authentication service is currently unavailable'
        };
      }

      // Open authentication window
      const authWindow = window.open(
        provider.authUrl,
        `${providerId}_auth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        return {
          success: false,
          error: 'Popup blocked. Please allow popups for this site.'
        };
      }

      this.authWindows.set(providerId, authWindow);

      // Monitor the auth window
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            this.authWindows.delete(providerId);
            resolve({
              success: true,
              redirectUrl: provider.streamBaseUrl
            });
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!authWindow.closed) {
            authWindow.close();
          }
          this.authWindows.delete(providerId);
          resolve({
            success: false,
            error: 'Authentication timeout'
          });
        }, 300000);
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async validateUrl(url: string): Promise<boolean> {
    try {
      // Use a simple fetch with no-cors mode to check if URL exists
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // If fetch fails, assume URL is valid (due to CORS restrictions)
      // In production, this would be handled by a backend service
      return true;
    }
  }

  getStreamUrl(providerId: string, eventId?: string): string {
    const provider = TV_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return '';
    
    return eventId 
      ? `${provider.streamBaseUrl}/${eventId}`
      : provider.streamBaseUrl;
  }

  closeAuthWindow(providerId: string): void {
    const authWindow = this.authWindows.get(providerId);
    if (authWindow && !authWindow.closed) {
      authWindow.close();
    }
    this.authWindows.delete(providerId);
  }

  closeAllAuthWindows(): void {
    this.authWindows.forEach((window, providerId) => {
      if (window && !window.closed) {
        window.close();
      }
    });
    this.authWindows.clear();
  }
}

export const authService = TVProviderAuthService.getInstance();

// OAuth functions disabled - using Express.js JWT authentication instead
// If OAuth is needed in the future, implement with backend endpoints

export const signInWithOAuth = async () => {
  throw new Error('OAuth not implemented - use email/password authentication');
};

export const handleOAuthCallback = async () => {
  throw new Error('OAuth callback not implemented');
};

