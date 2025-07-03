import { searchContent, searchContentEnhanced, getContentByPerson, getGenreContent } from './tmdb';
import type { SearchResult } from '../types/tmdb';
import { handleAsyncError } from './errorHandler';
import { geminiService, type GeminiSearchRequest, type GeminiSearchResponse } from './geminiService';
import { usePreferencesStore } from '../stores/preferencesStore';

export interface AISearchResult {
  query: string;
  interpretation: string;
  results: SearchResult[];
  searchStrategy: string;
  confidence: number;
  aiPowered: boolean;
  fallbackUsed?: boolean;
  processingTime?: number;
}

// Keywords and patterns for parsing queries
const QUERY_PATTERNS = {
  actors: /(?:with|starring|featuring|actor|actress)\s+([^,]+)/gi,
  genres: /(?:action|comedy|drama|horror|thriller|romance|sci-fi|science fiction|fantasy|adventure|crime|mystery|documentary|animation|family|war|western|musical|history|biographical|sports)/gi,
  media_types: /(?:movie|film|tv show|series|television|documentary|anime)/gi,
  decades: /(?:1990s|90s|2000s|2010s|2020s|recent|new|old|classic)/gi,
  descriptors: /(?:police|cop|detective|lawyer|doctor|teacher|superhero|zombie|vampire|robot|alien|spy|soldier|pilot|chef|musician)/gi,
  emotions: /(?:funny|hilarious|comedy|comedic|humorous|amusing|witty|laugh|jokes|scary|terrifying|horror|frightening|spooky|creepy|sad|depressing|tearjerker|emotional|romantic|love|romance|exciting|thrilling|intense|action-packed|heartwarming|inspiring|uplifting|motivational|dark|gritty|serious|dramatic)/gi,
  platforms: /(?:netflix|hulu|disney|prime|amazon|hbo|max|apple tv|paramount|peacock)/gi,
  relationships: /(?:father|mother|son|daughter|brother|sister|family|friends|couple|marriage|divorce)/gi,
  vague_terms: /(?:something|anything|some|any|good|great|best|top|popular|trending|recommend|suggestion)/gi
};

// Enhanced emotion-to-genre mapping for semantic understanding
const EMOTION_TO_GENRE: Record<string, { genre: string; weight: number }> = {
  // Comedy mappings
  'funny': { genre: 'comedy', weight: 1.0 },
  'hilarious': { genre: 'comedy', weight: 1.0 },
  'comedy': { genre: 'comedy', weight: 1.0 },
  'comedic': { genre: 'comedy', weight: 1.0 },
  'humorous': { genre: 'comedy', weight: 1.0 },
  'amusing': { genre: 'comedy', weight: 1.0 },
  'witty': { genre: 'comedy', weight: 1.0 },
  'laugh': { genre: 'comedy', weight: 1.0 },
  'jokes': { genre: 'comedy', weight: 1.0 },
  
  // Horror mappings
  'scary': { genre: 'horror', weight: 1.0 },
  'terrifying': { genre: 'horror', weight: 1.0 },
  'horror': { genre: 'horror', weight: 1.0 },
  'frightening': { genre: 'horror', weight: 1.0 },
  'spooky': { genre: 'horror', weight: 1.0 },
  'creepy': { genre: 'horror', weight: 1.0 },
  
  // Drama mappings
  'sad': { genre: 'drama', weight: 1.0 },
  'depressing': { genre: 'drama', weight: 1.0 },
  'tearjerker': { genre: 'drama', weight: 1.0 },
  'emotional': { genre: 'drama', weight: 0.8 },
  'dramatic': { genre: 'drama', weight: 1.0 },
  'serious': { genre: 'drama', weight: 0.8 },
  
  // Romance mappings
  'romantic': { genre: 'romance', weight: 1.0 },
  'love': { genre: 'romance', weight: 1.0 },
  'romance': { genre: 'romance', weight: 1.0 },
  
  // Action/Thriller mappings
  'exciting': { genre: 'action', weight: 0.8 },
  'thrilling': { genre: 'thriller', weight: 1.0 },
  'intense': { genre: 'thriller', weight: 0.8 },
  'action-packed': { genre: 'action', weight: 1.0 },
  
  // Feel-good mappings
  'heartwarming': { genre: 'family', weight: 0.9 },
  'inspiring': { genre: 'drama', weight: 0.7 },
  'uplifting': { genre: 'family', weight: 0.8 },
  'motivational': { genre: 'drama', weight: 0.7 },
  
  // Dark/serious mappings
  'dark': { genre: 'thriller', weight: 0.8 },
  'gritty': { genre: 'crime', weight: 0.8 }
};

const GENRE_MAPPING: Record<string, string> = {
  'action': '28',
  'adventure': '12',
  'animation': '16',
  'comedy': '35',
  'crime': '80',
  'documentary': '99',
  'drama': '18',
  'family': '10751',
  'fantasy': '14',
  'history': '36',
  'horror': '27',
  'music': '10402',
  'mystery': '9648',
  'romance': '10749',
  'science fiction': '878',
  'sci-fi': '878',
  'thriller': '53',
  'war': '10752',
  'western': '37'
};

/**
 * Enhanced AI-powered search that uses Gemini 2.5 Pro when available
 */
export async function performAISearch(query: string, currentTab: string = 'home'): Promise<AISearchResult> {
  const startTime = Date.now();
  
  try {
    // Get user preferences for AI context
    const preferences = usePreferencesStore.getState().preferences;
    const userPreferences = {
      selectedGenres: preferences.selected_genres || [],
      selectedServices: preferences.selected_services || [],
      language: preferences.language || 'en',
      region: preferences.region || 'US'
    };

    let aiResponse: GeminiSearchResponse;
    let aiPowered = false;
    let fallbackUsed = false;

    // Try to use Gemini AI first
    if (geminiService.isAvailable()) {
      try {
        const geminiRequest: GeminiSearchRequest = {
          query,
          context: `User is searching from the ${currentTab} section`,
          userPreferences
        };

        aiResponse = await geminiService.interpretSearchQuery(geminiRequest);
        aiPowered = true;
        
        console.log('✅ Gemini AI search interpretation:', aiResponse);
      } catch (error) {
        console.warn('🔄 Gemini AI unavailable, using enhanced fallback:', error);
        aiResponse = await performLegacyAISearch(query);
        fallbackUsed = true;
      }
    } else {
      console.log('🔄 Gemini not configured, using enhanced pattern matching');
      aiResponse = await performLegacyAISearch(query);
      fallbackUsed = true;
    }

    // Execute searches based on AI recommendations
    const results = await executeSearchStrategy(aiResponse, query);

    const processingTime = Date.now() - startTime;

    return {
      query,
      interpretation: aiResponse.interpretation,
      results,
      searchStrategy: aiPowered ? 
        `Gemini AI interpretation (confidence: ${(aiResponse.confidence * 100).toFixed(0)}%)` :
        'Enhanced pattern matching with semantic understanding',
      confidence: aiResponse.confidence,
      aiPowered,
      fallbackUsed,
      processingTime
    };

  } catch (error) {
    console.error('AI search error:', error);
    
         // Final fallback to basic search
     const basicResults = await searchContent(query);
     
     return {
       query,
       interpretation: `Basic search results for: "${query}"`,
       results: basicResults,
       searchStrategy: 'Basic text search (fallback)',
       confidence: 0.5,
       aiPowered: false,
       fallbackUsed: true,
       processingTime: Date.now() - startTime
     };
  }
}

/**
 * Execute search strategy based on AI recommendations
 */
async function executeSearchStrategy(aiResponse: GeminiSearchResponse, originalQuery: string): Promise<SearchResult[]> {
  const { contentRecommendations } = aiResponse;
  let allResults: SearchResult[] = [];

  try {
         // Primary search using AI-recommended terms
     for (const searchTerm of contentRecommendations.searchTerms.slice(0, 3)) {
       const results = await searchContent(searchTerm);
       
       // Apply AI-recommended filters
       let filteredResults = results;
      
      if (contentRecommendations.filters.year_range) {
        const [startYear, endYear] = contentRecommendations.filters.year_range.split('-').map(Number);
        filteredResults = filteredResults.filter(item => {
          const year = new Date(item.release_date || item.first_air_date || '').getFullYear();
          return year >= startYear && year <= endYear;
        });
      }

             if (contentRecommendations.filters.vote_average?.gte) {
         filteredResults = filteredResults.filter((item: SearchResult) => 
           (item.vote_average || 0) >= contentRecommendations.filters.vote_average.gte
         );
      }

      allResults.push(...filteredResults);
    }

         // Genre-based search if genres were recommended
     if (contentRecommendations.genres.length > 0) {
       for (const genre of contentRecommendations.genres.slice(0, 2)) {
         const genreId = GENRE_MAPPING[genre.toLowerCase()];
         if (genreId) {
           const genreResults = await getGenreContent(genreId);
           allResults.push(...genreResults.slice(0, 10));
         }
       }
     }

    // Remove duplicates and sort by relevance
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id && t.media_type === item.media_type)
    );

    // Score and sort results based on AI confidence and TMDB metrics
    const scoredResults = scoreAIResults(uniqueResults, aiResponse, originalQuery);
    
    return scoredResults.slice(0, 50); // Return top 50 results

  } catch (error) {
    console.error('Error executing AI search strategy:', error);
    
         // Fallback to basic search
     const basicResults = await searchContent(originalQuery);
     return basicResults;
  }
}

/**
 * Score results based on AI recommendations and TMDB metrics
 */
function scoreAIResults(results: SearchResult[], aiResponse: GeminiSearchResponse, originalQuery: string): SearchResult[] {
  const { contentRecommendations, confidence } = aiResponse;
  
     return results.map(item => {
     let score = (item.popularity || 0) * 0.3 + (item.vote_average || 0) * 10; // Base TMDB score
    
    // Boost score based on AI confidence
    score *= (0.5 + confidence * 0.5);
    
    // Title/name relevance to original query
    const title = (item.title || item.name || '').toLowerCase();
    const queryLower = originalQuery.toLowerCase();
    if (title.includes(queryLower)) {
      score *= 1.5;
    }
    
         // Genre matching bonus
     if (item.genre_ids && contentRecommendations.genres.length > 0) {
       const matchingGenres = contentRecommendations.genres.filter(genre => {
         const genreId = GENRE_MAPPING[genre.toLowerCase()];
         return genreId && item.genre_ids?.includes(Number(genreId));
       });
       score *= (1 + matchingGenres.length * 0.2);
     }
    
    // Media type preference
    if (contentRecommendations.mediaType && contentRecommendations.mediaType !== 'all') {
      if (item.media_type === contentRecommendations.mediaType) {
        score *= 1.3;
      }
    }
    
    // Recent content bonus (if user didn't specify era)
    const year = new Date(item.release_date || item.first_air_date || '').getFullYear();
    const currentYear = new Date().getFullYear();
    if (year >= currentYear - 3) {
      score *= 1.1;
    }
    
    return { ...item, _aiScore: score };
  }).sort((a: any, b: any) => b._aiScore - a._aiScore);
}

/**
 * Legacy AI search using pattern matching (fallback)
 */
async function performLegacyAISearch(query: string): Promise<GeminiSearchResponse> {
  const parsedQuery = parseQuery(query);
  
  return {
    interpretation: generateInterpretation(parsedQuery, query),
    searchSuggestions: generateSearchSuggestions(parsedQuery, query),
    contentRecommendations: {
      searchTerms: [parsedQuery.cleanQuery, ...parsedQuery.descriptors].filter(Boolean),
      genres: parsedQuery.genres,
      mediaType: (parsedQuery.mediaType as 'movie' | 'tv') || 'all',
      filters: buildFilters(parsedQuery)
    },
    confidence: calculateConfidence(parsedQuery),
    reasoning: 'Pattern-based analysis with semantic understanding'
  };
}

/**
 * Detect semantic intent from query and extract meaningful content
 */
function detectSemanticIntent(query: string): {
  isVagueRequest: boolean;
  primaryEmotion: string | null;
  detectedGenre: string | null;
  confidence: number;
} {
  const lowerQuery = query.toLowerCase();
  
  // Check if this is a vague request like "something funny", "anything scary", etc.
  const hasVagueTerm = QUERY_PATTERNS.vague_terms.test(lowerQuery);
  
  // Extract emotions and map to genres
  const emotionMatches = Array.from(lowerQuery.matchAll(QUERY_PATTERNS.emotions))
    .map(match => match[0]);
  
  let primaryEmotion: string | null = null;
  let detectedGenre: string | null = null;
  let confidence = 0.5;
  
  if (emotionMatches.length > 0) {
    // Find the strongest emotion-to-genre mapping
    let bestMapping = { emotion: '', genre: '', weight: 0 };
    
    for (const emotion of emotionMatches) {
      const mapping = EMOTION_TO_GENRE[emotion];
      if (mapping && mapping.weight > bestMapping.weight) {
        bestMapping = {
          emotion,
          genre: mapping.genre,
          weight: mapping.weight
        };
      }
    }
    
    if (bestMapping.weight > 0) {
      primaryEmotion = bestMapping.emotion;
      detectedGenre = bestMapping.genre;
      confidence = hasVagueTerm ? 0.95 : 0.8; // Higher confidence for vague requests with clear emotion
    }
  }
  
  return {
    isVagueRequest: hasVagueTerm,
    primaryEmotion,
    detectedGenre,
    confidence
  };
}

/**
 * Parse natural language query to extract key information
 */
function parseQuery(query: string): {
  actors: string[];
  genres: string[];
  mediaType: string | null;
  descriptors: string[];
  emotions: string[];
  decade: string | null;
  cleanQuery: string;
  semanticIntent: {
    isVagueRequest: boolean;
    primaryEmotion: string | null;
    detectedGenre: string | null;
    confidence: number;
  };
} {
  const lowerQuery = query.toLowerCase();
  
  // Detect semantic intent first
  const semanticIntent = detectSemanticIntent(query);
  
  // Extract actors/people
  const actorMatches = Array.from(query.matchAll(QUERY_PATTERNS.actors))
    .map(match => match[1].trim())
    .filter(name => name.length > 2);
  
  // Extract explicit genres
  const genreMatches = Array.from(lowerQuery.matchAll(QUERY_PATTERNS.genres))
    .map(match => match[0]);
  
  // Add semantically detected genre if not already present
  if (semanticIntent.detectedGenre && !genreMatches.includes(semanticIntent.detectedGenre)) {
    genreMatches.unshift(semanticIntent.detectedGenre);
  }
  
  // Extract media type preference
  const mediaTypeMatch = lowerQuery.match(QUERY_PATTERNS.media_types);
  const mediaType = mediaTypeMatch ? (
    mediaTypeMatch[0].includes('tv') || mediaTypeMatch[0].includes('series') || mediaTypeMatch[0].includes('television') 
      ? 'tv' 
      : 'movie'
  ) : null;
  
  // Extract descriptors (occupations, themes)
  const descriptorMatches = Array.from(lowerQuery.matchAll(QUERY_PATTERNS.descriptors))
    .map(match => match[0]);
  
  // Extract emotions/mood
  const emotionMatches = Array.from(lowerQuery.matchAll(QUERY_PATTERNS.emotions))
    .map(match => match[0]);
  
  // Extract decade/era
  const decadeMatch = lowerQuery.match(QUERY_PATTERNS.decades);
  const decade = decadeMatch ? decadeMatch[0] : null;
  
  // Clean query by removing extracted patterns
  let cleanQuery = query;
  [QUERY_PATTERNS.actors, QUERY_PATTERNS.media_types, QUERY_PATTERNS.vague_terms]
    .forEach(pattern => {
      cleanQuery = cleanQuery.replace(pattern, '').trim();
    });
  
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim() || query;
  
  return {
    actors: actorMatches,
    genres: genreMatches,
    mediaType: mediaType as 'movie' | 'tv' | null,
    descriptors: descriptorMatches,
    emotions: emotionMatches,
    decade,
    cleanQuery,
    semanticIntent
  };
}

function generateInterpretation(parsedQuery: any, originalQuery: string): string {
  const { semanticIntent, actors, genres, mediaType, descriptors, decade } = parsedQuery;
  
  if (semanticIntent.isVagueRequest && semanticIntent.primaryEmotion) {
    return `You're looking for ${semanticIntent.detectedGenre} content that feels ${semanticIntent.primaryEmotion}.`;
  }
  
  let interpretation = 'Looking for ';
  
  if (genres.length > 0) {
    interpretation += `${genres.join(' and ')} `;
  }
  
  if (mediaType) {
    interpretation += `${mediaType}s `;
  } else {
    interpretation += 'content ';
  }
  
  if (actors.length > 0) {
    interpretation += `featuring ${actors.join(' and ')} `;
  }
  
  if (descriptors.length > 0) {
    interpretation += `about ${descriptors.join(' and ')} `;
  }
  
  if (decade) {
    interpretation += `from the ${decade} `;
  }
  
  return interpretation.trim() + '.';
}

function generateSearchSuggestions(parsedQuery: any, originalQuery: string): string[] {
  const suggestions = [originalQuery];
  
  if (parsedQuery.genres.length > 0) {
    suggestions.push(`${parsedQuery.genres[0]} movies`);
    suggestions.push(`${parsedQuery.genres[0]} tv shows`);
  }
  
  if (parsedQuery.actors.length > 0) {
    suggestions.push(`${parsedQuery.actors[0]} filmography`);
  }
  
  if (parsedQuery.descriptors.length > 0) {
    suggestions.push(`${parsedQuery.descriptors[0]} themed content`);
  }
  
  return suggestions.slice(0, 5);
}

function buildFilters(parsedQuery: any): Record<string, any> {
  const filters: Record<string, any> = {};
  
  if (parsedQuery.decade) {
    const decadeMap: Record<string, string> = {
      '90s': '1990-1999',
      '1990s': '1990-1999',
      '2000s': '2000-2009',
      '2010s': '2010-2019',
      '2020s': '2020-2029'
    };
    
    if (decadeMap[parsedQuery.decade]) {
      filters.year_range = decadeMap[parsedQuery.decade];
    }
  }
  
  // Add quality filter for emotional content
  if (parsedQuery.semanticIntent.primaryEmotion) {
    filters.vote_average = { gte: 6.0 };
  }
  
  return filters;
}

function calculateConfidence(parsedQuery: any): number {
  let confidence = 0.5;
  
  if (parsedQuery.semanticIntent.confidence > 0) {
    confidence = parsedQuery.semanticIntent.confidence;
  } else {
    // Calculate based on specificity
    if (parsedQuery.actors.length > 0) confidence += 0.2;
    if (parsedQuery.genres.length > 0) confidence += 0.2;
    if (parsedQuery.mediaType) confidence += 0.1;
    if (parsedQuery.decade) confidence += 0.1;
  }
  
  return Math.min(confidence, 0.95);
}

/**
 * Generate personalized content recommendations
 */
export async function generatePersonalizedRecommendations(context: string = 'homepage'): Promise<AISearchResult> {
  const startTime = Date.now();
  
  try {
    const preferences = usePreferencesStore.getState().preferences;
    const userPreferences = {
      selectedGenres: preferences.selected_genres || [],
      selectedServices: preferences.selected_services || [],
      language: preferences.language || 'en',
      region: preferences.region || 'US'
    };

    let aiResponse: GeminiSearchResponse;
    let aiPowered = false;

    if (geminiService.isAvailable()) {
      try {
        aiResponse = await geminiService.generatePersonalizedRecommendations(
          userPreferences,
          [], // TODO: Add recently viewed content
          context
        );
        aiPowered = true;
      } catch (error) {
        console.warn('Gemini recommendations unavailable, using fallback');
        aiResponse = generateFallbackRecommendations(userPreferences);
      }
    } else {
      aiResponse = generateFallbackRecommendations(userPreferences);
    }

    const results = await executeSearchStrategy(aiResponse, 'personalized recommendations');

    return {
      query: 'personalized recommendations',
      interpretation: aiResponse.interpretation,
      results,
      searchStrategy: aiPowered ? 'AI-powered personalization' : 'Preference-based recommendations',
      confidence: aiResponse.confidence,
      aiPowered,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Personalized recommendations error:', error);
    
    return {
      query: 'personalized recommendations',
      interpretation: 'Unable to generate personalized recommendations',
      results: [],
      searchStrategy: 'Error fallback',
      confidence: 0.1,
      aiPowered: false,
      processingTime: Date.now() - startTime
    };
  }
}

function generateFallbackRecommendations(userPreferences: any): GeminiSearchResponse {
  const primaryGenre = userPreferences.selectedGenres?.[0] || 'popular';
  
  return {
    interpretation: `Here are some ${primaryGenre} recommendations based on your preferences`,
    searchSuggestions: [`trending ${primaryGenre}`, `popular ${primaryGenre} movies`],
    contentRecommendations: {
      searchTerms: ['trending', 'popular', primaryGenre],
      genres: userPreferences.selectedGenres?.slice(0, 3) || [],
      mediaType: 'all',
      filters: { vote_average: { gte: 6.5 } }
    },
    confidence: 0.7,
    reasoning: `Based on your preferred genre: ${primaryGenre}`
  };
}

export function validateSearchQuery(query: string): { isValid: boolean; reason?: string } {
  if (!query || typeof query !== 'string') {
    return { isValid: false, reason: 'Query must be a non-empty string' };
  }
  
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { isValid: false, reason: 'Query cannot be empty' };
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, reason: 'Query too long (max 200 characters)' };
  }
  
  return { isValid: true };
} 