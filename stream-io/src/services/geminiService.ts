import { SearchResult } from '../types/tmdb';
import { handleAsyncError } from './errorHandler';

export interface GeminiSearchRequest {
  query: string;
  context?: string;
  userPreferences?: {
    selectedGenres: string[];
    selectedServices: string[];
    language: string;
    region: string;
  };
}

export interface GeminiSearchResponse {
  interpretation: string;
  searchSuggestions: string[];
  contentRecommendations: {
    searchTerms: string[];
    genres: string[];
    mediaType?: 'movie' | 'tv' | 'all';
    filters: Record<string, any>;
  };
  confidence: number;
  reasoning: string;
}

export interface GeminiConfig {
  projectId: string;
  location: string;
  model: string;
  apiKey?: string;
}

class GeminiService {
  private config: GeminiConfig;
  private baseUrl: string;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      projectId: import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'streamguide-ai',
      location: import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || 'us-central1',
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp',
      apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY
    };

    // Use direct Gemini API if API key is provided, otherwise use Vertex AI
    this.baseUrl = this.config.apiKey 
      ? 'https://generativelanguage.googleapis.com/v1beta'
      : `https://${this.config.location}-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/${this.config.model}`;

    this.isConfigured = Boolean(this.config.apiKey || (this.config.projectId && this.config.location));
  }

  /**
   * Check if Gemini service is properly configured
   */
  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status for debugging
   */
  public getStatus(): { configured: boolean; provider: string; model: string } {
    return {
      configured: this.isConfigured,
      provider: this.config.apiKey ? 'Google AI Studio' : 'Vertex AI',
      model: this.config.model
    };
  }

  /**
   * Generate intelligent search interpretation and recommendations
   */
  public async interpretSearchQuery(request: GeminiSearchRequest): Promise<GeminiSearchResponse> {
    if (!this.isConfigured) {
      throw new Error('Gemini service is not configured. Please set VITE_GOOGLE_AI_API_KEY or Vertex AI credentials.');
    }

    try {
      const prompt = this.buildSearchPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseGeminiResponse(response, request.query);
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback to basic interpretation if API fails
      return this.generateFallbackResponse(request.query);
    }
  }

  /**
   * Build a comprehensive prompt for search interpretation
   */
  private buildSearchPrompt(request: GeminiSearchRequest): string {
    const { query, userPreferences, context } = request;

    let prompt = `You are an AI assistant specialized in interpreting entertainment search queries for a streaming platform aggregator called StreamGuide.

Your task is to analyze the user's search query and provide intelligent recommendations for finding movies and TV shows.

User Query: "${query}"`;

    if (userPreferences) {
      prompt += `

User Preferences:
- Preferred Genres: ${userPreferences.selectedGenres.join(', ') || 'No specific preferences'}
- Available Streaming Services: ${userPreferences.selectedServices.join(', ') || 'All services'}
- Language: ${userPreferences.language || 'en'}
- Region: ${userPreferences.region || 'US'}`;
    }

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `

Please respond with a JSON object containing:
1. "interpretation": A clear, friendly explanation of what the user is looking for
2. "searchSuggestions": 3-5 alternative search terms that might help find relevant content
3. "contentRecommendations": An object with:
   - "searchTerms": Array of specific terms to search for in TMDB
   - "genres": Array of genre names that match the query
   - "mediaType": "movie", "tv", or "all" based on the query
   - "filters": Object with additional filters (year, rating, etc.)
4. "confidence": A number between 0 and 1 indicating confidence in the interpretation
5. "reasoning": Brief explanation of why you interpreted the query this way

Focus on being helpful and understanding natural language queries, including:
- Mood-based requests ("something funny", "scary movies")
- Actor/director references
- Genre combinations
- Decade or era references
- Streaming platform mentions
- Vague requests that need clarification

Example response format:
{
  "interpretation": "You're looking for action movies with comedy elements, particularly from the 1990s.",
  "searchSuggestions": ["90s action comedy", "buddy cop movies", "action adventure comedy"],
  "contentRecommendations": {
    "searchTerms": ["action", "comedy", "adventure"],
    "genres": ["Action", "Comedy", "Adventure"],
    "mediaType": "movie",
    "filters": { "year_range": "1990-1999" }
  },
  "confidence": 0.85,
  "reasoning": "The query mentions specific genre preferences and a time period, making it fairly straightforward to interpret."
}

Important: Respond ONLY with valid JSON. Do not include any other text or explanations outside the JSON.`;

    return prompt;
  }

  /**
   * Call Gemini API with authentication
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = this.config.apiKey
      ? `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`
      : `${this.baseUrl}:generateContent`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization for Vertex AI (would need proper auth token in production)
    if (!this.config.apiKey) {
      // In production, this would use Google Cloud authentication
      // For now, we'll use the direct API approach
      throw new Error('Vertex AI authentication not implemented. Please use VITE_GOOGLE_AI_API_KEY for direct API access.');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    return result.candidates[0].content.parts[0].text;
  }

  /**
   * Parse Gemini API response into our expected format
   */
  private parseGeminiResponse(response: string, originalQuery: string): GeminiSearchResponse {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (!parsed.interpretation || !parsed.contentRecommendations) {
        throw new Error('Missing required fields in Gemini response');
      }

      return {
        interpretation: parsed.interpretation,
        searchSuggestions: parsed.searchSuggestions || [],
        contentRecommendations: {
          searchTerms: parsed.contentRecommendations.searchTerms || [originalQuery],
          genres: parsed.contentRecommendations.genres || [],
          mediaType: parsed.contentRecommendations.mediaType || 'all',
          filters: parsed.contentRecommendations.filters || {}
        },
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'AI-powered interpretation'
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.generateFallbackResponse(originalQuery);
    }
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  private generateFallbackResponse(query: string): GeminiSearchResponse {
    const lowerQuery = query.toLowerCase();
    
    // Basic genre detection for fallback
    const genres: string[] = [];
    const genreMap: Record<string, string> = {
      'funny': 'Comedy',
      'comedy': 'Comedy',
      'scary': 'Horror',
      'horror': 'Horror',
      'action': 'Action',
      'drama': 'Drama',
      'romance': 'Romance',
      'thriller': 'Thriller',
      'sci-fi': 'Science Fiction',
      'fantasy': 'Fantasy'
    };

    Object.entries(genreMap).forEach(([keyword, genre]) => {
      if (lowerQuery.includes(keyword)) {
        genres.push(genre);
      }
    });

    // Detect media type preference
    let mediaType: 'movie' | 'tv' | 'all' = 'all';
    if (lowerQuery.includes('movie') || lowerQuery.includes('film')) {
      mediaType = 'movie';
    } else if (lowerQuery.includes('tv') || lowerQuery.includes('series') || lowerQuery.includes('show')) {
      mediaType = 'tv';
    }

    return {
      interpretation: `Looking for content related to: "${query}"`,
      searchSuggestions: [
        query,
        `${query} ${mediaType === 'all' ? 'movies' : mediaType}`,
        `popular ${query}`
      ],
      contentRecommendations: {
        searchTerms: [query],
        genres,
        mediaType,
        filters: {}
      },
      confidence: 0.6,
      reasoning: 'Fallback interpretation using basic pattern matching'
    };
  }

  /**
   * Generate content recommendations based on user preferences and viewing history
   */
  public async generatePersonalizedRecommendations(
    userPreferences: GeminiSearchRequest['userPreferences'],
    recentlyViewed: SearchResult[] = [],
    context: string = 'general recommendations'
  ): Promise<GeminiSearchResponse> {
    if (!this.isConfigured) {
      return this.generateFallbackRecommendations(userPreferences);
    }

    try {
      const prompt = this.buildRecommendationPrompt(userPreferences, recentlyViewed, context);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseGeminiResponse(response, 'personalized recommendations');
    } catch (error) {
      console.error('Gemini recommendation error:', error);
      return this.generateFallbackRecommendations(userPreferences);
    }
  }

  /**
   * Build prompt for personalized recommendations
   */
  private buildRecommendationPrompt(
    userPreferences: GeminiSearchRequest['userPreferences'],
    recentlyViewed: SearchResult[],
    context: string
  ): string {
    let prompt = `You are an AI entertainment curator for StreamGuide. Generate personalized content recommendations.

Context: ${context}`;

    if (userPreferences) {
      prompt += `

User Preferences:
- Favorite Genres: ${userPreferences.selectedGenres.join(', ') || 'No specific preferences'}
- Available Services: ${userPreferences.selectedServices.join(', ') || 'All services'}
- Language: ${userPreferences.language || 'en'}
- Region: ${userPreferences.region || 'US'}`;
    }

    if (recentlyViewed.length > 0) {
      prompt += `

Recently Viewed:`;
      recentlyViewed.slice(0, 5).forEach(item => {
        prompt += `\n- ${item.title || item.name} (${item.media_type})`;
      });
    }

    prompt += `

Generate recommendations in the same JSON format as search queries, focusing on discovering new content that matches the user's taste profile. Consider genre preferences, viewing patterns, and current trends.

Respond ONLY with valid JSON in the same format as search responses.`;

    return prompt;
  }

  /**
   * Generate fallback recommendations without AI
   */
  private generateFallbackRecommendations(
    userPreferences: GeminiSearchRequest['userPreferences']
  ): GeminiSearchResponse {
    const genres = userPreferences?.selectedGenres || [];
    const primaryGenre = genres[0] || 'popular';

    return {
      interpretation: `Here are some ${primaryGenre} recommendations based on your preferences`,
      searchSuggestions: [
        `trending ${primaryGenre}`,
        `popular ${primaryGenre} movies`,
        `top ${primaryGenre} tv shows`
      ],
      contentRecommendations: {
        searchTerms: ['trending', 'popular', primaryGenre],
        genres: genres.slice(0, 3),
        mediaType: 'all',
        filters: {
          sort_by: 'popularity.desc',
          vote_average: { gte: 6.0 }
        }
      },
      confidence: 0.7,
      reasoning: `Recommendations based on your preferred genre: ${primaryGenre}`
    };
  }
}

// Create singleton instance
export const geminiService = new GeminiService();

// Export for use in other services
export default geminiService; 