import React from 'react';
import type { SearchResult, StreamingService } from '../types/tmdb';

// Request deduplication and batching service
class PerformanceOptimizer {
  private pendingRequests = new Map<string, Promise<any>>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue: Array<{ key: string; request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private batchTimeout: number | null = null;
  private readonly BATCH_DELAY = 100; // 100ms batching window
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Deduplicate identical requests
  async deduplicateRequest<T>(key: string, request: () => Promise<T>, ttl: number = this.DEFAULT_TTL): Promise<T> {
    // Check cache first
    const cached = this.getCached<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = request()
      .then((result) => {
        this.setCache(key, result, ttl);
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Batch multiple requests to execute together
  async batchRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({ key, request, resolve, reject });
      
      if (this.batchTimeout === null) {
        this.batchTimeout = window.setTimeout(() => {
          this.executeBatch();
        }, this.BATCH_DELAY);
      }
    });
  }

  private async executeBatch() {
    const currentBatch = [...this.requestQueue];
    this.requestQueue.length = 0;
    this.batchTimeout = null;

    // Group by similar request types for optimal batching
    const batches = this.groupRequestsByType(currentBatch);
    
    for (const batch of batches) {
      try {
        // Execute all requests in parallel within each batch
        const results = await Promise.allSettled(
          batch.map(item => item.request())
        );

        // Resolve/reject individual promises
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            batch[index].resolve(result.value);
          } else {
            batch[index].reject(result.reason);
          }
        });
      } catch (error) {
        // Reject all requests in this batch
        batch.forEach(item => item.reject(error));
      }
    }
  }

  private groupRequestsByType(requests: Array<{ key: string; request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }>) {
    const groups = new Map<string, typeof requests>();
    
    for (const request of requests) {
      const type = this.getRequestType(request.key);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(request);
    }
    
    return Array.from(groups.values());
  }

  private getRequestType(key: string): string {
    if (key.includes('streaming')) return 'streaming';
    if (key.includes('videos')) return 'videos';
    if (key.includes('trending')) return 'trending';
    if (key.includes('search')) return 'search';
    return 'other';
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all caches
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    const valid = Array.from(this.cache.values()).filter(
      item => now <= item.timestamp + item.ttl
    ).length;
    
    return {
      totalEntries: this.cache.size,
      validEntries: valid,
      expiredEntries: this.cache.size - valid,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Image optimization utilities
export const imageOptimizer = {
  // Generate optimized image URLs with proper sizing
  getOptimizedImageUrl(
    originalUrl: string, 
    width: number, 
    height?: number,
    quality: number = 80
  ): string {
    if (!originalUrl) return '';
    
    // For TMDB images, use their built-in sizing
    if (originalUrl.includes('image.tmdb.org')) {
      const sizeMap = this.getTMDBSize(width);
      return originalUrl.replace(/\/w\d+/, `/${sizeMap}`);
    }
    
    // For other images, return original (could integrate with image CDN here)
    return originalUrl;
  },

  // Get appropriate TMDB image size based on display width
  getTMDBSize(width: number): string {
    if (width <= 92) return 'w92';
    if (width <= 154) return 'w154';
    if (width <= 185) return 'w185';
    if (width <= 342) return 'w342';
    if (width <= 500) return 'w500';
    if (width <= 780) return 'w780';
    return 'w1280';
  },

  // Preload critical images
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  },

  // Batch preload multiple images
  async preloadImages(urls: string[], maxConcurrent: number = 5): Promise<void> {
    const chunks = this.chunkArray(urls, maxConcurrent);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.preloadImage(url))
      );
    }
  },

  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

// Lazy loading utilities
export const lazyLoader = {
  // Create intersection observer for lazy loading
  createObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  },

  // Lazy load component with loading state
  createLazyComponent<T>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    fallback?: React.ComponentType
  ) {
    return React.lazy(importFn);
  }
};

// API call optimization utilities
export const apiOptimizer = {
  // Throttle API calls to prevent rate limiting
  throttle<T extends (...args: any[]) => Promise<any>>(
    func: T,
    limit: number = 10,
    interval: number = 1000
  ): T {
    let calls = 0;
    let resetTime = Date.now() + interval;

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now > resetTime) {
        calls = 0;
        resetTime = now + interval;
      }
      
      if (calls >= limit) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      
      calls++;
      return func(...args);
    }) as T;
  },

  // Debounce search requests
  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      
      timeout = window.setTimeout(() => {
        func(...args);
      }, wait);
    };
  }
};

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [stats, setStats] = React.useState(performanceOptimizer.getCacheStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceOptimizer.getCacheStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    cacheStats: stats,
    clearCache: () => performanceOptimizer.clearCache(),
  };
}; 