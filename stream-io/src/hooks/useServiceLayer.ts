import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getTrending, 
  searchContent, 
  getStreamingServices, 
  getVideos,
  getSimilarContent
} from '../services/tmdb';
import { performAISearch } from '../services/aiSearchService';
import { handleAsyncError } from '../services/errorHandler';
import type { SearchResult, StreamingService } from '../types/tmdb';

// Content fetching service hook
export const useContentService = () => {
  const queryClient = useQueryClient();

  // Trending content queries
  const useTrendingContent = (mediaType: 'movie' | 'tv' = 'movie') => {
    return useQuery({
      queryKey: ['trending', mediaType],
      queryFn: () => getTrending(mediaType),
      staleTime: 1000 * 60 * 15, // 15 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    });
  };

  // Search functionality
  const useSearch = () => {
    return useMutation({
      mutationFn: (query: string) => searchContent(query),
      onError: (error, variables) => {
        handleAsyncError(error as Error, {
          operation: 'search',
          query: variables
        });
      }
    });
  };

  // AI Search functionality
  const useAISearch = () => {
    return useMutation({
      mutationFn: ({ query, tab }: { query: string; tab: string }) => 
        performAISearch(query, tab),
      onError: (error, variables) => {
        handleAsyncError(error as Error, {
          operation: 'aiSearch',
          query: variables.query
        });
      }
    });
  };

  // Streaming services for content
  const useStreamingServices = (contentId: number, mediaType: 'movie' | 'tv') => {
    return useQuery({
      queryKey: ['streaming', contentId, mediaType],
      queryFn: () => getStreamingServices(contentId, mediaType),
      enabled: !!contentId,
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
    });
  };

  // Videos/trailers for content
  const useContentVideos = (contentId: number, mediaType: 'movie' | 'tv') => {
    return useQuery({
      queryKey: ['videos', contentId, mediaType],
      queryFn: () => getVideos(contentId, mediaType),
      enabled: !!contentId,
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
    });
  };

  // Similar content
  const useSimilarContent = (contentId: number, mediaType: 'movie' | 'tv') => {
    return useQuery({
      queryKey: ['similar', contentId, mediaType],
      queryFn: () => getSimilarContent({ id: contentId, media_type: mediaType } as SearchResult),
      enabled: !!contentId,
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
    });
  };

  // Batch streaming services fetch
  const useBatchStreamingServices = () => {
    return useMutation({
      mutationFn: async (items: Array<{ id: number; mediaType: 'movie' | 'tv' }>) => {
        const results = await Promise.allSettled(
          items.map(item => getStreamingServices(item.id, item.mediaType))
        );
        
        const streamingData: Record<number, StreamingService[]> = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            streamingData[items[index].id] = result.value;
          } else {
            streamingData[items[index].id] = [];
          }
        });
        
        return streamingData;
      },
      onError: (error) => {
        handleAsyncError(error as Error, {
          operation: 'batchStreamingServices'
        });
      }
    });
  };

  // Cache management utilities
  const invalidateContentCache = useCallback((contentId?: number, mediaType?: 'movie' | 'tv') => {
    if (contentId && mediaType) {
      queryClient.invalidateQueries({ queryKey: ['streaming', contentId, mediaType] });
      queryClient.invalidateQueries({ queryKey: ['videos', contentId, mediaType] });
      queryClient.invalidateQueries({ queryKey: ['similar', contentId, mediaType] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    }
  }, [queryClient]);

  const prefetchContent = useCallback(async (contentId: number, mediaType: 'movie' | 'tv') => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['streaming', contentId, mediaType],
        queryFn: () => getStreamingServices(contentId, mediaType),
        staleTime: 1000 * 60 * 60,
      }),
      queryClient.prefetchQuery({
        queryKey: ['videos', contentId, mediaType],
        queryFn: () => getVideos(contentId, mediaType),
        staleTime: 1000 * 60 * 30,
      })
    ]);
  }, [queryClient]);

  return {
    // Query hooks
    useTrendingContent,
    useSearch,
    useAISearch,
    useStreamingServices,
    useContentVideos,
    useSimilarContent,
    useBatchStreamingServices,
    
    // Cache management
    invalidateContentCache,
    prefetchContent
  };
};

// Combined content filtering and processing hook
export const useContentProcessor = () => {
  const processContentByFilter = useCallback((
    content: SearchResult[], 
    filter: 'all' | 'movie' | 'tv',
    excludeHidden: (id: number) => boolean = () => false
  ) => {
    let filteredContent = [...content];
    
    // Remove duplicates by ID
    const uniqueContent = Array.from(
      new Map(filteredContent.map(item => [item.id, item])).values()
    );
    filteredContent = uniqueContent;
    
    // Apply media type filter
    if (filter !== 'all') {
      filteredContent = filteredContent.filter(item => item.media_type === filter);
    }
    
    // Filter out hidden items
    filteredContent = filteredContent.filter(item => !excludeHidden(item.id));
    
    return filteredContent;
  }, []);

  const sortContentByRelevance = useCallback((
    content: SearchResult[],
    selectedGenres: string[] = [],
    moodQuery: string = ''
  ) => {
    const genreWeighted = content.map(item => {
      const matchingGenres = item.genre_ids?.filter(genreId => 
        selectedGenres.some(selectedGenre => Number(selectedGenre) === genreId)
      ).length || 0;
      
      // Simple mood-based filtering
      let moodBoost = 0;
      if (moodQuery) {
        const queryLower = moodQuery.toLowerCase();
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        
        if (title.includes(queryLower) || overview.includes(queryLower)) {
          moodBoost = 3;
        }
        
        // Basic mood keywords
        if (queryLower.includes('action') && item.genre_ids?.includes(28)) moodBoost += 2;
        if (queryLower.includes('comedy') && item.genre_ids?.includes(35)) moodBoost += 2;
        if (queryLower.includes('romance') && item.genre_ids?.includes(10749)) moodBoost += 2;
        if (queryLower.includes('horror') && item.genre_ids?.includes(27)) moodBoost += 2;
        if (queryLower.includes('drama') && item.genre_ids?.includes(18)) moodBoost += 2;
      }
      
      return {
        ...item,
        relevanceScore: (item.vote_average || 0) * 0.4 + 
                       (item.popularity || 0) * 0.001 + 
                       matchingGenres * 2 + 
                       moodBoost
      };
    });
    
    return genreWeighted.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, []);

  return {
    processContentByFilter,
    sortContentByRelevance
  };
}; 