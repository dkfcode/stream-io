import React from 'react';
import { 
  getTrending, 
  searchContent, 
  getStreamingServices, 
  getVideos,
  getSimilarContent 
} from './tmdb';
import { performanceOptimizer } from './performanceOptimizer';
import { handleAsyncError } from './errorHandler';
import type { SearchResult, StreamingService } from '../types/tmdb';

// Optimized TMDB service with request deduplication and batching
class OptimizedTmdbService {
  private readonly CACHE_TTL = {
    trending: 15 * 60 * 1000,     // 15 minutes
    search: 10 * 60 * 1000,       // 10 minutes
    streaming: 60 * 60 * 1000,    // 1 hour
    videos: 30 * 60 * 1000,       // 30 minutes
    similar: 30 * 60 * 1000,      // 30 minutes
  };

  // Optimized trending content with deduplication
  async getTrendingOptimized(mediaType: 'movie' | 'tv' = 'movie'): Promise<SearchResult[]> {
    const key = `trending-${mediaType}`;
    
    return performanceOptimizer.deduplicateRequest(
      key,
      () => getTrending(mediaType),
      this.CACHE_TTL.trending
    );
  }

  // Optimized search with debounced requests
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private searchTimeouts = new Map<string, number>();

  async searchOptimized(query: string, debounceMs: number = 300): Promise<SearchResult[]> {
    // Return cached results if available and fresh
    const cached = this.searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.search) {
      return cached.results;
    }

    // Clear existing timeout for this query
    const existingTimeout = this.searchTimeouts.get(query);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(async () => {
        try {
          const key = `search-${query}`;
          const results = await performanceOptimizer.deduplicateRequest(
            key,
            () => searchContent(query),
            this.CACHE_TTL.search
          );

          // Cache the results
          this.searchCache.set(query, {
            results,
            timestamp: Date.now()
          });

          this.searchTimeouts.delete(query);
          resolve(results);
        } catch (error) {
          this.searchTimeouts.delete(query);
          reject(error);
        }
      }, debounceMs);

      this.searchTimeouts.set(query, timeout);
    });
  }

  // Batch streaming services requests
  async getStreamingServicesBatch(items: Array<{ id: number; mediaType: 'movie' | 'tv' }>): Promise<Record<number, StreamingService[]>> {
    // Group items by media type for more efficient API usage
    const movieItems = items.filter(item => item.mediaType === 'movie');
    const tvItems = items.filter(item => item.mediaType === 'tv');

    const results: Record<number, StreamingService[]> = {};

    // Process movies and TV shows in parallel
    const [movieResults, tvResults] = await Promise.allSettled([
      this.processStreamingBatch(movieItems, 'movie'),
      this.processStreamingBatch(tvItems, 'tv')
    ]);

    // Merge results
    if (movieResults.status === 'fulfilled') {
      Object.assign(results, movieResults.value);
    }
    if (tvResults.status === 'fulfilled') {
      Object.assign(results, tvResults.value);
    }

    return results;
  }

  private async processStreamingBatch(
    items: Array<{ id: number; mediaType: 'movie' | 'tv' }>, 
    mediaType: 'movie' | 'tv'
  ): Promise<Record<number, StreamingService[]>> {
    const results: Record<number, StreamingService[]> = {};
    
    // Limit concurrent requests to prevent rate limiting
    const chunkSize = 5;
    const chunks = this.chunkArray(items, chunkSize);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item) => {
        const key = `streaming-${item.id}-${item.mediaType}`;
        try {
          const services = await performanceOptimizer.deduplicateRequest(
            key,
            () => getStreamingServices(item.id, item.mediaType),
            this.CACHE_TTL.streaming
          );
          return { id: item.id, services };
        } catch (error) {
          handleAsyncError(error as Error, {
            operation: 'getStreamingServicesBatch',
            itemId: item.id,
            mediaType: item.mediaType
          });
          return { id: item.id, services: [] };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results[result.value.id] = result.value.services;
        }
      });

      // Small delay between chunks to be respectful to the API
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(100);
      }
    }

    return results;
  }

  // Optimized video/trailer fetching with intelligent prioritization
  async getVideosOptimized(contentId: number, mediaType: 'movie' | 'tv'): Promise<any[]> {
    const key = `videos-${contentId}-${mediaType}`;
    
    return performanceOptimizer.deduplicateRequest(
      key,
      () => getVideos(contentId, mediaType),
      this.CACHE_TTL.videos
    );
  }

  // Batch video requests for multiple items
  async getVideosBatch(items: Array<{ id: number; mediaType: 'movie' | 'tv' }>): Promise<Record<number, any[]>> {
    const results: Record<number, any[]> = {};
    
    // Process in smaller batches to avoid overwhelming the API
    const chunkSize = 3; // Smaller chunks for video requests as they're heavier
    const chunks = this.chunkArray(items, chunkSize);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item) => {
        try {
          const videos = await this.getVideosOptimized(item.id, item.mediaType);
          return { id: item.id, videos };
        } catch (error) {
          handleAsyncError(error as Error, {
            operation: 'getVideosBatch',
            itemId: item.id,
            mediaType: item.mediaType
          });
          return { id: item.id, videos: [] };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results[result.value.id] = result.value.videos;
        }
      });

      // Longer delay for video requests
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(200);
      }
    }

    return results;
  }

  // Optimized similar content with deduplication
  async getSimilarContentOptimized(item: SearchResult): Promise<SearchResult[]> {
    const key = `similar-${item.id}-${item.media_type}`;
    
    return performanceOptimizer.deduplicateRequest(
      key,
      () => getSimilarContent(item),
      this.CACHE_TTL.similar
    );
  }

  // Preload critical content data
  async preloadCriticalData(items: SearchResult[], maxItems: number = 10): Promise<void> {
    const priorityItems = items.slice(0, maxItems);
    
    // Preload streaming services for visible items
    const streamingItems = priorityItems.map(item => ({
      id: item.id,
      mediaType: item.media_type as 'movie' | 'tv'
    }));

    try {
      await this.getStreamingServicesBatch(streamingItems);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'preloadCriticalData',
        itemCount: streamingItems.length
      });
    }
  }

  // Intelligent cache warming for better UX
  async warmCache(contentTypes: Array<'trending-movie' | 'trending-tv'> = ['trending-movie', 'trending-tv']): Promise<void> {
    try {
      const promises = contentTypes.map(async (type) => {
        const [, mediaType] = type.split('-') as [string, 'movie' | 'tv'];
        await this.getTrendingOptimized(mediaType);
      });

      await Promise.allSettled(promises);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'warmCache',
        contentTypes
      });
    }
  }

  // Utility methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear all caches
  clearAllCaches(): void {
    this.searchCache.clear();
    this.searchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.searchTimeouts.clear();
    performanceOptimizer.clearCache();
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      searchCacheSize: this.searchCache.size,
      activeSearchTimeouts: this.searchTimeouts.size,
      ...performanceOptimizer.getCacheStats()
    };
  }
}

// Export singleton instance
export const optimizedTmdbService = new OptimizedTmdbService();

// React hook for using optimized TMDB service
export const useOptimizedTmdb = () => {
  const [stats, setStats] = React.useState(optimizedTmdbService.getPerformanceStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(optimizedTmdbService.getPerformanceStats());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    service: optimizedTmdbService,
    performanceStats: stats,
    clearCaches: () => optimizedTmdbService.clearAllCaches(),
    warmCache: optimizedTmdbService.warmCache.bind(optimizedTmdbService),
    preloadCriticalData: optimizedTmdbService.preloadCriticalData.bind(optimizedTmdbService)
  };
}; 