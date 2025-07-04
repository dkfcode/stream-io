/**
 * ML Search Service
 * True AI/ML-powered search using OpenAI, local embeddings, and semantic analysis
 */

import { handleAsyncError } from './errorHandler';
import { searchContent, getContentByPerson, getGenreContent, searchPeople } from './tmdb';
import type { SearchResult, PersonResult } from '../types/tmdb';

// Enhanced search result with ML confidence scores
export interface MLSearchResult {
  query: string;
  interpretation: string;
  results: SearchResult[];
  searchStrategy: string;
  confidence: number;
  aiInsights: {
    queryIntent: string;
    semanticAnalysis: string;
    recommendations: string[];
    alternativeQueries: string[];
  };
  processingTime: number;
  modelUsed: string;
}

// Search options for ML search
export interface MLSearchOptions {
  includePersonContent?: boolean;
  maxResults?: number;
  useFallback?: boolean;
}

// AI Configuration
const AI_SERVICES = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
    embeddingModel: 'text-embedding-3-small'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229'
  },
  local: {
    // For privacy-conscious users who prefer local processing
    enabled: false,
    model: 'sentence-transformers/all-MiniLM-L6-v2'
  }
};

interface SemanticEmbedding {
  vector: number[];
  text: string;
  metadata: Record<string, string | number | boolean>;
}

interface QueryAnalysis {
  intent: 'search_specific' | 'discover_similar' | 'mood_based' | 'recommendation' | 'comparison' | 'actor_search';
  entities: Array<{
    type: 'person' | 'genre' | 'year' | 'mood' | 'theme';
    value: string;
    confidence: number;
    id?: number; // For person entities, store the TMDB ID
  }>;
  mood?: {
    primary: string;
    secondary?: string;
    intensity: number;
  };
  complexity: 'simple' | 'moderate' | 'complex';
  requires_reasoning: boolean;
  personFocus?: boolean; // Whether the query is primarily about actors/people
}

class MLSearchService {
  private readonly apiKeys = {
    openai: import.meta.env.VITE_OPENAI_API_KEY || null,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || null
  };
  
  private embeddingsCache = new Map<string, SemanticEmbedding>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Perform ML-powered search with semantic understanding
   */
  async performMLSearch(query: string, options: MLSearchOptions = {}): Promise<MLSearchResult> {
    const {
      includePersonContent = true,
      maxResults = 20,
      useFallback = false
    } = options;

    const startTime = Date.now();
    
    try {
      if (useFallback) {
        return this.fallbackSearch(query, maxResults);
      }

      // Step 1: Analyze query with AI
      const queryAnalysis = await this.analyzeQuery(query, includePersonContent);
      
      // Step 2: Generate semantic embeddings
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Step 3: Execute search strategy based on AI analysis
      const searchResults = await this.executeIntelligentSearch(
        query, 
        queryAnalysis, 
        queryEmbedding, 
        { includePersonContent, maxResults }
      );
      
      // Step 4: Post-process results with AI insights
      const enhancedResults = await this.enhanceResultsWithAI(searchResults, queryAnalysis, query);
      
      // Step 5: Generate AI insights and recommendations
      const aiInsights = await this.generateInsights(query, queryAnalysis, enhancedResults);
      
      const processingTime = Date.now() - startTime;
      
      return {
        query,
        interpretation: queryAnalysis.complexity === 'complex' 
          ? await this.generateInterpretation(query, queryAnalysis)
          : this.generateSimpleInterpretation(queryAnalysis),
        results: enhancedResults.slice(0, maxResults),
        searchStrategy: this.getStrategyDescription(queryAnalysis),
        confidence: this.calculateOverallConfidence(queryAnalysis, enhancedResults),
        aiInsights,
        processingTime,
        modelUsed: this.getModelUsed()
      };
      
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'performMLSearch',
        query
      });
      
      // Fallback to traditional search
      return this.fallbackSearch(query, maxResults);
    }
  }

  /**
   * Advanced query analysis using AI
   */
  private async analyzeQuery(query: string, includePersonContent: boolean = true): Promise<QueryAnalysis> {
    if (!this.apiKeys.openai && !this.apiKeys.anthropic) {
      return this.fallbackQueryAnalysis(query, includePersonContent);
    }

    try {
      const prompt = this.buildAnalysisPrompt(query);
      const analysis = await this.callAIService(prompt, 'analysis');
      
      return this.parseAIAnalysis(analysis, includePersonContent);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'analyzeQuery',
        query
      });
      return this.fallbackQueryAnalysis(query, includePersonContent);
    }
  }

  /**
   * Generate semantic embeddings for query
   */
  private async generateEmbedding(text: string): Promise<SemanticEmbedding> {
    const cacheKey = `embedding_${text}`;
    const cached = this.embeddingsCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (this.apiKeys.openai) {
        const embedding = await this.generateOpenAIEmbedding(text);
        this.embeddingsCache.set(cacheKey, embedding);
        return embedding;
      } else {
        // Fallback to local embeddings or simple vector
        return this.generateFallbackEmbedding(text);
      }
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'generateEmbedding',
        text: text.substring(0, 50)
      });
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Execute intelligent search based on AI analysis
   */
  private async executeIntelligentSearch(
    query: string, 
    analysis: QueryAnalysis, 
    embedding: SemanticEmbedding,
    options: MLSearchOptions
  ): Promise<SearchResult[]> {
    const { includePersonContent = true, maxResults = 20 } = options;
    const searchStrategies: Array<() => Promise<SearchResult[]>> = [];

    // Determine if this is primarily an actor search
    const isActorFocused = analysis.intent === 'actor_search' || 
                          analysis.personFocus || 
                          this.looksLikePersonName(query);

    // 1. Always include basic content search as foundation
    searchStrategies.push(async () => {
      const basicResults = await searchContent(query);
      const allocation = isActorFocused ? 0.4 : 0.6; // Reduce content allocation for actor searches
      return basicResults.slice(0, Math.floor(maxResults * allocation));
    });

    // 2. Enhanced person search when includePersonContent is true
    if (includePersonContent) {
      searchStrategies.push(async () => {
        console.log('🔍 Executing person search for query:', query);
        const personResults = await this.searchPeople(query);
        console.log('👤 Person search results:', personResults.length, 'found');
        if (personResults.length > 0) {
          console.log('👤 First person result:', personResults[0]);
        }
        // Increase allocation for actor-focused searches
        const allocation = isActorFocused ? 0.6 : 0.3;
        return personResults.slice(0, Math.floor(maxResults * allocation));
      });
    }

    // 3. Entity-based search (existing functionality)
    if (analysis.entities.length > 0) {
      searchStrategies.push(async () => {
        const entityResults = await this.searchByEntities(analysis.entities, includePersonContent);
        return entityResults.slice(0, Math.floor(maxResults * 0.4));
      });
    }

    // 4. Mood-based search
    if (analysis.mood) {
      searchStrategies.push(async () => {
        const moodResults = await this.searchByMood(analysis.mood!);
        return moodResults.slice(0, Math.floor(maxResults * 0.3));
      });
    }

    // 5. Semantic search
    searchStrategies.push(async () => {
      const semanticResults = await this.searchBySemantic(embedding);
      return semanticResults.slice(0, Math.floor(maxResults * 0.2));
    });

    // Execute all strategies in parallel
    const resultSets = await Promise.all(
      searchStrategies.map(strategy => 
        strategy().catch(error => {
          console.warn('Search strategy failed:', error);
          return [];
        })
      )
    );

    // Merge and rank results
    const finalResults = this.mergeAndRankResults(resultSets, analysis, embedding);
    
    // Return up to maxResults
    return finalResults.slice(0, maxResults);
  }

  /**
   * Enhance results with AI-powered analysis
   */
  private async enhanceResultsWithAI(
    results: SearchResult[], 
    analysis: QueryAnalysis, 
    originalQuery: string
  ): Promise<SearchResult[]> {
    if (!this.apiKeys.openai && !this.apiKeys.anthropic) {
      return results;
    }

    try {
      // Batch process results for AI enhancement
      const enhancedResults: SearchResult[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < Math.min(results.length, 20); i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        const enhanced = await this.enhanceBatch(batch);
        enhancedResults.push(...enhanced);
      }
      
      return enhancedResults;
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'enhanceResultsWithAI'
      });
      return results;
    }
  }

  /**
   * Generate AI insights and recommendations
   */
  private async generateInsights(
    query: string, 
    analysis: QueryAnalysis, 
    results: SearchResult[]
  ): Promise<MLSearchResult['aiInsights']> {
    try {
      if (this.apiKeys.openai || this.apiKeys.anthropic) {
        const insightsPrompt = this.buildInsightsPrompt(query, analysis, results);
        const insights = await this.callAIService(insightsPrompt, 'insights');
        return this.parseInsights(insights);
      } else {
        return this.generateFallbackInsights(query, analysis, results);
      }
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'generateInsights'
      });
      return this.generateFallbackInsights(query, analysis, results);
    }
  }

  // AI Service Integration Methods
  private async callAIService(prompt: string, type: 'analysis' | 'insights'): Promise<string> {
    if (this.apiKeys.openai) {
      return this.callOpenAI(prompt, type);
    } else if (this.apiKeys.anthropic) {
      return this.callAnthropic(prompt, type);
    } else {
      throw new Error('No AI service available');
    }
  }

  private async callOpenAI(prompt: string, type: 'analysis' | 'insights'): Promise<string> {
    const response = await fetch(`${AI_SERVICES.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_SERVICES.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: type === 'analysis' ? 500 : 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string, type: 'analysis' | 'insights'): Promise<string> {
    const response = await fetch(`${AI_SERVICES.anthropic.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeys.anthropic!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_SERVICES.anthropic.model,
        max_tokens: type === 'analysis' ? 500 : 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async generateOpenAIEmbedding(text: string): Promise<SemanticEmbedding> {
    const response = await fetch(`${AI_SERVICES.openai.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_SERVICES.openai.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      vector: data.data[0].embedding,
      text,
      metadata: { model: AI_SERVICES.openai.embeddingModel }
    };
  }

  // Prompt Engineering Methods
  private getSystemPrompt(type: 'analysis' | 'insights'): string {
    if (type === 'analysis') {
      return `You are an expert at analyzing movie and TV show search queries. 
      Analyze the user's intent, extract entities, identify mood/themes, and determine search complexity.
      Return structured JSON with: intent, entities (with confidence), mood, complexity, requires_reasoning.`;
    } else {
      return `You are a movie and TV recommendation expert. 
      Provide insights about search results, suggest similar content, and offer personalized recommendations.
      Be concise but insightful.`;
    }
  }

  private buildAnalysisPrompt(query: string): string {
    return `Analyze this search query for movies/TV shows: "${query}"

Please identify:
1. Primary intent (search specific content, discover similar, mood-based browsing, get recommendations, compare options)
2. Named entities (people, genres, years, themes) with confidence scores
3. Emotional mood or atmosphere desired
4. Query complexity level
5. Whether this requires reasoning beyond simple matching

Return structured analysis.`;
  }

  private buildInsightsPrompt(query: string, analysis: QueryAnalysis, results: SearchResult[]): string {
    const topResults = results.slice(0, 5).map(r => `${r.title} - ${r.overview?.substring(0, 100)}`).join('\n');
    
    return `Original query: "${query}"
Query analysis: ${JSON.stringify(analysis, null, 2)}
Top results:
${topResults}

Provide insights including:
1. Query intent explanation
2. Semantic analysis of what the user is really looking for
3. 3-5 specific recommendations based on results
4. 2-3 alternative search queries they might try

Be helpful and insightful but concise.`;
  }

  // Search Strategy Methods
  /**
   * Enhanced search by entities with proper person search support
   */
  private async searchByEntities(entities: QueryAnalysis['entities'], includePersonContent: boolean): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const entity of entities) {
      if (entity.confidence > 0.6) {
        try {
          if (entity.type === 'person' && includePersonContent) {
            if (entity.id) {
              // If we have a person ID, get their filmography
              const personResults = await getContentByPerson(entity.id);
              results.push(...personResults);
            } else {
              // If we only have a name, search for the person first
              const people = await searchPeople(entity.value);
              
              // Convert PersonResult to SearchResult format and add person results
              const personSearchResults: SearchResult[] = people.map(person => ({
                id: person.id,
                name: person.name,
                profile_path: person.profile_path,
                media_type: 'person' as const,
                known_for_department: person.known_for_department,
                known_for: person.known_for,
                popularity: person.popularity,
                adult: false,
                poster_path: null,
                title: undefined,
                release_date: undefined,
                first_air_date: undefined,
                vote_average: undefined,
                vote_count: undefined,
                overview: undefined
              }));
              
              results.push(...personSearchResults);
              
              // Also get filmography for the top person result
              if (people.length > 0 && people[0].id) {
                const filmography = await getContentByPerson(people[0].id);
                results.push(...filmography.slice(0, 5)); // Limit filmography results
              }
            }
          } else if (entity.type === 'genre') {
            const genreResults = await getGenreContent(entity.value);
            results.push(...genreResults);
          }
        } catch (error) {
          console.warn(`Failed to search for entity: ${entity.value}`, error);
          // Continue with other entities
        }
      }
    }
    
    return results;
  }

  /**
   * Enhanced people search function
   */
  private async searchPeople(query: string): Promise<SearchResult[]> {
    try {
      console.log('🔍 ML Search: searchPeople called with query:', query);
      const people = await searchPeople(query);
      console.log('👤 TMDB searchPeople returned:', people.length, 'results');
      
      // Convert PersonResult to SearchResult format
      const searchResults = people.map(person => ({
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        media_type: 'person' as const,
        known_for_department: person.known_for_department,
        known_for: person.known_for,
        popularity: person.popularity,
        adult: false,
        poster_path: null,
        title: undefined,
        release_date: undefined,
        first_air_date: undefined,
        vote_average: undefined,
        vote_count: undefined,
        overview: undefined
      }));
      
      console.log('👤 Converted to SearchResult format:', searchResults.length, 'results');
      return searchResults;
    } catch (error) {
      console.warn('❌ Failed to search people:', error);
      return [];
    }
  }

  private async searchByMood(mood: NonNullable<QueryAnalysis['mood']>): Promise<SearchResult[]> {
    // Map moods to genres and search parameters
    const moodToGenreMap: Record<string, string> = {
      'happy': 'comedy',
      'sad': 'drama',
      'excited': 'action',
      'scared': 'horror',
      'romantic': 'romance',
      'curious': 'documentary',
      'nostalgic': 'classic'
    };
    
    const genre = moodToGenreMap[mood.primary];
    if (genre) {
      return getGenreContent(genre);
    }
    
    return [];
  }

  private async searchBySemantic(embedding: SemanticEmbedding): Promise<SearchResult[]> {
    // For now, use text similarity as a proxy for semantic similarity
    // In a full implementation, this would compare embedding vectors
    const keywords = this.extractKeywords(embedding.text);
    const results: SearchResult[] = [];
    
    for (const keyword of keywords) {
      try {
        const keywordResults = await searchContent(keyword);
        results.push(...keywordResults);
      } catch {
        // Continue with other keywords
      }
    }
    
    return results;
  }

  // Helper Methods
  private mergeAndRankResults(
    resultSets: SearchResult[][], 
    analysis: QueryAnalysis, 
    embedding: SemanticEmbedding
  ): SearchResult[] {
    const allResults = new Map<number, SearchResult>();
    const scoreMap = new Map<number, number>();
    
    // Combine results and calculate weighted scores
    resultSets.forEach((results, strategyIndex) => {
      const strategyWeight = this.getStrategyWeight(strategyIndex, analysis);
      
      results.forEach((result, position) => {
        const id = result.id;
        const positionScore = Math.max(0, 1 - position / results.length);
        const weightedScore = positionScore * strategyWeight;
        
        if (!allResults.has(id)) {
          allResults.set(id, result);
          scoreMap.set(id, weightedScore);
        } else {
          // Boost score for items that appear in multiple strategies
          const currentScore = scoreMap.get(id) || 0;
          scoreMap.set(id, currentScore + weightedScore * 0.5);
        }
      });
    });
    
    // Sort by combined score
    return Array.from(allResults.values())
      .sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0))
      .slice(0, 20);
  }

  private getStrategyWeight(strategyIndex: number, analysis: QueryAnalysis): number {
    // Weight strategies based on query analysis
    const weights = [1.0, 0.8, 0.9, 0.6, 0.4]; // entity, mood, person, semantic, text
    
    if (analysis.intent === 'mood_based' && strategyIndex === 1) {
      return 1.2; // Boost mood-based search for mood queries
    }

    if (analysis.intent === 'actor_search' && strategyIndex === 2) {
      return 1.3; // Boost person search for actor queries
    }
    
    return weights[strategyIndex] || 0.4;
  }

  // Fallback Methods
  private fallbackQueryAnalysis(query: string, includePersonContent: boolean = true): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Simple heuristic-based analysis
    const entities: QueryAnalysis['entities'] = [];
    let intent: QueryAnalysis['intent'] = 'search_specific';
    let personFocus = false;
    
    // Check for mood words
    const moodWords = ['funny', 'scary', 'sad', 'romantic', 'exciting'];
    const foundMood = moodWords.find(mood => lowerQuery.includes(mood));
    
    if (foundMood) {
      intent = 'mood_based';
    }
    
    // Check for recommendation words
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
      intent = 'recommendation';
    }

    // Enhanced actor/person detection
    if (includePersonContent) {
      const actorKeywords = [
        'actor', 'actress', 'starring', 'with ', 'stars', 'cast',
        'played by', 'performance by', 'role by'
      ];
      
      const hasActorKeywords = actorKeywords.some(keyword => lowerQuery.includes(keyword));
      const looksLikeName = this.looksLikePersonName(query);
      
      if (hasActorKeywords || looksLikeName) {
        intent = 'actor_search';
        personFocus = true;
        
        // If it looks like a name, add it as a person entity
        if (looksLikeName) {
          entities.push({
            type: 'person',
            value: query.trim(),
            confidence: 0.8
          });
        }
      }
    }
    
    return {
      intent,
      entities,
      complexity: query.split(' ').length > 5 ? 'complex' : 'simple',
      requires_reasoning: intent === 'recommendation' || intent === 'actor_search',
      personFocus
    };
  }

  private generateFallbackEmbedding(text: string): SemanticEmbedding {
    // Simple word-based vector (not true embeddings but better than nothing)
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(384).fill(0); // Standard embedding size
    
    words.forEach((word) => {
      const hash = this.simpleHash(word);
      vector[hash % 384] += 1;
    });
    
    return {
      vector,
      text,
      metadata: { model: 'fallback' }
    };
  }

  private async fallbackSearch(query: string, maxResults: number): Promise<MLSearchResult> {
    const results = await searchContent(query);
    
    return {
      query,
      interpretation: `Searching for: ${query}`,
      results: results.slice(0, maxResults),
      searchStrategy: 'traditional_text_search',
      confidence: 0.6,
      aiInsights: {
        queryIntent: 'search_specific',
        semanticAnalysis: 'Basic text matching performed',
        recommendations: ['Try more specific terms', 'Include genre or actor names'],
        alternativeQueries: []
      },
      processingTime: 0,
      modelUsed: 'fallback'
    };
  }

  private generateFallbackInsights(
    query: string, 
    analysis: QueryAnalysis, 
    results: SearchResult[]
  ): MLSearchResult['aiInsights'] {
    const resultTitles = results
      .slice(0, 3)
      .map(r => r.title || r.name)
      .filter((title): title is string => !!title);

    return {
      queryIntent: analysis.intent,
      semanticAnalysis: `Query appears to be ${analysis.complexity} with ${analysis.entities.length} entities identified`,
      recommendations: resultTitles,
      alternativeQueries: this.generateAlternativeQueries(query)
    };
  }

  // Utility Methods
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private generateAlternativeQueries(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const alternatives: string[] = [];
    
    // Generate some simple alternative queries
    if (words.length > 1) {
      alternatives.push(words.slice(0, -1).join(' '));
      alternatives.push(words.slice(1).join(' '));
    }
    
    alternatives.push(`${query} movie`);
    alternatives.push(`${query} tv show`);
    
    return alternatives.slice(0, 4);
  }

  private calculateOverallConfidence(analysis: QueryAnalysis, results: SearchResult[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on analysis quality
    if (analysis.entities.length > 0) {
      confidence += 0.2;
    }
    
    if (analysis.requires_reasoning) {
      confidence += 0.1;
    }
    
    // Boost confidence based on result quality
    if (results.length > 0) {
      confidence += 0.2;
    }
    
    if (results.length > 10) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private getModelUsed(): string {
    if (this.apiKeys.openai) return 'openai-gpt-4';
    if (this.apiKeys.anthropic) return 'anthropic-claude-3';
    return 'fallback-heuristic';
  }

  private getStrategyDescription(analysis: QueryAnalysis): string {
    const strategies = ['entity-based', 'mood-based', 'person-focused', 'semantic', 'text-based'];
    return `Multi-strategy search using: ${strategies.slice(0, 3).join(', ')}`;
  }

  private generateSimpleInterpretation(analysis: QueryAnalysis): string {
    return `Understanding query as ${analysis.intent.replace('_', ' ')} search`;
  }

  private async generateInterpretation(query: string, analysis: QueryAnalysis): Promise<string> {
    try {
      const prompt = `Interpret this search query for a movie/TV database: "${query}". What is the user looking for?`;
      return await this.callAIService(prompt, 'insights');
    } catch {
      return this.generateSimpleInterpretation(analysis);
    }
  }

  private parseAIAnalysis(analysis: string, includePersonContent: boolean = true): QueryAnalysis {
    try {
      const parsed = JSON.parse(analysis);
      return {
        ...parsed,
        personFocus: includePersonContent && (parsed.personFocus || false)
      };
    } catch {
      // Fallback parsing
      return this.fallbackQueryAnalysis(analysis, includePersonContent);
    }
  }

  private parseInsights(insights: string): MLSearchResult['aiInsights'] {
    try {
      return JSON.parse(insights);
    } catch {
      return {
        queryIntent: 'search_specific',
        semanticAnalysis: 'Unable to parse AI insights',
        recommendations: [],
        alternativeQueries: []
      };
    }
  }

  private async enhanceBatch(
    batch: SearchResult[]
  ): Promise<SearchResult[]> {
    // For now, return as-is
    // In a full implementation, this would enhance results with additional metadata
    return batch;
  }

  // Helper method to detect if query looks like a person name
  private looksLikePersonName(query: string): boolean {
    const cleaned = query.trim().toLowerCase();
    const words = cleaned.split(/\s+/);
    
    // Single word that looks like a name (capitalized, common names)
    if (words.length === 1 && words[0].length >= 3) {
      const commonNames = [
        'michael', 'chris', 'ryan', 'matt', 'john', 'james', 'robert', 'david',
        'jennifer', 'sarah', 'emma', 'olivia', 'sophia', 'emily', 'ava',
        'will', 'tom', 'brad', 'leo', 'leonardo', 'scarlett', 'anne', 'julia'
      ];
      return commonNames.includes(words[0]);
    }
    
    // Multiple words that could be first/last name pattern
    if (words.length >= 2 && words.length <= 4) {
      // Check if it contains common actor name patterns
      const fullName = words.join(' ');
      
      // Common actor name patterns
      const actorPatterns = [
        /^[a-z]+ [a-z]+$/,                    // "first last"
        /^[a-z]+ [a-z]\. [a-z]+$/,           // "first m. last"
        /^[a-z]+ [a-z] [a-z]+$/,             // "first m last"
        /^[a-z]+ [a-z]+ [a-z]+$/             // "first middle last"
      ];
      
      return actorPatterns.some(pattern => pattern.test(fullName));
    }
    
    return false;
  }
}

export const mlSearchService = new MLSearchService(); 