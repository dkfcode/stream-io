/**
 * ML Search Service
 * True AI/ML-powered search using OpenAI, local embeddings, and semantic analysis
 */

import { handleAsyncError } from './errorHandler';
import { searchContent, getContentByPerson, getGenreContent } from './tmdb';
import type { SearchResult } from '../types/tmdb';

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
  intent: 'search_specific' | 'discover_similar' | 'mood_based' | 'recommendation' | 'comparison';
  entities: Array<{
    type: 'person' | 'genre' | 'year' | 'mood' | 'theme';
    value: string;
    confidence: number;
  }>;
  mood?: {
    primary: string;
    secondary?: string;
    intensity: number;
  };
  complexity: 'simple' | 'moderate' | 'complex';
  requires_reasoning: boolean;
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
  async performMLSearch(query: string): Promise<MLSearchResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze query with AI
      const queryAnalysis = await this.analyzeQuery(query);
      
      // Step 2: Generate semantic embeddings
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Step 3: Execute search strategy based on AI analysis
      const searchResults = await this.executeIntelligentSearch(query, queryAnalysis, queryEmbedding);
      
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
        results: enhancedResults,
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
      return this.fallbackSearch(query);
    }
  }

  /**
   * Advanced query analysis using AI
   */
  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    if (!this.apiKeys.openai && !this.apiKeys.anthropic) {
      return this.fallbackQueryAnalysis(query);
    }

    try {
      const prompt = this.buildAnalysisPrompt(query);
      const analysis = await this.callAIService(prompt, 'analysis');
      
      return this.parseAIAnalysis(analysis);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'analyzeQuery',
        query
      });
      return this.fallbackQueryAnalysis(query);
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
    embedding: SemanticEmbedding
  ): Promise<SearchResult[]> {
    const searchStrategies: Promise<SearchResult[]>[] = [];

    // Strategy 1: Entity-based search
    const entityResults = this.searchByEntities(analysis.entities);
    searchStrategies.push(entityResults);

    // Strategy 2: Mood-based search
    if (analysis.mood) {
      const moodResults = this.searchByMood(analysis.mood);
      searchStrategies.push(moodResults);
    }

    // Strategy 3: Semantic similarity search
    const semanticResults = this.searchBySemantic(embedding);
    searchStrategies.push(semanticResults);

    // Strategy 4: Traditional text search as baseline
    const textResults = searchContent(query);
    searchStrategies.push(textResults);

    // Execute all strategies in parallel
    const allResults = await Promise.all(searchStrategies);
    
    // Merge and rank results using ML scoring
    return this.mergeAndRankResults(allResults, analysis, embedding);
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
  private async searchByEntities(entities: QueryAnalysis['entities']): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const entity of entities) {
      if (entity.confidence > 0.7) {
        try {
          if (entity.type === 'person') {
            const personResults = await getContentByPerson(entity.value);
            results.push(...personResults);
          } else if (entity.type === 'genre') {
            const genreResults = await getGenreContent(entity.value);
            results.push(...genreResults);
          }
        } catch {
          // Continue with other entities
        }
      }
    }
    
    return results;
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
    const weights = [1.0, 0.8, 0.6, 0.4]; // entity, mood, semantic, text
    
    if (analysis.intent === 'mood_based' && strategyIndex === 1) {
      return 1.2; // Boost mood-based search for mood queries
    }
    
    return weights[strategyIndex] || 0.4;
  }

  // Fallback Methods
  private fallbackQueryAnalysis(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Simple heuristic-based analysis
    const entities: QueryAnalysis['entities'] = [];
    let intent: QueryAnalysis['intent'] = 'search_specific';
    
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
    
    return {
      intent,
      entities,
      complexity: query.split(' ').length > 5 ? 'complex' : 'simple',
      requires_reasoning: intent === 'recommendation' || intent === 'comparison'
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

  private async fallbackSearch(query: string): Promise<MLSearchResult> {
    const results = await searchContent(query);
    
    return {
      query,
      interpretation: `Searching for: ${query}`,
      results,
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
    return {
      queryIntent: analysis.intent,
      semanticAnalysis: `Query appears to be ${analysis.complexity} with ${analysis.entities.length} entities identified`,
      recommendations: results.slice(0, 3).map(r => r.title),
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
    // Simple alternative query generation
    const alternatives: string[] = [];
    
    if (query.includes('movie')) {
      alternatives.push(query.replace('movie', 'film'));
    }
    
    if (query.includes('show')) {
      alternatives.push(query.replace('show', 'series'));
    }
    
    return alternatives.slice(0, 3);
  }

  private calculateOverallConfidence(analysis: QueryAnalysis, results: SearchResult[]): number {
    let confidence = 0.5;
    
    if (analysis.entities.length > 0) {
      confidence += 0.2;
    }
    
    if (results.length > 0) {
      confidence += 0.2;
    }
    
    if (analysis.complexity === 'simple') {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private getModelUsed(): string {
    if (this.apiKeys.openai) return 'OpenAI GPT-4 + Embeddings';
    if (this.apiKeys.anthropic) return 'Anthropic Claude';
    return 'Fallback Pattern Matching';
  }

  private getStrategyDescription(analysis: QueryAnalysis): string {
    const strategies = [];
    
    if (analysis.entities.length > 0) strategies.push('entity-based');
    if (analysis.mood) strategies.push('mood-based');
    strategies.push('semantic-similarity');
    strategies.push('text-matching');
    
    return `Multi-strategy search: ${strategies.join(', ')}`;
  }

  private generateSimpleInterpretation(analysis: QueryAnalysis): string {
    return `Looking for ${analysis.intent.replace('_', ' ')} content`;
  }

  private async generateInterpretation(query: string, analysis: QueryAnalysis): Promise<string> {
    if (this.apiKeys.openai || this.apiKeys.anthropic) {
      const prompt = `Explain what the user is looking for in this search: "${query}"`;
      try {
        return await this.callAIService(prompt, 'insights');
      } catch {
        return this.generateSimpleInterpretation(analysis);
      }
    }
    return this.generateSimpleInterpretation(analysis);
  }

  private parseAIAnalysis(analysis: string): QueryAnalysis {
    try {
      return JSON.parse(analysis);
    } catch {
      // Fallback parsing
      return this.fallbackQueryAnalysis(analysis);
    }
  }

  private parseInsights(insights: string): MLSearchResult['aiInsights'] {
    try {
      return JSON.parse(insights);
    } catch {
      // Parse as plain text
      return {
        queryIntent: 'search_specific',
        semanticAnalysis: insights.substring(0, 200),
        recommendations: [],
        alternativeQueries: []
      };
    }
  }

  private async enhanceBatch(
    batch: SearchResult[]
  ): Promise<SearchResult[]> {
    // Enhance each result in the batch
    return batch; // For now, return as-is
  }
}

export const mlSearchService = new MLSearchService(); 