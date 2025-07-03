import { handleAsyncError } from './errorHandler';
import { locationService } from './locationService';
import type { LocationData } from './locationService';
import { SportsTeam } from '../types/liveEvents';

// Real TV schedule APIs
const TV_GUIDE_APIS = {
  // Primary: Gracenote (TiVo) API - requires key
  gracenote: {
    baseUrl: 'https://api.gracenote.com/tms/v1.1',
    requiresAuth: true
  },
  // Secondary: TMS API (Gracenote) - requires key  
  tms: {
    baseUrl: 'https://api.tmsapi.com/v1.1',
    requiresAuth: true
  },
  // Fallback: Open TV API (limited but free)
  openTv: {
    baseUrl: 'https://api.tvmaze.com',
    requiresAuth: false
  },
  // Another fallback: EPG API
  epg: {
    baseUrl: 'https://epg.best/api',
    requiresAuth: false
  }
};

// Enhanced types for real TV data
export interface TVProgram {
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
    homeTeam: SportsTeam;
    awayTeam: SportsTeam;
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

export interface SportsTeam {
  name: string;
  abbreviation: string;
  logo?: string;
  record?: string;
}

export interface ChannelInfo {
  stationId: string;
  callSign: string;
  channel: string;
  network?: string;
  logo?: string;
  preferredImage?: {
    uri: string;
    width: string;
    height: string;
    category: string;
  };
}

export interface TVSchedule {
  channel: ChannelInfo;
  programs: TVProgram[];
  lastUpdated: string;
}

export interface TVGuideData {
  schedules: TVSchedule[];
  location: LocationData;
  timezone: string;
  lastUpdated: string;
  dataSource: string;
}

// Real programming schedules based on actual TV patterns
interface ProgrammingBlock {
  startHour: number;
  endHour: number;
  programs: {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    duration: number; // in minutes
    isLive?: boolean;
    rating?: string;
    imageUrl?: string;
    
    // Sports-specific fields
    matchup?: {
      homeTeam: SportsTeam;
      awayTeam: SportsTeam;
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
  }[];
}

// Comprehensive programming schedules for major networks
const NETWORK_SCHEDULES: Record<string, ProgrammingBlock[]> = {
  'ESPN': [
    {
      startHour: 6,
      endHour: 10,
      programs: [
        {
          title: 'SportsCenter',
          description: 'The latest sports news, highlights, and analysis from around the world.',
          category: 'sports',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 10,
      endHour: 12,
      programs: [
        {
          title: 'Get Up',
          description: 'Morning sports talk show with Mike Greenberg.',
          category: 'sports',
          subcategory: 'talk',
          duration: 120,
          isLive: true
        }
      ]
    },
    {
      startHour: 12,
      endHour: 15,
      programs: [
        {
          title: 'SportsCenter',
          description: 'Midday sports news and highlights.',
          category: 'sports',
          duration: 60,
          isLive: true
        },
        {
          title: 'NFL Live',
          description: 'The latest NFL news and analysis.',
          category: 'sports',
          subcategory: 'football',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 15,
      endHour: 19,
      programs: [
        {
          title: 'Around the Horn',
          description: 'Sports debate show with Tony Reali.',
          category: 'sports',
          subcategory: 'talk',
          duration: 30,
          isLive: true
        },
        {
          title: 'Pardon the Interruption',
          description: 'Sports talk show with Tony Kornheiser and Michael Wilbon.',
          category: 'sports',
          subcategory: 'talk',
          duration: 30,
          isLive: true
        },
        {
          title: 'SportsCenter',
          description: 'Evening sports news and highlights.',
          category: 'sports',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 19,
      endHour: 22,
      programs: [
        {
          title: 'Monday Night Football',
          description: 'Live NFL game coverage with expert commentary.',
          category: 'sports',
          subcategory: 'football',
          duration: 180,
          isLive: true
        },
        {
          title: 'NBA Tonight',
          description: 'Live NBA game coverage.',
          category: 'sports',
          subcategory: 'basketball',
          duration: 150,
          isLive: true
        },
        {
          title: 'College GameDay',
          description: 'College football analysis and highlights.',
          category: 'sports',
          subcategory: 'college football',
          duration: 120,
          isLive: true
        }
      ]
    }
  ],
  'ESPN2': [
    {
      startHour: 6,
      endHour: 10,
      programs: [
        {
          title: 'SportsCenter',
          description: 'The latest sports news and highlights.',
          category: 'sports',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 10,
      endHour: 14,
      programs: [
        {
          title: 'First Take',
          description: 'Sports debate show with Stephen A. Smith and Max Kellerman.',
          category: 'sports',
          subcategory: 'talk',
          duration: 120,
          isLive: true
        }
      ]
    },
    {
      startHour: 14,
      endHour: 18,
      programs: [
        {
          title: 'SportsCenter',
          description: 'Afternoon sports news and highlights.',
          category: 'sports',
          duration: 60,
          isLive: true
        },
        {
          title: 'NFL Live',
          description: 'NFL news and analysis.',
          category: 'sports',
          subcategory: 'football',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 18,
      endHour: 22,
      programs: [
        {
          title: 'College Basketball',
          description: 'Live college basketball game coverage.',
          category: 'sports',
          subcategory: 'college basketball',
          duration: 150,
          isLive: true
        },
        {
          title: 'NBA Tonight',
          description: 'NBA game coverage and analysis.',
          category: 'sports',
          subcategory: 'basketball',
          duration: 120,
          isLive: true
        }
      ]
    }
  ],
  'CNN': [
    {
      startHour: 5,
      endHour: 9,
      programs: [
        {
          title: 'CNN This Morning',
          description: 'Start your day with breaking news and analysis.',
          category: 'news',
          subcategory: 'morning news',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 9,
      endHour: 16,
      programs: [
        {
          title: 'CNN Newsroom',
          description: 'Live breaking news coverage and analysis.',
          category: 'news',
          duration: 60,
          isLive: true
        },
        {
          title: 'At This Hour',
          description: 'Kate Bolduan brings you the latest news.',
          category: 'news',
          duration: 60,
          isLive: true
        },
        {
          title: 'Inside Politics',
          description: 'Political news and analysis with John King.',
          category: 'news',
          subcategory: 'politics',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 16,
      endHour: 20,
      programs: [
        {
          title: 'The Lead with Jake Tapper',
          description: 'In-depth coverage of the day\'s top stories.',
          category: 'news',
          duration: 60,
          isLive: true
        },
        {
          title: 'The Situation Room',
          description: 'Wolf Blitzer reports on breaking news.',
          category: 'news',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 20,
      endHour: 24,
      programs: [
        {
          title: 'Anderson Cooper 360°',
          description: 'In-depth analysis of the day\'s biggest stories.',
          category: 'news',
          duration: 60,
          isLive: true
        }
      ]
    }
  ],
  'FOX News': [
    {
      startHour: 6,
      endHour: 10,
      programs: [
        {
          title: 'FOX & Friends',
          description: 'Morning news and talk show.',
          category: 'news',
          subcategory: 'morning news',
          duration: 120,
          isLive: true
        }
      ]
    },
    {
      startHour: 10,
      endHour: 16,
      programs: [
        {
          title: 'America\'s Newsroom',
          description: 'Live news coverage and analysis.',
          category: 'news',
          duration: 60,
          isLive: true
        },
        {
          title: 'Outnumbered',
          description: 'News discussion with rotating panel.',
          category: 'news',
          subcategory: 'talk',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 16,
      endHour: 20,
      programs: [
        {
          title: 'The Five',
          description: 'News and opinion discussion show.',
          category: 'news',
          subcategory: 'talk',
          duration: 60,
          isLive: true
        },
        {
          title: 'Special Report',
          description: 'Bret Baier reports on the day\'s top stories.',
          category: 'news',
          duration: 60,
          isLive: true
        }
      ]
    },
    {
      startHour: 20,
      endHour: 24,
      programs: [
        {
          title: 'Tucker Carlson Tonight',
          description: 'Political commentary and analysis.',
          category: 'news',
          subcategory: 'politics',
          duration: 60,
          isLive: true
        }
      ]
    }
  ],

};

// Special event programming that can override regular schedules
const SPECIAL_EVENTS: Record<string, any[]> = {
  'ESPN': [
    {
      title: 'Monday Night Football: Chiefs vs Bills',
      description: 'Live NFL game between Kansas City Chiefs and Buffalo Bills.',
      category: 'sports',
      subcategory: 'football',
      duration: 180,
      isLive: true,
      dayOfWeek: 1, // Monday
      startHour: 20
    },
    {
      title: 'NBA Finals Game 7',
      description: 'Championship deciding game between conference champions.',
      category: 'sports',
      subcategory: 'basketball',
      duration: 180,
      isLive: true,
      month: 6 // June
    },
    {
      title: 'College Football Playoff',
      description: 'Semi-final game determining national championship participants.',
      category: 'sports',
      subcategory: 'college football',
      duration: 240,
      isLive: true,
      month: 1 // January
    }
  ],
  'ABC': [
    {
      title: 'The Oscars',
      description: 'Academy Awards ceremony honoring the best films of the year.',
      category: 'awards',
      subcategory: 'film awards',
      duration: 240,
      isLive: true,
      month: 3 // March
    },
    {
      title: 'American Music Awards',
      description: 'Annual awards show celebrating popular music.',
      category: 'awards',
      subcategory: 'music awards',
      duration: 180,
      isLive: true,
      month: 11 // November
    }
  ],
  'CBS': [
    {
      title: 'Grammy Awards',
      description: 'Music\'s biggest night celebrating the best recordings.',
      category: 'awards',
      subcategory: 'music awards',
      duration: 240,
      isLive: true,
      month: 2 // February
    },
    {
      title: 'Super Bowl LVIII',
      description: 'NFL Championship game with halftime show.',
      category: 'sports',
      subcategory: 'football',
      duration: 240,
      isLive: true,
      month: 2, // February
      dayOfMonth: 11
    }
  ],
  'NBC': [
    {
      title: 'Golden Globe Awards',
      description: 'Hollywood Foreign Press Association honors film and TV.',
      category: 'awards',
      subcategory: 'film and tv awards',
      duration: 180,
      isLive: true,
      month: 1 // January
    },
    {
      title: 'Olympics Opening Ceremony',
      description: 'Live coverage of the Olympic Games opening ceremony.',
      category: 'ceremonies',
      subcategory: 'olympic ceremony',
      duration: 240,
      isLive: true
    }
  ]
};

class TVGuideService {
  private cache = new Map<string, { data: TVGuideData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly apiKey: string | null = null; // Would be set from environment

  constructor() {
    // Try to get API key from environment
    this.apiKey = import.meta.env.VITE_TV_GUIDE_API_KEY || null;
  }

  /**
   * Get TV guide data for user's location
   */
  async getTVGuide(location?: LocationData): Promise<TVGuideData> {
    try {
      // Get user location if not provided
      const userLocation = location || await locationService.getUserLocation();
      const cacheKey = `${userLocation.zip}_${userLocation.timezone}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      let tvGuideData: TVGuideData;

      // Try real APIs first
      if (this.apiKey) {
        tvGuideData = await this.fetchRealTVData(userLocation);
      } else {
        // Fall back to enhanced realistic mock data
        tvGuideData = await this.generateRealisticTVData(userLocation);
      }

      // Cache the result
      this.cache.set(cacheKey, { data: tvGuideData, timestamp: Date.now() });
      
      return tvGuideData;
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'getTVGuide',
        location: location?.city
      });
      
      // Return fallback data
      return this.getFallbackTVData();
    }
  }

  /**
   * Fetch real TV data from API services
   */
  private async fetchRealTVData(location: LocationData): Promise<TVGuideData> {
    const errors: Error[] = [];

    // Try Gracenote/TMS API first (requires subscription but most accurate)
    if (this.apiKey) {
      try {
        return await this.fetchFromGracenote(location);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // Try free alternatives
    try {
      return await this.fetchFromTVMaze(location);
    } catch (error) {
      errors.push(error as Error);
    }

    // If all APIs fail, throw the last error
    throw errors[errors.length - 1] || new Error('All TV guide APIs failed');
  }

  /**
   * Fetch from Gracenote/TMS API (premium service)
   */
  private async fetchFromGracenote(location: LocationData): Promise<TVGuideData> {
    const baseUrl = TV_GUIDE_APIS.gracenote.baseUrl;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get lineup for zip code
      const lineupResponse = await fetch(
        `${baseUrl}/lineups?postalCode=${location.zip}&country=${location.country}`,
        {
          headers: {
            'x-api-key': this.apiKey!
          }
        }
      );

      if (!lineupResponse.ok) {
        throw new Error(`Gracenote lineup API failed: ${lineupResponse.status}`);
      }

      const lineupData = await lineupResponse.json();
      const lineup = lineupData[0]; // Use first available lineup

      // Get grid schedule for today
      const gridResponse = await fetch(
        `${baseUrl}/lineups/${lineup.lineup}/grid?startDateTime=${today}T00:00:00Z&endDateTime=${today}T23:59:59Z`,
        {
          headers: {
            'x-api-key': this.apiKey!
          }
        }
      );

      if (!gridResponse.ok) {
        throw new Error(`Gracenote grid API failed: ${gridResponse.status}`);
      }

      const gridData = await gridResponse.json();
      
      return this.transformGracenoteData(gridData, location);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'fetchFromGracenote',
        zip: location.zip
      });
      throw error;
    }
  }

  /**
   * Fetch from TVMaze API (free but limited)
   */
  private async fetchFromTVMaze(location: LocationData): Promise<TVGuideData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // TVMaze doesn't have regional programming, so we get generic schedule
      const response = await fetch(
        `${TV_GUIDE_APIS.openTv.baseUrl}/schedule?date=${today}&country=${location.country}`
      );

      if (!response.ok) {
        throw new Error(`TVMaze API failed: ${response.status}`);
      }

      const scheduleData = await response.json();
      
      return this.transformTVMazeData(scheduleData, location);
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'fetchFromTVMaze',
        country: location.country
      });
      throw error;
    }
  }

  /**
   * Transform Gracenote API response to our format
   */
  private transformGracenoteData(data: any, location: LocationData): TVGuideData {
    const schedules: TVSchedule[] = [];

    for (const station of data.stations) {
      const channel: ChannelInfo = {
        stationId: station.stationId,
        callSign: station.callSign,
        channel: station.channel || station.virtualChannel,
        network: station.affiliate,
        preferredImage: station.logo ? {
          uri: station.logo.URL,
          width: station.logo.width,
          height: station.logo.height,
          category: 'logo'
        } : undefined
      };

      const programs: TVProgram[] = [];
      
      for (const airing of station.airings || []) {
        programs.push(this.transformGracenoteProgram(airing, channel.callSign));
      }

      schedules.push({
        channel,
        programs,
        lastUpdated: new Date().toISOString()
      });
    }

    return {
      schedules,
      location,
      timezone: location.timezone,
      lastUpdated: new Date().toISOString(),
      dataSource: 'Gracenote'
    };
  }

  /**
   * Transform TVMaze API response to our format
   */
  private transformTVMazeData(data: any, location: LocationData): TVGuideData {
    const schedules: TVSchedule[] = [];
    const channelMap = new Map<string, TVSchedule>();

    for (const episode of data) {
      if (!episode.show?.network?.name) continue;

      const networkName = episode.show.network.name;
      
      if (!channelMap.has(networkName)) {
        const channel: ChannelInfo = {
          stationId: networkName.toLowerCase().replace(/\s+/g, '-'),
          callSign: networkName,
          channel: this.getChannelNumber(networkName),
          network: networkName,
          preferredImage: episode.show.network.image ? {
            uri: episode.show.network.image.original,
            width: '100',
            height: '100',
            category: 'logo'
          } : undefined
        };

        channelMap.set(networkName, {
          channel,
          programs: [],
          lastUpdated: new Date().toISOString()
        });
      }

      const schedule = channelMap.get(networkName)!;
      schedule.programs.push(this.transformTVMazeProgram(episode, networkName));
    }

    return {
      schedules: Array.from(channelMap.values()),
      location,
      timezone: location.timezone,
      lastUpdated: new Date().toISOString(),
      dataSource: 'TVMaze'
    };
  }

  /**
   * Transform individual Gracenote program
   */
  private transformGracenoteProgram(airing: any, callSign: string): TVProgram {
    const program = airing.program;
    const startTime = new Date(airing.startTime);
    const endTime = new Date(airing.endTime);
    const now = new Date();

    return {
      id: `${program.tmsId}_${airing.startTime}`,
      title: program.title,
      description: program.shortDescription || program.longDescription || '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
      category: this.mapGracenoteCategory(program.categories),
      network: callSign,
      channelCallSign: callSign,
      isLive: startTime <= now && endTime > now,
      isNew: airing.new === true,
      rating: program.ratings?.[0]?.code,
      imageUrl: program.preferredImage?.uri,
      episodeInfo: program.episodeNum ? {
        season: program.seasonNum,
        episode: program.episodeNum,
        episodeTitle: program.episodeTitle
      } : undefined
    };
  }

  /**
   * Transform individual TVMaze program
   */
  private transformTVMazeProgram(episode: any, networkName: string): TVProgram {
    const airtime = new Date(episode.airtime);
    const duration = episode.runtime || 60; // Default to 60 minutes
    const endTime = new Date(airtime.getTime() + duration * 60000);
    const now = new Date();

    return {
      id: `${episode.id}_${episode.airtime}`,
      title: episode.name,
      description: episode.summary?.replace(/<[^>]*>/g, '') || '',
      startTime: airtime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      category: this.mapTVMazeCategory(episode.show.genres),
      network: networkName,
      channelCallSign: networkName,
      isLive: airtime <= now && endTime > now,
      isNew: true, // TVMaze doesn't provide this info
      imageUrl: episode.image?.original,
      episodeInfo: {
        season: episode.season,
        episode: episode.number,
        episodeTitle: episode.name
      }
    };
  }

  /**
   * Generate realistic TV data when real APIs aren't available
   */
  private async generateRealisticTVData(location: LocationData): Promise<TVGuideData> {
    const schedules: TVSchedule[] = [];
    const channels = this.getPopularChannels(location.country);

    for (const channelInfo of channels) {
      const programs = this.generateRealisticPrograms(channelInfo.callSign, location.timezone);
      
      schedules.push({
        channel: channelInfo,
        programs,
        lastUpdated: new Date().toISOString()
      });
    }

    return {
      schedules,
      location,
      timezone: location.timezone,
      lastUpdated: new Date().toISOString(),
      dataSource: 'Realistic Mock Data'
    };
  }

  /**
   * Generate realistic programs for a network
   */
  private generateRealisticPrograms(network: string, timezone: string): TVProgram[] {
    const programs: TVProgram[] = [];
    const now = new Date();
    const programmingBlocks = NETWORK_SCHEDULES[network] || this.getGenericProgramming();

    // Generate 24 hours of programming
    for (let hour = 0; hour < 24; hour++) {
      const currentTime = new Date(now);
      currentTime.setHours(hour, 0, 0, 0);

      // Find appropriate programming block
      const block = programmingBlocks.find(b => 
        hour >= b.startHour && hour < b.endHour
      ) || programmingBlocks[0];

      const program = this.generateRealisticProgram(network, network, currentTime, timezone);
      programs.push(program);
    }

    return programs;
  }

  private generateRealisticProgram(network: string, callSign: string, startTime: Date, timezone: string): TVProgram {
    const now = new Date();
    const programmingBlocks = NETWORK_SCHEDULES[network];
    
    if (!programmingBlocks) {
      return this.generateGenericProgram(callSign, startTime);
    }

    const hour = startTime.getHours();
    const block = programmingBlocks.find(b => hour >= b.startHour && hour < b.endHour);
    
    if (!block || block.programs.length === 0) {
      return this.generateGenericProgram(callSign, startTime);
    }

    const programIndex = Math.floor(Math.random() * block.programs.length);
    const selectedProgram = block.programs[programIndex];
    
    const endTime = new Date(startTime.getTime() + selectedProgram.duration * 60000);
    const isLive = !!(startTime <= now && endTime > now && selectedProgram.isLive);
    
    // Add current date context to titles for news shows
    let title = selectedProgram.title;
    if (selectedProgram.category === 'news' && isLive) {
      const dateStr = startTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      title = `${selectedProgram.title} - ${dateStr}`;
    }
    
    return {
      id: `${callSign}-${startTime.getTime()}`,
      title,
      description: selectedProgram.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: selectedProgram.duration,
      category: selectedProgram.category,
      subcategory: selectedProgram.subcategory,
      network,
      channelCallSign: callSign,
      isLive,
      isNew: Math.random() > 0.7,
      rating: selectedProgram.rating,
      imageUrl: selectedProgram.imageUrl || this.getImageForCategory(selectedProgram.category),
      matchup: selectedProgram.matchup,
      score: selectedProgram.score,
      gameState: selectedProgram.gameState,
      league: selectedProgram.league
    };
  }

  // Helper methods
  private getPopularChannels(country: string): ChannelInfo[] {
    const baseChannels = [
      { stationId: 'cbs', callSign: 'CBS', channel: '2.1', network: 'CBS' },
      { stationId: 'nbc', callSign: 'NBC', channel: '4.1', network: 'NBC' },
      { stationId: 'abc', callSign: 'ABC', channel: '7.1', network: 'ABC' },
      { stationId: 'fox', callSign: 'FOX', channel: '5.1', network: 'FOX' },
      { stationId: 'cnn', callSign: 'CNN', channel: '202', network: 'CNN' },
      { stationId: 'espn', callSign: 'ESPN', channel: '206', network: 'ESPN' },
      { stationId: 'hgtv', callSign: 'HGTV', channel: '229', network: 'HGTV' },
      { stationId: 'food', callSign: 'Food Network', channel: '231', network: 'Food Network' }
    ];

    return baseChannels.map(ch => ({
      ...ch,
      preferredImage: {
        uri: `https://logos-world.net/wp-content/uploads/2020/04/${ch.callSign.toLowerCase()}-logo.png`,
        width: '100',
        height: '100',
        category: 'logo'
      }
    }));
  }

  private getChannelNumber(networkName: string): string {
    const channelMap: Record<string, string> = {
      'CBS': '2.1', 'NBC': '4.1', 'ABC': '7.1', 'FOX': '5.1',
      'CNN': '202', 'ESPN': '206', 'HGTV': '229', 'Food Network': '231'
    };
    return channelMap[networkName] || '999';
  }

  private mapGracenoteCategory(categories: any[]): string {
    if (!categories?.length) return 'entertainment';
    const category = categories[0];
    return category.toLowerCase();
  }

  private mapTVMazeCategory(genres: string[]): string {
    if (!genres?.length) return 'entertainment';
    return genres[0].toLowerCase();
  }

  private getImageForCategory(category: string): string {
    const imageMap: Record<string, string> = {
      'sports': 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Sports',
      'news': 'https://via.placeholder.com/300x200/dc2626/ffffff?text=News',
      'comedy': 'https://via.placeholder.com/300x200/059669/ffffff?text=Comedy',
      'drama': 'https://via.placeholder.com/300x200/7c2d12/ffffff?text=Drama'
    };
    return imageMap[category] || 'https://via.placeholder.com/300x200/6b7280/ffffff?text=TV';
  }

  private generateGenericProgram(callSign: string, startTime: Date): TVProgram {
    const duration = 60;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = new Date();

    return {
      id: `${callSign}-${startTime.getTime()}`,
      title: `${callSign} Programming`,
      description: `Regular programming on ${callSign}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      category: 'entertainment',
      network: callSign,
      channelCallSign: callSign,
      isLive: startTime <= now && endTime > now,
      isNew: false
    };
  }

  private getGenericProgramming(): ProgrammingBlock[] {
    return [
      {
        startHour: 0,
        endHour: 24,
        programs: [
          {
            title: 'Programming',
            description: 'Regular television programming',
            category: 'entertainment',
            duration: 60
          }
        ]
      }
    ];
  }

  private getFallbackTVData(): TVGuideData {
    return {
      schedules: [],
      location: { city: 'Unknown', state: 'Unknown', zip: '00000', country: 'US', timezone: 'America/New_York' },
      timezone: 'America/New_York',
      lastUpdated: new Date().toISOString(),
      dataSource: 'Fallback'
    };
  }
}

export const tvGuideService = new TVGuideService();