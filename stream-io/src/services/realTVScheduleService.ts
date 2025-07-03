/**
 * Real TV Schedule Service
 * Integrates with multiple real TV schedule APIs to provide actual programming data
 */

import { handleSilentError } from './errorHandler';
import { locationService } from './locationService';
import type { LocationData } from './locationService';

// Enhanced TV program interface with real data support
export interface RealTVProgram {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  category: string;
  subcategory?: string;
  network: string;
  channelCallSign: string;
  isLive: boolean;
  isNew: boolean;
  rating?: string;
  imageUrl?: string;
  episodeInfo?: {
    season?: number;
    episode?: number;
    episodeTitle?: string;
  };
  // Sports-specific data
  matchup?: {
    homeTeam: string;
    awayTeam: string;
  };
  score?: {
    home: number;
    away: number;
  };
  gameState?: {
    period: string;
    time: string;
  };
  league?: string;
}

export interface RealChannelSchedule {
  channelName: string;
  channelNumber: string;
  network: string;
  logo?: string;
  current?: RealTVProgram;
  upcoming: RealTVProgram[];
  lastUpdated: string;
  dataSource: string;
}

// Real TV Schedule APIs Configuration
const TV_SCHEDULE_APIS = {
  // Primary: Gracenote (TiVo) - Premium but most accurate
  gracenote: {
    baseUrl: 'https://api.gracenote.com/tms/v1.1',
    requiresKey: true,
    priority: 1
  },
  // Secondary: EPG.best - Good coverage, requires subscription
  epgBest: {
    baseUrl: 'https://epg.best/api',
    requiresKey: true,
    priority: 2
  },
  // Tertiary: TVMaze - Free but limited regional data
  tvmaze: {
    baseUrl: 'https://api.tvmaze.com',
    requiresKey: false,
    priority: 3
  },
  // Sports data: ESPN API
  espn: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
    requiresKey: false,
    priority: 2
  }
};

class RealTVScheduleService {
  private static instance: RealTVScheduleService;
  private cache = new Map<string, { data: RealChannelSchedule; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for real data
  
  // API Keys from environment
  private readonly apiKeys = {
    gracenote: import.meta.env.VITE_GRACENOTE_API_KEY || null,
    epgBest: import.meta.env.VITE_EPG_BEST_API_KEY || null
  };

  private constructor() {}

  static getInstance(): RealTVScheduleService {
    if (!RealTVScheduleService.instance) {
      RealTVScheduleService.instance = new RealTVScheduleService();
    }
    return RealTVScheduleService.instance;
  }

  /**
   * Get real TV schedule for a channel
   */
  async getRealChannelSchedule(channelName: string): Promise<RealChannelSchedule> {
    const normalizedName = this.normalizeChannelName(channelName);
    const cacheKey = `real_${normalizedName}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let schedule: RealChannelSchedule;
      
      // Try APIs in priority order
      if (this.apiKeys.gracenote) {
        try {
          schedule = await this.fetchFromGracenote(normalizedName);
        } catch (error) {
          // Use silent error for individual API failures
          handleSilentError(error as Error, {
            operation: 'fetchFromGracenote',
            channelName: normalizedName
          });
          schedule = await this.tryAlternativeAPIs(normalizedName);
        }
      } else {
        schedule = await this.tryAlternativeAPIs(normalizedName);
      }

      // Cache the result
      this.cache.set(cacheKey, { data: schedule, timestamp: Date.now() });
      return schedule;
      
    } catch (error) {
      // Use silent error for channel schedule failures to avoid spamming
      handleSilentError(error as Error, {
        operation: 'getRealChannelSchedule',
        channelName: normalizedName
      });
      
      // Return enhanced fallback data
      return this.generateEnhancedFallback(normalizedName);
    }
  }

  /**
   * Get live sports data for sports channels
   */
  async getLiveSportsData(sport: string = 'nfl'): Promise<RealTVProgram[]> {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      const response = await fetch(
        `${TV_SCHEDULE_APIS.espn.baseUrl}/${sport}/scoreboard?dates=${today}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformESPNData(data, sport);
      
    } catch (error) {
      // Use silent error for sports data failures
      handleSilentError(error as Error, {
        operation: 'getLiveSportsData',
        sport
      });
      return [];
    }
  }

  /**
   * Fetch from Gracenote/TMS API (Premium)
   */
  private async fetchFromGracenote(channelName: string): Promise<RealChannelSchedule> {
    if (!this.apiKeys.gracenote) {
      throw new Error('Gracenote API key not configured');
    }

    try {
      const location = await locationService.getUserLocation();
      const stationId = this.getGracenoteStationId(channelName, location);
      
      // Get today's schedule
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const response = await fetch(
        `${TV_SCHEDULE_APIS.gracenote.baseUrl}/programs/schedule/${stationId}?` +
        `startDateTime=${today.toISOString()}&endDateTime=${tomorrow.toISOString()}`,
        {
          headers: {
            'x-api-key': this.apiKeys.gracenote,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Gracenote API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformGracenoteData(data, channelName);
      
    } catch (error) {
      // Don't handle error here - let the caller handle it
      throw error;
    }
  }

  /**
   * Try alternative APIs when primary fails
   */
  private async tryAlternativeAPIs(channelName: string): Promise<RealChannelSchedule> {
    const errors: Error[] = [];

    // Try EPG.best
    if (this.apiKeys.epgBest) {
      try {
        return await this.fetchFromEPGBest(channelName);
      } catch (error) {
        errors.push(error as Error);
        // Silent log for individual API failure
        handleSilentError(error as Error, {
          operation: 'fetchFromEPGBest',
          channelName
        });
      }
    }

    // Try TVMaze (free)
    try {
      return await this.fetchFromTVMaze(channelName);
    } catch (error) {
      errors.push(error as Error);
      // Silent log for individual API failure
      handleSilentError(error as Error, {
        operation: 'fetchFromTVMaze',
        channelName
      });
    }

    // If all APIs fail, throw the last error
    throw errors[errors.length - 1] || new Error('All TV schedule APIs failed');
  }

  /**
   * Fetch from EPG.best API
   */
  private async fetchFromEPGBest(channelName: string): Promise<RealChannelSchedule> {
    if (!this.apiKeys.epgBest) {
      throw new Error('EPG.best API key not configured');
    }

    const location = await locationService.getUserLocation();
    const channelId = this.getEPGBestChannelId(channelName, location);
    
    const response = await fetch(
      `${TV_SCHEDULE_APIS.epgBest.baseUrl}/epg/${channelId}?days=1`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.epgBest}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`EPG.best API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformEPGBestData(data, channelName);
  }

  /**
   * Fetch from TVMaze (free alternative)
   */
  private async fetchFromTVMaze(channelName: string): Promise<RealChannelSchedule> {
    const location = await locationService.getUserLocation();
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `${TV_SCHEDULE_APIS.tvmaze.baseUrl}/schedule?country=${location.country}&date=${today}`
    );

    if (!response.ok) {
      throw new Error(`TVMaze API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformTVMazeData(data, channelName);
  }

  // Data transformation methods
  private transformGracenoteData(data: any, channelName: string): RealChannelSchedule {
    const now = new Date();
    const programs: RealTVProgram[] = [];
    
    if (data.programs && Array.isArray(data.programs)) {
      for (const program of data.programs) {
        const startTime = new Date(program.startTime);
        const endTime = new Date(program.endTime);
        
        programs.push({
          id: program.programId || `gracenote-${startTime.getTime()}`,
          title: program.title || 'Unknown Program',
          description: program.shortDescription || program.longDescription || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
          category: this.mapGracenoteCategory(program.categories),
          network: channelName,
          channelCallSign: channelName,
          isLive: startTime <= now && endTime > now,
          isNew: program.new === true,
          rating: program.ratings?.[0]?.code,
          imageUrl: program.preferredImage?.uri,
          episodeInfo: program.episodeNum ? {
            season: program.seasonNum,
            episode: program.episodeNum,
            episodeTitle: program.episodeTitle
          } : undefined
        });
      }
    }

    return {
      channelName,
      channelNumber: this.getChannelNumber(channelName),
      network: channelName,
      current: programs.find(p => p.isLive),
      upcoming: programs.filter(p => !p.isLive).slice(0, 10),
      lastUpdated: new Date().toISOString(),
      dataSource: 'Gracenote'
    };
  }

  private transformEPGBestData(data: any, channelName: string): RealChannelSchedule {
    const now = new Date();
    const programs: RealTVProgram[] = [];
    
    if (data.programmes && Array.isArray(data.programmes)) {
      for (const programme of data.programmes) {
        const startTime = new Date(programme.start);
        const endTime = new Date(programme.stop);
        
        programs.push({
          id: `epgbest-${programme.start}-${channelName}`,
          title: programme.title?.text || 'Unknown Program',
          description: programme.desc?.text || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
          category: programme.category?.text || 'general',
          network: channelName,
          channelCallSign: channelName,
          isLive: startTime <= now && endTime > now,
          isNew: false,
          imageUrl: programme.icon?.src
        });
      }
    }

    return {
      channelName,
      channelNumber: this.getChannelNumber(channelName),
      network: channelName,
      current: programs.find(p => p.isLive),
      upcoming: programs.filter(p => !p.isLive).slice(0, 10),
      lastUpdated: new Date().toISOString(),
      dataSource: 'EPG.best'
    };
  }

  private transformTVMazeData(data: any, channelName: string): RealChannelSchedule {
    const now = new Date();
    const programs: RealTVProgram[] = [];
    
    // Filter data for the specific channel/network
    const channelPrograms = data.filter((episode: any) => 
      episode.show?.network?.name?.toLowerCase().includes(channelName.toLowerCase()) ||
      episode.show?.webChannel?.name?.toLowerCase().includes(channelName.toLowerCase())
    );
    
    for (const episode of channelPrograms) {
      const startTime = new Date(episode.airtime);
      const duration = episode.runtime || 60;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      programs.push({
        id: `tvmaze-${episode.id}`,
        title: episode.name || episode.show?.name || 'Unknown Program',
        description: episode.summary?.replace(/<[^>]*>/g, '') || '',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        category: episode.show?.genres?.[0]?.toLowerCase() || 'general',
        network: channelName,
        channelCallSign: channelName,
        isLive: startTime <= now && endTime > now,
        isNew: true,
        episodeInfo: episode.season && episode.number ? {
          season: episode.season,
          episode: episode.number,
          episodeTitle: episode.name
        } : undefined,
        imageUrl: episode.image?.original
      });
    }

    return {
      channelName,
      channelNumber: this.getChannelNumber(channelName),
      network: channelName,
      current: programs.find(p => p.isLive),
      upcoming: programs.filter(p => !p.isLive).slice(0, 10),
      lastUpdated: new Date().toISOString(),
      dataSource: 'TVMaze'
    };
  }

  private transformESPNData(data: any, sport: string): RealTVProgram[] {
    const programs: RealTVProgram[] = [];
    const now = new Date();
    
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        const startTime = new Date(event.date);
        const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // Assume 3 hours
        
        const homeTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');
        
        programs.push({
          id: `espn-${event.id}`,
          title: event.name || 'Live Sports',
          description: event.shortName || event.name || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: 180,
          category: 'sports',
          subcategory: sport,
          network: 'ESPN',
          channelCallSign: 'ESPN',
          isLive: startTime <= now && endTime > now,
          isNew: true,
          matchup: homeTeam && awayTeam ? {
            homeTeam: homeTeam.team?.displayName || 'Home',
            awayTeam: awayTeam.team?.displayName || 'Away'
          } : undefined,
          score: homeTeam && awayTeam ? {
            home: parseInt(homeTeam.score) || 0,
            away: parseInt(awayTeam.score) || 0
          } : undefined,
          gameState: {
            period: event.status?.type?.shortDetail || 'Live',
            time: event.status?.displayClock || ''
          },
          league: sport.toUpperCase()
        });
      }
    }

    return programs;
  }

  // Helper methods
  private normalizeChannelName(channelName: string): string {
    const normalized = channelName.trim().toLowerCase();
    
    const channelMap: Record<string, string> = {
      'cbs': 'CBS',
      'nbc': 'NBC',
      'abc': 'ABC',
      'fox': 'FOX',
      'cnn': 'CNN',
      'espn': 'ESPN',
      'hgtv': 'HGTV',
      'food network': 'Food Network',
      'discovery': 'Discovery',
      'tlc': 'TLC',
      'amc': 'AMC',
      'fx': 'FX',
      'usa': 'USA',
      'tnt': 'TNT',
      'tbs': 'TBS'
    };
    
    return channelMap[normalized] || channelName;
  }

  private getGracenoteStationId(channelName: string, location: LocationData): string {
    // Station ID mapping for Gracenote API
    const stationMap: Record<string, Record<string, string>> = {
      'US': {
        'CBS': '10239',
        'NBC': '10098',
        'ABC': '10021',
        'FOX': '11867',
        'CNN': '10142',
        'ESPN': '11135',
        'HGTV': '14902',
        'Food Network': '12131'
      }
    };
    
    return stationMap[location.country]?.[channelName] || channelName.toLowerCase().replace(/\s+/g, '-');
  }

  private getEPGBestChannelId(channelName: string, location: LocationData): string {
    // Channel ID mapping for EPG.best API
    const channelMap: Record<string, string> = {
      'CBS': 'cbs-hd',
      'NBC': 'nbc-hd',
      'ABC': 'abc-hd',
      'FOX': 'fox-hd',
      'CNN': 'cnn',
      'ESPN': 'espn'
    };
    
    return channelMap[channelName] || channelName.toLowerCase().replace(/\s+/g, '-');
  }

  private getChannelNumber(channelName: string): string {
    const channelNumbers: Record<string, string> = {
      'CBS': '2.1',
      'NBC': '4.1',
      'ABC': '7.1',
      'FOX': '5.1',
      'CNN': '202',
      'ESPN': '206',
      'HGTV': '229',
      'Food Network': '231'
    };
    
    return channelNumbers[channelName] || '999';
  }

  private mapGracenoteCategory(categories: any[]): string {
    if (!categories?.length) return 'general';
    
    const genreMap: Record<string, string> = {
      'Sports': 'sports',
      'News': 'news',
      'Comedy': 'comedy',
      'Drama': 'drama',
      'Action': 'action',
      'Documentary': 'documentary',
      'Reality': 'reality',
      'Children': 'family',
      'Music': 'music',
      'Talk': 'talk'
    };
    
    const category = categories[0];
    return genreMap[category] || 'general';
  }

  private generateEnhancedFallback(channelName: string): RealChannelSchedule {
    // Generate enhanced realistic schedule when APIs fail
    const now = new Date();
    const programs: RealTVProgram[] = [];
    
    // Generate 12 hours of programming
    for (let i = 0; i < 12; i++) {
      const startTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      programs.push({
        id: `fallback-${channelName}-${startTime.getTime()}`,
        title: `${channelName} Programming`,
        description: `Regular programming on ${channelName}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: 60,
        category: this.getChannelType(channelName),
        network: channelName,
        channelCallSign: channelName,
        isLive: i === 0,
        isNew: false
      });
    }

    return {
      channelName,
      channelNumber: this.getChannelNumber(channelName),
      network: channelName,
      current: programs[0],
      upcoming: programs.slice(1),
      lastUpdated: new Date().toISOString(),
      dataSource: 'Enhanced Fallback'
    };
  }

  private getChannelType(channelName: string): string {
    const typeMap: Record<string, string> = {
      'ESPN': 'sports',
      'CNN': 'news',
      'Food Network': 'cooking',
      'HGTV': 'lifestyle',
      'Discovery': 'documentary',
      'Comedy Central': 'comedy'
    };
    
    return typeMap[channelName] || 'general';
  }

  /**
   * Clear cache - useful for testing
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get supported networks with real API integration
   */
  getSupportedNetworks(): string[] {
    return [
      'CBS', 'NBC', 'ABC', 'FOX', 'CNN', 'ESPN', 'HGTV', 'Food Network',
      'Discovery', 'TLC', 'AMC', 'FX', 'USA', 'TNT', 'TBS', 'Comedy Central',
      'Lifetime', 'Hallmark Channel', 'Ion'
    ];
  }
}

export const realTVScheduleService = RealTVScheduleService.getInstance(); 