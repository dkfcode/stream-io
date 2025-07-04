import axios from 'axios';
import type { 
  SearchResult, StreamingService, VideoResult, EnhancedSearchResult, PersonResult, NetworkResult,
  TmdbProvider, TmdbMovie, TmdbTVShow, ActorTVShowEpisodeResult,
  TmdbResponse, 
  TmdbPerson, 
  TmdbGenre, 
  TmdbVideo, 
  TmdbSeason, 
  TmdbEpisode, 
  TmdbPersonCombinedCredits
} from '../types/tmdb';
import { handleError, handleAsyncError, handleNetworkError } from './errorHandler';

// TMDB API Configuration
const getAccessToken = (): string => {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
  console.log('🔑 TMDB getAccessToken called');
  console.log('🔑 Environment check:', {
    hasImportMeta: typeof import.meta !== 'undefined',
    hasEnv: typeof import.meta.env !== 'undefined',
    tokenExists: !!token,
    tokenLength: token?.length || 0,
    tokenStart: token?.substring(0, 20) || 'undefined'
  });
  
  if (!token || token.trim() === '') {
    console.error('❌ TMDB Access Token is not configured or empty');
    console.error('   Environment variables:', {
      NODE_ENV: import.meta.env.MODE,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      allEnvKeys: Object.keys(import.meta.env)
    });
    throw new Error('TMDB Access Token is not configured. Set VITE_TMDB_ACCESS_TOKEN in your environment variables');
  }
  
  console.log('✅ TMDB token found and ready');
  return token;
};

const TMDB_API_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  ACCESS_TOKEN: getAccessToken(), // Get token once at startup
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Note: Local streaming services configuration removed as it was unused

// Platform consolidation mapping - maps provider names to standardized names
const PLATFORM_CONSOLIDATION_MAP: Record<string, string> = {
  // Netflix variants
  'Netflix': 'Netflix',
  'Netflix Standard with Ads': 'Netflix',
  'Netflix Kids': 'Netflix',
  
  // Amazon variants
  'Amazon Prime Video': 'Amazon Prime Video',
  'Amazon Prime Video with Ads': 'Amazon Prime Video',
  'Amazon Video': 'Amazon Video', // Keep separate as this is purchase/rental
  
  // Apple variants
  'Apple TV': 'Apple TV', // Purchase/rental
  'Apple TV+': 'Apple TV+', // Streaming service
  'Apple TV Plus Amazon Channel': 'Apple TV+',
  
  // Google/YouTube variants
  'Google Play Movies': 'Google Play Movies',
  'YouTube': 'YouTube',
  'Youtube TV': 'YouTube TV',
  'YouTube Premium': 'YouTube Premium',
  
  // Paramount variants
  'Paramount Plus': 'Paramount+',
  'Paramount+ Amazon Channel': 'Paramount+',
  'Paramount Plus Apple TV Channel': 'Paramount+',
  'Paramount+ Roku Premium Channel': 'Paramount+',
  'Paramount+ with Showtime': 'Paramount+',
  'Paramount+ Originals Amazon Channel': 'Paramount+',
  'Paramount+ MTV Amazon Channel': 'Paramount+',
  
  // Peacock variants
  'Peacock Premium': 'Peacock Premium',
  'Peacock Premium Plus': 'Peacock Premium',
  
  // Max/HBO variants
  'Max': 'Max',
  'Max Amazon Channel': 'Max',
  'Max Originals Amazon Channel': 'Max',
  
  // Starz variants
  'Starz': 'Starz',
  'Starz Apple TV Channel': 'Starz',
  'Starz Amazon Channel': 'Starz',
  'Starz Roku Premium Channel': 'Starz',
  
  // AMC variants
  'AMC+': 'AMC+',
  'AMC+ Amazon Channel': 'AMC+',
  'AMC Plus Apple TV Channel': 'AMC+',
  'AMC+ Roku Premium Channel': 'AMC+',
  
  // Disney variants
  'Disney Plus': 'Disney+',
  'DisneyNOW': 'Disney+',
  
  // Hulu (keep as is)
  'Hulu': 'Hulu',
  
  // Discovery variants
  'Discovery+': 'Discovery+',
  'Discovery + Amazon Channel': 'Discovery+',
  'Discovery': 'Discovery+',
  
  // Crunchyroll variants
  'Crunchyroll': 'Crunchyroll',
  'Crunchyroll Amazon Channel': 'Crunchyroll',
  'Crunchyroll Apple TV Channel': 'Crunchyroll',
  
  // Shudder variants
  'Shudder': 'Shudder',
  'Shudder Amazon Channel': 'Shudder',
  'Shudder Apple TV Channel': 'Shudder',
  
  // MGM variants
  'MGM Plus': 'MGM+',
  'MGM+ Amazon Channel': 'MGM+',
  'MGM Plus Roku Premium Channel': 'MGM+',
  
  // BET variants
  'BET+': 'BET+',
  'Bet+': 'BET+',
  'Bet+ Amazon Channel': 'BET+',
  'BET+ Apple TV channel': 'BET+',
  
  // Cinemax variants
  'Cinemax Amazon Channel': 'Cinemax',
  'Cinemax Apple TV Channel': 'Cinemax',
  
  // HiDive variants
  'HiDive': 'HiDive',
  'Hidive Amazon Channel': 'HiDive',
  
  // BritBox variants
  'BritBox': 'BritBox',
  'BritBox Amazon Channel': 'BritBox',
  'Britbox Apple TV Channel': 'BritBox',
  
  // MUBI variants
  'MUBI': 'MUBI',
  'MUBI Amazon Channel': 'MUBI',
  
  // Acorn TV variants
  'Acorn TV': 'Acorn TV',
  'AcornTV Amazon Channel': 'Acorn TV',
  'Acorn TV Apple TV': 'Acorn TV',
  
  // History variants
  'History': 'History',
  'History Vault': 'History Vault',
  'HISTORY Vault Apple TV Channel': 'History Vault',
  'HISTORY Vault Amazon Channel': 'History Vault',
  
  // ALLBLK variants
  'ALLBLK': 'ALLBLK',
  'ALLBLK Apple TV channel': 'ALLBLK',
  'ALLBLK Amazon channel': 'ALLBLK',
  
  // Lifetime variants
  'Lifetime': 'Lifetime',
  'Lifetime Movie Club': 'Lifetime Movie Club',
  'Lifetime Movie Club Apple TV Channel': 'Lifetime Movie Club',
  'Lifetime Movie Club Amazon Channel': 'Lifetime Movie Club',
  
  // Other major platforms to keep
  'Fandango At Home': 'Fandango At Home',
  'Microsoft Store': 'Microsoft Store',
  'Spectrum On Demand': 'Spectrum On Demand',
  'fuboTV': 'fuboTV',
  'Plex': 'Plex',
  'Philo': 'Philo',
  'Criterion Channel': 'Criterion Channel',
  'Rakuten Viki': 'Rakuten Viki',
  'Kocowa': 'Kocowa',
  'OnDemandKorea': 'OnDemandKorea',
  'Sundance Now': 'Sundance Now',
  'Pure Flix': 'Pure Flix',
  'Kanopy': 'Kanopy',
  'Hoopla': 'Hoopla',
  'Tubi': 'Tubi',
  'FlixFling': 'FlixFling',
  'NBC': 'NBC',
  'USA Network': 'USA Network',
  'TBS': 'TBS',
  'TNT': 'TNT',
  'AMC': 'AMC',
  'Fox': 'Fox',
  'Adult Swim': 'Adult Swim',
  'Freeform': 'Freeform',
  'PBS': 'PBS',
  'Food Network': 'Food Network',
  'HGTV': 'HGTV',
  'Investigation Discovery': 'Investigation Discovery',
  'TLC': 'TLC',
  'Travel Channel': 'Travel Channel',
  'Science Channel': 'Science Channel',
  'A&E': 'A&E',
  'Bravo TV': 'Bravo',
  'VH1': 'VH1',
  'WeTV': 'WeTV',
  'OXYGEN': 'Oxygen',
  'TCM': 'TCM'
};

// Platforms to completely filter out (too niche or redundant)
const FILTERED_OUT_PLATFORMS = new Set([
  // Very niche Amazon channels
  'Warriors and Gangsters Amazon Channel',
  'Kartoon Channel Amazon Channel',
  'DocuramaFilms Amazon Channel',
  'Amebatv Amazon Channel',
  'Sensical Amazon Channel',
  'MZ Choice Amazon Channel',
  'RetroCrush Amazon Channel',
  'Monsters and Nightmares Amazon Channel',
  'Great American Pure Flix Amazon Channel',
  'Dove Amazon Channel',
  'PBS Kids Amazon Channel',
  'Planet Earth Amazon Channel',
  'IndiePix Unlimited Amazon Channel',
  'Qello Concerts by Stingray Amazon Channel',
  'PBS Living Amazon Channel',
  'Best tv ever Amazon Channel',
  'Hopster Amazon Channel',
  'Kidstream Amazon Channel',
  'Yipee Kids TV Amazon Channel',
  'Adultswim Amazon Channel',
  'Dekkoo Amazon Channel',
  'BFI Player Amazon Channel',
  'PBS Documentaries Amazon Channel',
  'Science Amazon Channel',
  'UP Faith & Family Amazon Channel',
  'Cartoon Network Amazon Channel',
  'Echoboom Amazon Channel',
  'Fuse+ Amazon Channel',
  'Viaplay Amazon Channel',
  'MTV Hits Amazon Channel',
  'IndieFlix Shorts Amazon Channel',
  'FilmBox Live Amazon Channel',
  'Noggin Amazon Channel',
  'Pinoy Box Office Amazon Channel',
  'The Great Courses Amazon Channel',
  'OWN Amazon Channel',
  'Broadway HD Amazon Channel',
  'REELZ Amazon Channel',
  'Here TV Amazon Channel',
  'Revry Amazon Channel',
  'Strand Releasing Amazon Channel',
  'Toku Amazon Channel',
  'Pongalo Amazon Channel',
  'Gaia Amazon Channel',
  'Cocina ON Amazon Channel',
  'Brown Sugar Amazon Channel',
  'Doki Amazon Channel',
  'Cinefest Amazon Channel',
  'CNN Max Amazon Channel',
  
  // Very niche Apple TV channels
  'Eros Now Select Apple TV Channel',
  'A&E Crime Central Apple TV Channel',
  'OUTtv Apple TV Channel',
  'UP Faith & Family Apple TV Channel',
  'CuriosityStream Apple TV Channel',
  'BBC Select Apple Tv channel',
  'IFC Films Unlimited Apple TV Channel',
  'Hallmark+ Apple TV Channel',
  'Tastemade Apple TV Channel',
  
  // Very small/niche platforms
  'VIX',
  'Xive TV Documentaries Amazon Channel',
  'Passionflix Amazon Channel',
  'Troma NOW',
  'Shahid VIP',
  'Retrocrush',
  'Cineverse',
  'Night Flight Plus',
  'Kino Film Collection',
  'OVID',
  'Fandor',
  'IndieFlix',
  'Magellan TV',
  'WOW Presents Plus',
  'Mhz Choice',
  'Angel Studios',
  'aha',
  'Film Movement Plus',
  'iQIYI',
  'FXNow',
  'Dekkoo',
  'GuideDoc',
  'Eternal Family',
  'BroadwayHD',
  'Univer Video',
  'Here TV',
  'Metrograph',
  'Eventive',
  'Vice TV',
  'The Oprah Winfrey Network',
  'Hoichoi',
  'MovieSaints',
  'ARROW',
  'Cranked Up TV',
  'Flix Premiere',
  'Sun Nxt',
  'FilmBox+',
  'AsianCrush',
  'Screambox',
  'Midnight Pulp',
  'FlixFling'
]);

// Network/Brand mapping for enhanced search
const NETWORK_BRAND_MAP: Record<string, { companies: number[], networks: number[], keywords: string[] }> = {
  'disney': {
    companies: [2, 3, 6125], // Walt Disney Pictures, Pixar, Walt Disney Animation Studios
    networks: [281, 287, 2739], // Disney Channel, Disney XD, Disney+
    keywords: ['disney', 'mickey mouse', 'pixar']
  },
  'nickelodeon': {
    companies: [13252], // Nickelodeon Productions
    networks: [13, 35, 1265], // Nickelodeon, Nick at Nite, Nick Jr.
    keywords: ['nickelodeon', 'spongebob', 'avatar']
  },
  'cartoon network': {
    companies: [1957], // Cartoon Network Studios
    networks: [56], // Cartoon Network
    keywords: ['cartoon network', 'adult swim']
  },
  'hbo': {
    companies: [49, 3268], // HBO, HBO Entertainment
    networks: [49], // HBO
    keywords: ['hbo', 'game of thrones', 'succession']
  },
  'netflix': {
    companies: [2552], // Netflix
    networks: [213], // Netflix
    keywords: ['netflix original']
  },
  'marvel': {
    companies: [420, 7505], // Marvel Studios, Marvel Entertainment
    networks: [],
    keywords: ['marvel', 'mcu', 'superhero']
  },
  'dc': {
    companies: [9993, 128064], // DC Entertainment, DC Films
    networks: [],
    keywords: ['dc comics', 'batman', 'superman']
  },
  'fox': {
    companies: [25, 127928], // 20th Century Fox, Fox Entertainment Group
    networks: [19], // FOX
    keywords: ['fox', '20th century']
  },
  'cw': {
    companies: [],
    networks: [71], // The CW
    keywords: ['cw', 'arrowverse']
  },
  'abc': {
    companies: [2],
    networks: [2], // ABC
    keywords: ['abc', 'disney abc']
  },
  'cbs': {
    companies: [51], // CBS Productions
    networks: [16], // CBS
    keywords: ['cbs']
  },
  'nbc': {
    companies: [10, 6810], // Universal Pictures, NBCUniversal
    networks: [6], // NBC
    keywords: ['nbc', 'universal']
  },
  'comedy central': {
    companies: [2806], // Comedy Central Films
    networks: [47], // Comedy Central
    keywords: ['comedy central', 'south park']
  },
  'mtv': {
    companies: [2806], // MTV Networks
    networks: [33], // MTV
    keywords: ['mtv']
  },
  'vh1': {
    companies: [],
    networks: [158], // VH1
    keywords: ['vh1']
  },
  'spike': {
    companies: [],
    networks: [55], // Spike
    keywords: ['spike tv']
  },
  'syfy': {
    companies: [],
    networks: [77], // Syfy
    keywords: ['syfy', 'sci-fi']
  },
  'tnt': {
    companies: [],
    networks: [41], // TNT
    keywords: ['tnt']
  },
  'tbs': {
    companies: [],
    networks: [68], // TBS
    keywords: ['tbs']
  },
  'adult swim': {
    companies: [11073], // Adult Swim
    networks: [10737], // Adult Swim
    keywords: ['adult swim', 'cartoon network']
  },
  'fx': {
    companies: [],
    networks: [88], // FX
    keywords: ['fx']
  },
  'freeform': {
    companies: [],
    networks: [1267], // Freeform
    keywords: ['freeform', 'abc family']
  },
  'amc': {
    companies: [],
    networks: [174], // AMC
    keywords: ['amc', 'walking dead']
  },
  'showtime': {
    companies: [4], // Showtime Networks
    networks: [67], // Showtime
    keywords: ['showtime']
  },
  'starz': {
    companies: [432], // Starz Entertainment
    networks: [318], // Starz
    keywords: ['starz']
  },
  'paramount': {
    companies: [4, 1501], // Paramount Pictures, Paramount Television
    networks: [4], // Paramount Network
    keywords: ['paramount']
  },
  'universal': {
    companies: [33, 6810], // Universal Pictures, NBCUniversal
    networks: [],
    keywords: ['universal', 'jurassic', 'fast furious']
  },
  'sony': {
    companies: [5, 34], // Columbia Pictures, Sony Pictures
    networks: [],
    keywords: ['sony', 'columbia']
  },
  'warner': {
    companies: [174, 128064], // Warner Bros., DC Films
    networks: [],
    keywords: ['warner bros', 'wb']
  },
  'lionsgate': {
    companies: [1632], // Lionsgate
    networks: [],
    keywords: ['lionsgate', 'hunger games']
  }
};

// Helper function to ensure proper media_type typing and field mapping
function ensureMediaType(item: TmdbMovie | TmdbTVShow, mediaType: 'movie' | 'tv'): SearchResult {
  const baseResult = {
    ...item,
    media_type: mediaType,
    // Map common fields for both movies and TV shows
    title: 'title' in item ? item.title : item.name,
    name: 'name' in item ? item.name : item.title,
    release_date: 'release_date' in item ? item.release_date : item.first_air_date,
    first_air_date: 'first_air_date' in item ? item.first_air_date : item.release_date,
  };
  
  return baseResult as SearchResult;
}

// Function to generate streaming platform URLs
// Note: Most platforms no longer support direct deep links to specific content
// This function provides the best available alternative for each platform
function generateStreamingPlatformURL(platformName: string, contentId: number, mediaType: 'movie' | 'tv', contentTitle?: string): string {
  const encodedTitle = contentTitle ? encodeURIComponent(contentTitle) : '';
  const lowerPlatformName = platformName.toLowerCase();
  
  switch (lowerPlatformName) {
    case 'netflix':
      // Netflix no longer supports deep links - opens main app/website
      return 'https://www.netflix.com/';
    
    case 'disney+':
    case 'disney plus':
      // Disney+ main page - they can search from there
      return 'https://www.disneyplus.com/';
    
    case 'amazon prime video':
    case 'prime video':
      // Amazon Prime Video main page
      return 'https://www.primevideo.com/';
    
    case 'hulu':
      // Hulu main page
      return 'https://www.hulu.com/';
    
    case 'max':
    case 'hbo max':
      // Max main page
      return 'https://www.max.com/';
    
    case 'apple tv+':
    case 'apple tv plus':
      // Apple TV+ main page
      return 'https://tv.apple.com/';
    
    case 'paramount+':
    case 'paramount plus':
      // Paramount+ main page
      return 'https://www.paramountplus.com/';
    
    case 'peacock':
    case 'peacock tv':
      // Peacock main page
      return 'https://www.peacocktv.com/';
    
    case 'starz':
      // Starz main page
      return 'https://www.starz.com/';
    
    case 'showtime':
      // Showtime main page
      return 'https://www.showtime.com/';
    
    case 'espn+':
    case 'espn plus':
      // ESPN+ main page
      return 'https://plus.espn.com/';
    
    case 'youtube':
    case 'youtube premium':
      // YouTube with search query
      return `https://www.youtube.com/results?search_query=${encodedTitle}`;
    
    case 'tubi':
      // Tubi with search
      return `https://tubitv.com/search/${encodedTitle}`;
    
    case 'pluto tv':
      // Pluto TV main page
      return 'https://pluto.tv/';
    
    case 'crunchyroll':
      // Crunchyroll main page
      return 'https://www.crunchyroll.com/';
    
    case 'funimation':
      // Funimation (now part of Crunchyroll)
      return 'https://www.crunchyroll.com/';
    
    case 'discovery+':
    case 'discovery plus':
      // Discovery+ main page
      return 'https://www.discoveryplus.com/';
    
    case 'amc+':
    case 'amc plus':
      // AMC+ main page
      return 'https://www.amcplus.com/';
    
    case 'britbox':
      // BritBox main page
      return 'https://www.britbox.com/';
    
    case 'acorn tv':
      // Acorn TV main page
      return 'https://acorn.tv/';
    
    case 'shudder':
      // Shudder main page
      return 'https://www.shudder.com/';
    
    case 'criterion channel':
      // Criterion Channel main page
      return 'https://www.criterionchannel.com/';
    
    case 'mubi':
      // MUBI main page
      return 'https://mubi.com/';
    
    case 'kanopy':
      // Kanopy main page
      return 'https://www.kanopy.com/';
    
    case 'hoopla':
      // hoopla main page
      return 'https://www.hoopladigital.com/';
    
    case 'plex':
      // Plex main page
      return 'https://www.plex.tv/';
    
    case 'roku channel':
    case 'the roku channel':
      // Roku Channel main page
      return 'https://therokuchannel.roku.com/';
    
    case 'imdb tv':
    case 'freevee':
      // Amazon Freevee (formerly IMDb TV)
      return 'https://www.amazon.com/adlp/freevee';
    
    case 'mgm+':
    case 'mgm plus':
      // MGM+ main page
      return 'https://www.mgmplus.com/';
    
    case 'bet+':
      // BET+ main page
      return 'https://www.bet.com/plus';
    
    case 'cinemax':
      // Cinemax main page
      return 'https://www.cinemax.com/';
    
    case 'hidive':
      // HiDive main page
      return 'https://www.hidive.com/';
    
    case 'history vault':
      // History Vault main page
      return 'https://www.historyvault.com/';
    
    case 'allblk':
      // ALLBLK main page
      return 'https://www.allblk.tv/';
    
    case 'lifetime movie club':
      // Lifetime Movie Club main page
      return 'https://mylifetime.com/movies';
    
    case 'fandango at home':
      // Fandango At Home (formerly Vudu)
      return 'https://www.fandangoathome.com/';
    
    case 'microsoft store':
      // Microsoft Store
      return 'https://www.microsoft.com/en-us/store/movies-and-tv';
    
    case 'fubotv':
      // fuboTV main page
      return 'https://www.fubo.tv/';
    
    case 'philo':
      // Philo main page
      return 'https://www.philo.com/';
    
    case 'rakuten viki':
      // Rakuten Viki main page
      return 'https://www.viki.com/';
    
    case 'sundance now':
      // Sundance Now main page
      return 'https://www.sundancenow.com/';
    
    case 'pure flix':
      // Pure Flix main page
      return 'https://www.pureflix.com/';
    
    default:
      // For unknown platforms, return the main platform page instead of Google search
      // This prevents redirecting to Google for legitimate platforms
      return `https://www.${platformName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/`;
  }
}

// Function to consolidate and filter streaming platforms
function consolidateStreamingPlatforms(providers: TmdbProvider[], contentId: number, mediaType: 'movie' | 'tv', contentTitle?: string): StreamingService[] {
  const consolidatedMap = new Map<string, StreamingService>();
  
  providers.forEach(provider => {
    const originalName = provider.provider_name;
    
    // Skip filtered out platforms
    if (FILTERED_OUT_PLATFORMS.has(originalName)) {
      return;
    }
    
    // Get consolidated name or use original if not in map
    const consolidatedName = PLATFORM_CONSOLIDATION_MAP[originalName] || originalName;
    
    // Skip if we've already added this consolidated platform
    if (consolidatedMap.has(consolidatedName)) {
      return;
    }
    
    // Generate proper deep link to the streaming platform
    const platformURL = generateStreamingPlatformURL(consolidatedName, contentId, mediaType, contentTitle);
    
    // Add the consolidated platform
    consolidatedMap.set(consolidatedName, {
      name: consolidatedName,
      url: platformURL,
      logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`
    });
  });
  
  // Convert to array and sort by name for consistency
  return Array.from(consolidatedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Create a cached axios instance (lazy initialization to avoid token access during module load)
let apiClient: ReturnType<typeof axios.create> | null = null;

const getApiClient = () => {
  if (!apiClient) {
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    console.log('🔧 getApiClient - token check:', { hasToken: !!token, tokenLength: token?.length || 0 });
    
    if (!token || token.trim() === '') {
      console.error('❌ TMDB API token not available or empty');
      throw new Error('TMDB API token not available');
    }
    
    console.log('✅ Creating axios client with Bearer token');
    apiClient = axios.create({
      baseURL: TMDB_API_CONFIG.BASE_URL,
      headers: {
        ...TMDB_API_CONFIG.HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Axios client created successfully');
  }
  return apiClient;
};

// Cache for streaming services and videos
const streamingServicesCache = new Map<string, StreamingService[]>();
const videoCache = new Map<string, VideoResult[]>();

// Function to detect if search query is a network/brand
const detectNetworkBrand = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for exact matches first
  if (NETWORK_BRAND_MAP[normalizedQuery]) {
    return normalizedQuery;
  }
  
  // Check for partial matches
  for (const [brand, _] of Object.entries(NETWORK_BRAND_MAP)) {
    if (normalizedQuery.includes(brand) || brand.includes(normalizedQuery)) {
      return brand;
    }
  }
  
  return null;
};

// Function to search content by network/brand
const searchByNetworkBrand = async (brandKey: string): Promise<SearchResult[]> => {
  const brand = NETWORK_BRAND_MAP[brandKey];
  if (!brand) return [];
  
  try {
    const results: SearchResult[] = [];
    
    // Search movies by production companies
    if (brand.companies.length > 0) {
      for (const companyId of brand.companies) {
        try {
          const { data } = await getApiClient().get('/discover/movie', {
            params: {
              with_companies: companyId,
              sort_by: 'popularity.desc',
              'vote_count.gte': 100,
              page: 1
            }
          });
          
                     const movies = data.results
             .filter((result: any) => result.poster_path)
             .map((result: any) => ({
               ...result,
               media_type: 'movie' as const
             }))
             .slice(0, 5); // Limit per company to avoid too many results
          
          results.push(...movies);
        } catch {
          // If this specific page fails, continue with others
          console.warn(`Failed to fetch movies for company ${companyId}`);
        }
      }
    }
    
    // Search TV shows by networks
    if (brand.networks.length > 0) {
      for (const networkId of brand.networks) {
        try {
          const { data } = await getApiClient().get('/discover/tv', {
            params: {
              with_networks: networkId,
              sort_by: 'popularity.desc',
              'vote_count.gte': 50,
              page: 1
            }
          });
          
                     const shows = data.results
             .filter((result: any) => result.poster_path)
             .map((result: any) => ({
               ...result,
               media_type: 'tv' as const
             }))
             .slice(0, 5); // Limit per network to avoid too many results
          
          results.push(...shows);
        } catch {
          // If this specific page fails, continue with others
          console.warn(`Failed to fetch shows for network ${networkId}`);
        }
      }
    }
    
    // Remove duplicates and sort by popularity
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    
         return uniqueResults
       .sort((a, b) => {
         const aScore = ((a.vote_average || 0) * (a.vote_count || 0)) + (a.popularity || 0);
         const bScore = ((b.vote_average || 0) * (b.vote_count || 0)) + (b.popularity || 0);
         return bScore - aScore;
       })
       .slice(0, 12) as SearchResult[]; // Return top 12 results
      
  } catch {
    console.warn(`Failed to search by network brand ${brandKey}`);
    return [];
  }
};

// Enhanced search function that searches across all content types
export const searchContentEnhanced = async (query: string): Promise<SearchResult[]> => {
  try {
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }
    
    // Use axios with proper Bearer token authentication instead of fetch with api_key
    const response = await axios.get(`${TMDB_API_CONFIG.BASE_URL}/search/multi`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...TMDB_API_CONFIG.HEADERS,
      },
      params: {
        query: encodeURIComponent(query),
        include_adult: false,
        language: 'en-US'
      }
    });
    
    return response.data.results
      .filter((item: SearchResult) => {
        // Exclude person results
        if (item.media_type === 'person') {
          return false;
        }
        
        // Must have poster_path for visual display
        if (!item.poster_path) {
          return false;
        }
        
        // Must have title or name
        const title = item.title || item.name;
        if (!title || title.trim().length < 2) {
          return false;
        }
        
        // Remove obvious test/placeholder titles
        const titleLower = title.toLowerCase().trim();
        if (titleLower === 'test' || titleLower === 'unknown' || titleLower === 'n/a' || titleLower === 'tbd') {
          return false;
        }
        
        // Basic popularity threshold
        if (item.popularity !== undefined && item.popularity < 0.1) {
          return false;
        }
        
        // Must have a valid ID
        if (!item.id || item.id <= 0) {
          return false;
        }
        
        return true;
      })
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)); // Sort by popularity
  } catch {
    return [];
  }
};

// Get episode-level credits for an actor in a TV show
export const getActorTVShowEpisodes = async (tvShowId: number, actorId: number): Promise<ActorTVShowEpisodeResult> => {
  try {
    // Get TV show details first
    const showResponse = await getApiClient().get(`/tv/${tvShowId}`);
    const showDetails = showResponse.data;

    const actorEpisodes: any[] = [];

    // Get seasons (skip season 0 - specials for now)
    const seasons = showDetails.seasons?.filter((season: any) => season.season_number > 0) || [];

    // For each season, get episodes and check if actor appears
    for (const season of seasons.slice(0, 5)) { // Limit to first 5 seasons for performance
      try {
        const seasonResponse = await getApiClient().get(`/tv/${tvShowId}/season/${season.season_number}`);
        const seasonData = seasonResponse.data;

        // Get episode credits to find which episodes the actor appears in
        const episodesWithActor: any[] = [];
        
        for (const episode of seasonData.episodes || []) {
          try {
            const creditsResponse = await getApiClient().get(
              `/tv/${tvShowId}/season/${season.season_number}/episode/${episode.episode_number}/credits`
            );
            
            // Check if actor appears in this episode
            const actorInEpisode = creditsResponse.data.cast?.find((castMember: any) => 
              castMember.id === actorId
            );

            if (actorInEpisode) {
              episodesWithActor.push({
                ...episode,
                character: actorInEpisode.character
              });
            }
          } catch {
            // If this specific episode fails, continue with others
            console.warn(`Failed to fetch credits for episode ${episode.episode_number} in season ${season.season_number} of TV show ${showDetails.name}`);
          }
        }

        if (episodesWithActor.length > 0) {
          actorEpisodes.push({
            seasonNumber: season.season_number,
            seasonName: season.name,
            episodes: episodesWithActor
          });
        }
      } catch {
        console.warn(`Failed to fetch season ${season.season_number} of TV show ${showDetails.name}`);
      }
    }

    return {
      showDetails,
      actorEpisodes
    };
  } catch {
    console.warn(`Failed to fetch actor TV show episodes for person ${actorId} in TV show ${tvShowId}`);
    // Return empty result with minimal show details on error
    return {
      showDetails: {
        id: tvShowId,
        name: 'Unknown Show',
        original_name: 'Unknown Show',
        poster_path: null,
        backdrop_path: null,
        first_air_date: '',
        vote_average: 0,
        vote_count: 0,
        overview: '',
        genre_ids: [],
        popularity: 0,
        origin_country: [],
        original_language: '',
        seasons: [],
        networks: [],
        number_of_episodes: 0,
        number_of_seasons: 0,
        episode_run_time: [],
        genres: [],
        production_companies: [],
        production_countries: [],
        spoken_languages: [],
        created_by: [],
        status: '',
        type: '',
        tagline: '',
        homepage: null,
        in_production: false,
        languages: [],
        last_air_date: null,
        last_episode_to_air: null,
        next_episode_to_air: null
      },
      actorEpisodes: []
    };
  }
};

// Get content by actor/person
export const getContentByPerson = async (personId: number, mediaType?: 'movie' | 'tv'): Promise<SearchResult[]> => {
  try {
    const [movieCredits, tvCredits] = await Promise.all([
      getApiClient().get(`/person/${personId}/movie_credits`),
      getApiClient().get(`/person/${personId}/tv_credits`)
    ]);

    let results: SearchResult[] = [];

    if (!mediaType || mediaType === 'movie') {
      const movies = movieCredits.data.cast
        .filter((movie: any) => movie.poster_path && movie.title) // Ensure title exists
        .map((movie: any) => ({
          ...movie,
          media_type: 'movie' as const,
          title: movie.title
        }))
        .sort((a: any, b: any) => {
          // Sort by popularity first, then by release date
          const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
          if (Math.abs(popularityDiff) > 10) return popularityDiff;
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        });
      results = [...results, ...movies];
    }

    if (!mediaType || mediaType === 'tv') {
      const shows = tvCredits.data.cast
        .filter((show: any) => show.poster_path && show.name) // Ensure name exists
        .map((show: any) => ({
          ...show,
          media_type: 'tv' as const,
          name: show.name
        }))
        .sort((a: any, b: any) => {
          // Sort by popularity first, then by air date
          const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
          if (Math.abs(popularityDiff) > 10) return popularityDiff;
          const dateA = a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
          const dateB = b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
          return dateB - dateA;
        });
      results = [...results, ...shows];
    }

    return results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } catch {
    console.warn(`Failed to get content by person ${personId}`);
    return [];
  }
};

// Get content by network
export const getContentByNetwork = async (networkId: number, mediaType?: 'movie' | 'tv'): Promise<SearchResult[]> => {
  try {
    // For networks, we primarily focus on TV shows
    if (mediaType === 'movie') {
      // Networks don't typically produce movies, return empty
      return [];
    }

    const response = await getApiClient().get('/discover/tv', {
      params: {
        with_networks: networkId,
        sort_by: 'popularity.desc',
        page: 1
      }
    });

    return response.data.results
      .filter((show: any) => show.poster_path)
      .map((show: any) => ({
        ...show,
        media_type: 'tv' as const,
        name: show.name
      }))
      .slice(0, 20);
  } catch {
    console.warn(`Failed to get content by network ${networkId}`);
    return [];
  }
};

// Update the existing searchContent function to use the enhanced version for backward compatibility
export const searchContent = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    // Check if this is a network/brand search first
    const detectedBrand = detectNetworkBrand(query);
    
    if (detectedBrand) {
      // Perform network/brand-based search
      const brandResults = await searchByNetworkBrand(detectedBrand);
      
      // Also perform regular search to catch any titles that might match
      const { data } = await getApiClient().get('/search/multi', {
        params: {
          query,
          include_adult: false,
          language: 'en-US',
          page: 1
        },
      });

      const regularResults = data.results
        .filter((result: SearchResult) => 
          (result.media_type === 'movie' || result.media_type === 'tv') &&
          result.poster_path
        )
        .slice(0, 4); // Limit regular results when doing brand search
      
      // Combine results, prioritizing brand results
      const combinedResults = [...brandResults, ...regularResults];
      const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
      
      return uniqueResults.slice(0, 16); // Return more results for brand searches
    } else {
      // Use enhanced search but return flattened results for backward compatibility
      const enhanced = await searchContentEnhanced(query);
      return enhanced.slice(0, 12);
    }
  } catch {
    console.warn(`Failed to search content for query ${query}`);
    return [];
  }
};

// Search for people/actors with enhanced matching
export const searchPeople = async (query: string): Promise<PersonResult[]> => {
  try {
    if (!query.trim()) return [];
    
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }
    
    const searchVariations = generateSearchVariations(query);
    console.log('🔍 Searching people with variations:', searchVariations);
    
    const allResults: PersonResult[] = [];
    const seenIds = new Set<number>();
    
    // Try each search variation
    for (const searchQuery of searchVariations) {
      try {
        const response = await getApiClient().get('/search/person', {
          params: {
            query: searchQuery,
            include_adult: false,
            language: 'en-US',
            page: 1
          },
        });

        const results = response.data.results
          .filter((person: any) => {
            // Skip if already seen
            if (seenIds.has(person.id)) return false;
            
            // Basic existence checks
            if (!person.known_for_department || !person.known_for || person.known_for.length === 0) {
              return false;
            }
            
            // Name quality checks
            if (!person.name || person.name.trim().length < 2) {
              return false;
            }
            
            // Remove obvious test/placeholder names
            const name = person.name.toLowerCase().trim();
            if (name === 'test' || name === 'unknown' || name === 'n/a' || name === 'tbd') {
              return false;
            }
            
            // Popularity threshold - filter out very low popularity actors
            if (!person.popularity || person.popularity < 0.5) {
              return false;
            }
            
            // Check for meaningful known_for content
            const validKnownFor = person.known_for.filter((item: any) => 
              item && (item.title || item.name) && item.poster_path
            );
            
            if (validKnownFor.length === 0) {
              return false;
            }
            
            return true;
          })
          .map((person: any) => ({
            id: person.id,
            name: person.name,
            profile_path: person.profile_path,
            known_for_department: person.known_for_department,
            known_for: person.known_for.map((item: any) => ({
              ...item,
              media_type: item.media_type || (item.title ? 'movie' : 'tv')
            })),
            popularity: person.popularity
          }));
        
        // Add new results
        results.forEach((person: PersonResult) => {
          if (!seenIds.has(person.id)) {
            seenIds.add(person.id);
            allResults.push(person);
          }
        });
        
      } catch (error) {
        console.warn(`Failed to search people for variation: ${searchQuery}`, error);
        continue; // Try next variation
      }
    }
    
    // Score results based on name similarity to original query
    const scoredResults = allResults.map(person => ({
      ...person,
      _searchScore: calculateNameSimilarityScore(person.name, query) + (person.popularity || 0) * 0.1
    }));
    
    return scoredResults
      .sort((a: any, b: any) => b._searchScore - a._searchScore) // Sort by search score
      .slice(0, 12); // Return top 12 results
      
  } catch (error) {
    console.warn(`Failed to search people for query: ${query}`, error);
    return [];
  }
};

// Helper function to generate search variations for better name matching
function generateSearchVariations(query: string): string[] {
  const variations = [query]; // Start with original query
  const cleaned = query.trim().toLowerCase();
  
  // Handle common name patterns
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length >= 2) {
    // For names like "micheal b jordan", try:
    
    // 1. Correct common misspellings
    const corrected = query
      .replace(/micheal/gi, 'michael')
      .replace(/machael/gi, 'michael')
      .replace(/michal/gi, 'michael')
      .replace(/cristian/gi, 'christian')
      .replace(/christan/gi, 'christian');
    
    if (corrected !== query) {
      variations.push(corrected);
    }
    
    // 2. Try first and last name only (skip middle initial)
    if (words.length === 3 && words[1].length === 1) {
      // "michael b jordan" → "michael jordan"
      variations.push(`${words[0]} ${words[2]}`);
    }
    
    // 3. Try with different spacing for middle initials
    if (words.length === 3 && words[1].length === 1) {
      // "michael b jordan" → "michael b. jordan"
      variations.push(`${words[0]} ${words[1]}. ${words[2]}`);
    }
    
    // 4. Try partial matches (first two words, last two words)
    if (words.length >= 3) {
      variations.push(`${words[0]} ${words[1]}`); // First two words
      variations.push(`${words[words.length - 2]} ${words[words.length - 1]}`); // Last two words
    }
    
    // 5. Try just first name for very partial searches
    if (words[0].length >= 3) {
      variations.push(words[0]);
    }
    
    // 6. Try with quotes for exact phrase matching
    variations.push(`"${query}"`);
  }
  
  // Remove duplicates and return
  return [...new Set(variations)].slice(0, 5); // Limit to 5 variations to avoid too many API calls
}

// Helper function to calculate name similarity score
function calculateNameSimilarityScore(name: string, query: string): number {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match bonus
  if (nameLower === queryLower) return 100;
  
  // Check if query is contained in name
  if (nameLower.includes(queryLower)) return 80;
  
  // Check if name is contained in query (for longer search terms)
  if (queryLower.includes(nameLower)) return 75;
  
  // Word-based matching
  const nameWords = nameLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  
  let matchingWords = 0;
  let totalWords = Math.max(nameWords.length, queryWords.length);
  
  queryWords.forEach(queryWord => {
    if (nameWords.some(nameWord => 
      nameWord.includes(queryWord) || queryWord.includes(nameWord) || 
      levenshteinDistance(nameWord, queryWord) <= 1
    )) {
      matchingWords++;
    }
  });
  
  return (matchingWords / totalWords) * 60;
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

export const getTrending = async (mediaType: 'movie' | 'tv'): Promise<SearchResult[]> => {
  try {
    console.log('📈 getTrending called with mediaType:', mediaType);
    
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    console.log('📈 getTrending token check:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token?.substring(0, 20) || 'undefined'
    });
    
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }

    console.log('📈 Making TMDB API calls...');
    const client = getApiClient();
    const pages = await Promise.all([
      client.get(`/trending/${mediaType}/day`, { params: { page: 1 } }),
      client.get(`/trending/${mediaType}/day`, { params: { page: 2 } }),
      client.get(`/trending/${mediaType}/day`, { params: { page: 3 } })
    ]);

    console.log('📈 Got API responses, processing results...');
    const results = pages.flatMap(response => response.data.results)
      .filter((result: SearchResult) => result.poster_path)
      .map((result: SearchResult) => ({
        ...result,
        media_type: mediaType
      }));

    const popularResponse = await client.get(`/${mediaType}/popular`, { params: { page: 1 } });
    const popularResults = popularResponse.data.results
      .filter((result: SearchResult) => result.poster_path)
      .map((result: SearchResult) => ({
        ...result,
        media_type: mediaType
      }));

    const combined = [...results, ...popularResults];
    const uniqueResults = Array.from(new Map(combined.map(item => [item.id, item])).values());

    const finalResults = uniqueResults.sort((a, b) => {
      const aScore = (a.vote_average || 0) * (a.vote_count || 0);
      const bScore = (b.vote_average || 0) * (b.vote_count || 0);
      return bScore - aScore;
    });
    
    console.log('📈 getTrending completed successfully:', {
      mediaType,
      resultCount: finalResults.length,
      sampleTitles: finalResults.slice(0, 3).map(r => r.title || r.name)
    });
    
    return finalResults;
  } catch (error) {
    console.error('📈 getTrending failed:', error);
    console.warn(`Failed to get trending content for media type ${mediaType}`);
    return [];
  }
};

// New function to get trending content filtered by streaming services
export const getTrendingWithStreamingFilter = async (
  mediaType: 'movie' | 'tv', 
  selectedServiceIds: string[]
): Promise<SearchResult[]> => {
  try {
    // Get trending content from the last 7 days
    const response = await getApiClient().get(`/trending/${mediaType}/week`, { params: { page: 1 } });
    
    const results = response.data.results
      .filter((result: SearchResult) => result.poster_path)
      .map((result: SearchResult) => ({
        ...result,
        media_type: mediaType
      }));

    // If no streaming services selected, return all trending content
    if (selectedServiceIds.length === 0) {
      return results.slice(0, 20);
    }

    // Create a mapping of service IDs to TMDB provider names
    const serviceToTmdbName: Record<string, string[]> = {
      'netflix': ['Netflix'],
      'prime': ['Amazon Prime Video', 'Prime Video'],
      'disney': ['Disney Plus', 'Disney+'],
      'hulu': ['Hulu'],
      'max': ['Max', 'HBO Max'],
      'apple': ['Apple TV Plus', 'Apple TV+'],
      'peacock': ['Peacock Premium', 'Peacock'],
      'paramount': ['Paramount Plus', 'Paramount+']
    };

    // Get all the TMDB provider names for selected services
    const selectedProviderNames = selectedServiceIds.flatMap(serviceId => 
      serviceToTmdbName[serviceId] || []
    );

    // Filter results by streaming availability
    const filteredResults: SearchResult[] = [];
    
    for (const item of results) {
      try {
        const watchProviders = await getApiClient().get(`/${mediaType}/${item.id}/watch/providers`);
        const usProviders = watchProviders.data.results?.US?.flatrate || [];
        
        // Check if any of the user's selected services are available
        const hasMatchingService = usProviders.some((provider: any) => 
          selectedProviderNames.some(name => provider.provider_name.includes(name))
        );
        
        if (hasMatchingService) {
          filteredResults.push(item);
        }
        
        // Stop when we have enough results
        if (filteredResults.length >= 20) {
          break;
        }
      } catch {
        console.warn(`Failed to get streaming info for item ${item.title || item.name} with ID ${item.id}`);
      }
    }

    // If we don't have enough filtered results, fill with trending content
    if (filteredResults.length < 5) {
      const remainingSlots = 20 - filteredResults.length;
      const additionalResults = results
        .filter((item: SearchResult) => !filteredResults.some(filtered => filtered.id === item.id))
        .slice(0, remainingSlots);
      
      return [...filteredResults, ...additionalResults];
    }

    return filteredResults.slice(0, 20);
  } catch {
    console.warn(`Failed to get filtered trending content for media type ${mediaType} and selected services ${selectedServiceIds.join(',')}`);
    // Fallback to regular trending if filtering fails
    return getTrending(mediaType);
  }
};

export const getStreamingServices = async (id: number, mediaType: 'movie' | 'tv'): Promise<StreamingService[]> => {
  const cacheKey = `${mediaType}_${id}`;
  
  if (streamingServicesCache.has(cacheKey)) {
    return streamingServicesCache.get(cacheKey)!;
  }
  
  try {
    // Get content details to extract title for deep linking
    const detailsResponse = await getApiClient().get(`/${mediaType}/${id}`);
    const contentTitle = detailsResponse.data.title || detailsResponse.data.name;
    
    // Use TMDB's real watch providers API endpoint
    const { data } = await getApiClient().get(`/${mediaType}/${id}/watch/providers`);
    
    // Focus on US providers for now - you can modify this for other regions
    const usData = data.results?.US;
    if (!usData) {
      streamingServicesCache.set(cacheKey, []);
      return [];
    }
    
    // Extract all provider types (streaming, rent, buy)
    const allProviders = [
      ...(usData.flatrate || []), // Streaming services
      ...(usData.rent || []),     // Rental services
      ...(usData.buy || [])       // Purchase services
    ];
    
    // Remove duplicates based on provider_id
    const uniqueProviders = allProviders.filter((provider, index, self) => 
      index === self.findIndex(p => p.provider_id === provider.provider_id)
    );
    
    // Consolidate and filter platforms
    const services = consolidateStreamingPlatforms(uniqueProviders, id, mediaType, contentTitle);
    
    streamingServicesCache.set(cacheKey, services);
    return services;
  } catch {
    console.warn(`Failed to get streaming services for content ID ${id} and media type ${mediaType}`);
    streamingServicesCache.set(cacheKey, []);
    return [];
  }
};

export const getVideos = async (id: number, mediaType: 'movie' | 'tv'): Promise<VideoResult[]> => {
  const cacheKey = `${mediaType}_${id}`;

  if (videoCache.has(cacheKey)) {
    return videoCache.get(cacheKey)!;
  }

  try {
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }

    const { data } = await getApiClient().get(`/${mediaType}/${id}/videos`);
    const videos = data.results
      .filter((video: VideoResult) => 
        video.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser') &&
        video.official
      )
      .sort((a: VideoResult, b: VideoResult) => 
        a.type === 'Trailer' ? -1 : 1
      );

    videoCache.set(cacheKey, videos);
    return videos;
  } catch {
    console.warn(`Failed to get videos for content ID ${id} and media type ${mediaType}`);
    return [];
  }
};

export const getBingeworthy = async (): Promise<SearchResult[]> => {
  try {
    // Fetch multiple pages of TV shows to get a better selection
    const pages = await Promise.all([
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'popularity.desc',
          'vote_average.gte': 8,
          'vote_count.gte': 1000,
          'with_type': 2, // Scripted shows
          page: 1
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'vote_average.desc',
          'vote_average.gte': 8.5,
          'vote_count.gte': 500,
          'with_type': 2,
          page: 1
        }
      }),
      getApiClient().get('/tv/top_rated', {
        params: {
          page: 1
        }
      })
    ]);

    // Combine and process results
    const allShows = pages.flatMap(response => response.data.results)
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    // Remove duplicates and sort by popularity and rating
    const uniqueShows = Array.from(new Map(allShows.map(show => [show.id, show])).values());
    
    return uniqueShows
      .sort((a, b) => {
        const aScore = (a.vote_average || 0) * Math.log10(a.vote_count || 1);
        const bScore = (b.vote_average || 0) * Math.log10(b.vote_count || 1);
        return bScore - aScore;
      })
      .slice(0, 20);

  } catch {
    console.warn('Failed to get bingeworthy content');
    return [];
  }
};

export const getExpiringContent = async (): Promise<SearchResult[]> => {
  try {
    const dateFilter = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fetch multiple pages to ensure we have enough content for filtering
    const [movieResponse1, movieResponse2, tvResponse1, tvResponse2] = await Promise.all([
      getApiClient().get('/discover/movie', {
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 500,
          'vote_average.gte': 7,
          'primary_release_date.lte': dateFilter,
          page: 1
        }
      }),
      getApiClient().get('/discover/movie', {
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 500,
          'vote_average.gte': 7,
          'primary_release_date.lte': dateFilter,
          page: 2
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 500,
          'vote_average.gte': 7,
          'air_date.lte': dateFilter,
          page: 1
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 500,
          'vote_average.gte': 7,
          'air_date.lte': dateFilter,
          page: 2
        }
      })
    ]);

    const movies = [...movieResponse1.data.results, ...movieResponse2.data.results]
      .filter((movie: SearchResult) => movie.poster_path)
      .map((movie: SearchResult) => ({
        ...movie,
        media_type: 'movie' as const
      }));

    const tvShows = [...tvResponse1.data.results, ...tvResponse2.data.results]
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    return [...movies, ...tvShows]
      .sort(() => Math.random() - 0.5)
      .slice(0, 60); // Increased to 60 to ensure enough content for filtering
  } catch {
    console.warn('Failed to get expiring content');
    return [];
  }
};

export const getTopContent = async (mediaType: 'movie' | 'tv'): Promise<SearchResult[]> => {
  try {
    const { data } = await getApiClient().get(`/${mediaType}/top_rated`, {
      params: {
        page: 1
      }
    });

    return data.results
      .filter((item: SearchResult) => item.poster_path)
      .map((item: SearchResult) => ({
        ...item,
        media_type: mediaType
      }));
  } catch {
    console.warn(`Failed to get top content for media type ${mediaType}`);
    return [];
  }
};

export const getNewContent = async (): Promise<SearchResult[]> => {
  try {
    // Fetch multiple pages to ensure we have enough content for filtering
    const [movieResponse1, movieResponse2, tvResponse1, tvResponse2] = await Promise.all([
      getApiClient().get('/movie/now_playing', { params: { page: 1 } }),
      getApiClient().get('/movie/now_playing', { params: { page: 2 } }),
      getApiClient().get('/tv/on_the_air', { params: { page: 1 } }),
      getApiClient().get('/tv/on_the_air', { params: { page: 2 } })
    ]);

    const movies = [...movieResponse1.data.results, ...movieResponse2.data.results]
      .filter((movie: SearchResult) => movie.poster_path)
      .map((movie: SearchResult) => ({
        ...movie,
        media_type: 'movie' as const
      }));

    const tvShows = [...tvResponse1.data.results, ...tvResponse2.data.results]
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    return [...movies, ...tvShows]
      .sort((a, b) => new Date(b.release_date || b.first_air_date || '').getTime() - new Date(a.release_date || a.first_air_date || '').getTime())
      .slice(0, 60); // Increased to 60 to ensure enough content for filtering
  } catch {
    console.warn('Failed to get new content');
    return [];
  }
};

export const getRandomPicks = async (): Promise<SearchResult[]> => {
  try {
    // Fetch multiple pages to ensure we have enough content for filtering
    const randomPage1 = Math.floor(Math.random() * 5) + 1;
    const randomPage2 = Math.floor(Math.random() * 5) + 6; // Different range to avoid duplicates
    
    const [movieResponse1, movieResponse2, tvResponse1, tvResponse2] = await Promise.all([
      getApiClient().get('/discover/movie', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 1000,
          page: randomPage1
        }
      }),
      getApiClient().get('/discover/movie', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 1000,
          page: randomPage2
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 1000,
          page: randomPage1
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 1000,
          page: randomPage2
        }
      })
    ]);

    const movies = [...movieResponse1.data.results, ...movieResponse2.data.results]
      .filter((movie: SearchResult) => movie.poster_path)
      .map((movie: SearchResult) => ({
        ...movie,
        media_type: 'movie' as const
      }));

    const tvShows = [...tvResponse1.data.results, ...tvResponse2.data.results]
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    return [...movies, ...tvShows]
      .sort(() => Math.random() - 0.5)
      .slice(0, 60); // Increased to 60 to ensure enough content for filtering
  } catch {
    console.warn('Failed to get random picks');
    return [];
  }
};

export const getGenreContent = async (genreId: string): Promise<SearchResult[]> => {
  try {
    // Fetch multiple pages to ensure we have enough content for filtering
    const [movieResponse1, movieResponse2, tvResponse1, tvResponse2] = await Promise.all([
      getApiClient().get('/discover/movie', {
        params: {
          with_genres: genreId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 1000,
          'vote_average.gte': 7,
          page: 1
        }
      }),
      getApiClient().get('/discover/movie', {
        params: {
          with_genres: genreId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 1000,
          'vote_average.gte': 7,
          page: 2
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          with_genres: genreId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 1000,
          'vote_average.gte': 7,
          page: 1
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          with_genres: genreId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 1000,
          'vote_average.gte': 7,
          page: 2
        }
      })
    ]);

    const movies = [...movieResponse1.data.results, ...movieResponse2.data.results]
      .filter((movie: SearchResult) => movie.poster_path)
      .map((movie: SearchResult) => ({
        ...movie,
        media_type: 'movie' as const
      }));

    const tvShows = [...tvResponse1.data.results, ...tvResponse2.data.results]
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    const combined = [...movies, ...tvShows];
    
    return combined
      .sort((a, b) => {
        const aScore = (a.vote_average || 0) * Math.log10(a.vote_count || 1);
        const bScore = (b.vote_average || 0) * Math.log10(b.vote_count || 1);
        return bScore - aScore;
      })
      .slice(0, 60); // Increased to 60 to ensure enough content for filtering
  } catch {
    console.warn(`Failed to get genre content for genre ID ${genreId}`);
    return [];
  }
};

export const getTopSearches = async (): Promise<SearchResult[]> => {
  try {
    // Fetch multiple pages to ensure we have enough content for filtering
    const [movieResponse1, movieResponse2, tvResponse1, tvResponse2] = await Promise.all([
      getApiClient().get('/trending/movie/week', { params: { page: 1 } }),
      getApiClient().get('/trending/movie/week', { params: { page: 2 } }),
      getApiClient().get('/trending/tv/week', { params: { page: 1 } }),
      getApiClient().get('/trending/tv/week', { params: { page: 2 } })
    ]);

    const movies = [...movieResponse1.data.results, ...movieResponse2.data.results]
      .filter((movie: SearchResult) => movie.poster_path)
      .map((movie: SearchResult) => ({
        ...movie,
        media_type: 'movie' as const
      }));

    const tvShows = [...tvResponse1.data.results, ...tvResponse2.data.results]
      .filter((show: SearchResult) => show.poster_path)
      .map((show: SearchResult) => ({
        ...show,
        media_type: 'tv' as const
      }));

    return [...movies, ...tvShows]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 60); // Increased to 60 to ensure enough content for filtering
  } catch {
    console.warn('Failed to get top searches');
    return [];
  }
};

export const getSimilarContent = async (item: SearchResult): Promise<{ movies: SearchResult[], shows: SearchResult[] }> => {
  try {
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return { movies: [], shows: [] };
    }

    const [moviesResponse, showsResponse] = await Promise.all([
      axios.get(`${TMDB_API_CONFIG.BASE_URL}/movie/${item.id}/similar`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...TMDB_API_CONFIG.HEADERS,
        },
        params: {
          language: 'en-US',
          page: 1,
        },
      }),
      axios.get(`${TMDB_API_CONFIG.BASE_URL}/tv/${item.id}/similar`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...TMDB_API_CONFIG.HEADERS,
        },
        params: {
          language: 'en-US',
          page: 1,
        },
      }),
    ]);

    const movies = moviesResponse.data.results.slice(0, 10).map((movie: any) => ensureMediaType(movie, 'movie'));
    const shows = showsResponse.data.results.slice(0, 10).map((show: any) => ensureMediaType(show, 'tv'));

    return { movies, shows };
  } catch {
    console.warn(`Failed to get similar content for item ${item.title || item.name} with ID ${item.id}`);
    return { movies: [], shows: [] };
  }
};

// Platform mapping for TMDB provider IDs
const PLATFORM_PROVIDER_MAP: Record<string, number> = {
  '8': 8,        // Netflix
  '9': 9,        // Prime Video (Fixed from 119 to 9)
  '337': 337,    // Disney+
  '15': 15,      // Hulu
  '384': 384,    // Max (Fixed from 1899 to 384)
  '350': 350,    // Apple TV+
  '386': 386,    // Peacock
  '531': 531     // Paramount+
};

// Helper function to get top movie for a specific platform with trailer availability
export const getTopMovieForPlatform = async (platformId: string): Promise<SearchResult | null> => {
  try {
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return null;
    }

    const providerId = PLATFORM_PROVIDER_MAP[platformId];
    if (!providerId) {
      handleError('No provider ID found for platform', {
        context: { platformId }
      });
      return null;
    }

    const movieResponse = await axios.get(`${TMDB_API_CONFIG.BASE_URL}/discover/movie`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...TMDB_API_CONFIG.HEADERS,
      },
      params: {
        language: 'en-US',
        sort_by: 'popularity.desc',
        with_watch_providers: providerId,
        watch_region: 'US',
        page: 1,
        'vote_average.gte': 6.0,
        'vote_count.gte': 100
      },
    });

    const movies = movieResponse.data.results.map((movie: any) => ensureMediaType(movie, 'movie'));

    // Find the first movie that has a trailer
    for (const movie of movies.slice(0, 10)) {
      try {
        const videos = await getVideos(movie.id, movie.media_type);
        const hasTrailer = videos.some(video => 
          video.site === 'YouTube' && 
          (video.type === 'Trailer' || video.type === 'Teaser') &&
          video.official
        );
        
        if (hasTrailer) {
          return {
            ...movie,
            platform: platformId
          };
        }
      } catch {
        console.warn(`Failed to check videos for movie ${movie.title || movie.name} with ID ${movie.id}`);
      }
    }

    return null;
  } catch {
    console.warn(`Failed to get top movie for platform ${platformId}`);
    return null;
  }
};

// Helper function to get top TV show for a specific platform with trailer availability
export const getTopTVShowForPlatform = async (platformId: string): Promise<SearchResult | null> => {
  try {
    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return null;
    }

    const providerId = PLATFORM_PROVIDER_MAP[platformId];
    if (!providerId) {
      handleError('No provider ID found for platform', {
        context: { platformId }
      });
      return null;
    }

    const tvResponse = await axios.get(`${TMDB_API_CONFIG.BASE_URL}/discover/tv`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...TMDB_API_CONFIG.HEADERS,
      },
      params: {
        language: 'en-US',
        sort_by: 'popularity.desc',
        with_watch_providers: providerId,
        watch_region: 'US',
        page: 1,
        'vote_average.gte': 6.0,
        'vote_count.gte': 50
      },
    });

    const shows = tvResponse.data.results.map((show: any) => ensureMediaType(show, 'tv'));

    // Find the first TV show that has a trailer
    for (const show of shows.slice(0, 10)) {
      try {
        const videos = await getVideos(show.id, show.media_type);
        const hasTrailer = videos.some(video => 
          video.site === 'YouTube' && 
          (video.type === 'Trailer' || video.type === 'Teaser') &&
          video.official
        );
        
        if (hasTrailer) {
          return {
            ...show,
            platform: platformId
          };
        }
      } catch {
        console.warn(`Failed to check videos for TV show ${show.name} with ID ${show.id}`);
      }
    }

    return null;
  } catch {
    console.warn(`Failed to get top TV show for platform ${platformId}`);
    return null;
  }
};

// Get top content for all platforms with trailers (both movies and TV shows)
export const getTopContentForAllPlatforms = async (): Promise<SearchResult[]> => {
  try {
    const allContent: SearchResult[] = [];

    // Get top movie and TV show for each major platform
    // Updated to use the correct provider IDs and match STREAMING_SERVICES IDs
    const platforms = [
      { id: 8, name: 'Netflix', serviceId: 'netflix' },
      { id: 337, name: 'Disney+', serviceId: 'disney-plus' },
      { id: 384, name: 'Max', serviceId: 'hbo-max' },        // Fixed provider ID from 1899 to 384
      { id: 15, name: 'Hulu', serviceId: 'hulu' },
      { id: 9, name: 'Prime Video', serviceId: 'amazon-prime' },  // Fixed provider ID from 119 to 9
      { id: 350, name: 'Apple TV+', serviceId: 'apple-tv' },
      { id: 531, name: 'Paramount+', serviceId: 'paramount-plus' },
      { id: 386, name: 'Peacock', serviceId: 'peacock' }
    ];

    console.log('Fetching top content for platforms:', platforms.map(p => p.name));

    for (const platform of platforms) {
      try {
        console.log(`Fetching content for ${platform.name} (ID: ${platform.id})`);
        const [topMovie, topShow] = await Promise.all([
          getTopMovieForPlatform(platform.id.toString()),
          getTopTVShowForPlatform(platform.id.toString())
        ]);

        if (topMovie) {
          console.log(`Found movie for ${platform.name}:`, topMovie.title);
          // Use serviceId instead of numeric platform ID
          allContent.push({ ...topMovie, platform: platform.serviceId });
        }
        if (topShow) {
          console.log(`Found TV show for ${platform.name}:`, topShow.name);
          // Use serviceId instead of numeric platform ID
          allContent.push({ ...topShow, platform: platform.serviceId });
        }
      } catch {
        console.warn(`Failed to get content for platform ${platform.name} with ID ${platform.id}`);
      }
    }

    console.log(`Total content found: ${allContent.length} items`);

    // If we have very little content, add some fallback trending content
    if (allContent.length < 4) {
      console.log('Adding fallback trending content...');
      try {
        const fallbackMovies = await getTrending('movie');
        const fallbackShows = await getTrending('tv');
        
        // Add a few trending items as fallback
        fallbackMovies.slice(0, 3).forEach(movie => {
          if (!allContent.find(item => item.id === movie.id)) {
            allContent.push({ ...movie, platform: 'trending' });
          }
        });
        
        fallbackShows.slice(0, 3).forEach(show => {
          if (!allContent.find(item => item.id === show.id)) {
            allContent.push({ ...show, platform: 'trending' });
          }
        });
        
        console.log(`Added fallback content. Total: ${allContent.length} items`);
      } catch {
        console.warn('Failed to add fallback content');
      }
    }

    return allContent;
  } catch {
    console.warn('Failed to get top content for all platforms');

    // Return basic trending content as final fallback
    try {
      console.log('Returning basic trending content as fallback...');
      const movies = await getTrending('movie');
      const shows = await getTrending('tv');
      return [
        ...movies.slice(0, 4).map(movie => ({ ...movie, platform: 'trending' })),
        ...shows.slice(0, 4).map(show => ({ ...show, platform: 'trending' }))
      ];
    } catch {
      console.warn('Failed to get fallback trending content');
      return [];
    }
  }
};

export const getHiddenGems = async (): Promise<SearchResult[]> => {
  try {
    const hiddenGems: SearchResult[] = [];
    
    // Search for high-rated but lesser-known movies (vote_average >= 7.5, popularity < 50)
    const movieResponse = await axios.get(`${TMDB_API_CONFIG.BASE_URL}/discover/movie`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_CONFIG.ACCESS_TOKEN}`,
        ...TMDB_API_CONFIG.HEADERS
      },
      params: {
        'vote_average.gte': 7.5,
        'vote_count.gte': 100,
        'popularity.lte': 50,
        sort_by: 'vote_average.desc',
        page: 1,
        with_original_language: 'en',
        without_genres: '99,10755' // Exclude documentaries and TV movies
      }
    });

    // Search for high-rated but lesser-known TV shows
    const tvResponse = await axios.get(`${TMDB_API_CONFIG.BASE_URL}/discover/tv`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_CONFIG.ACCESS_TOKEN}`,
        ...TMDB_API_CONFIG.HEADERS
      },
      params: {
        'vote_average.gte': 7.5,
        'vote_count.gte': 50,
        'popularity.lte': 30,
        sort_by: 'vote_average.desc',
        page: 1,
        with_original_language: 'en',
        without_genres: '99,10763' // Exclude documentaries and news shows
      }
    });

    // Process movies
    if (movieResponse.data?.results) {
      const movieResults = movieResponse.data.results.slice(0, 10).map((movie: any) => 
        ensureMediaType(movie, 'movie')
      );
      hiddenGems.push(...movieResults);
    }

    // Process TV shows
    if (tvResponse.data?.results) {
      const tvResults = tvResponse.data.results.slice(0, 10).map((show: any) => 
        ensureMediaType(show, 'tv')
      );
      hiddenGems.push(...tvResults);
    }

    // Shuffle and return limited results to ensure variety
    const shuffledGems = hiddenGems.sort(() => 0.5 - Math.random());
    return shuffledGems.slice(0, 20);

  } catch {
    console.warn('Failed to get hidden gems');
    return [];
  }
};

// ENHANCED PERSONALIZED FUNCTIONS

/**
 * Calculate personalization score for content based on various factors
 */
function calculatePersonalizedScore(item: SearchResult, options: {
  hasGenreMatch?: boolean;
  hasWatchlistSimilarity?: boolean;
  isOnSelectedPlatform?: boolean;
  isTrending?: boolean;
  personalizedScore?: number;
}): number {
  let score = 0.5; // Base score

  if (options.hasGenreMatch) score += 0.3;
  if (options.hasWatchlistSimilarity) score += 0.4;
  if (options.isOnSelectedPlatform) score += 0.3;
  if (options.isTrending) score += 0.2;
  if (options.personalizedScore) score = options.personalizedScore;

  return Math.min(score, 1.0);
}

/**
 * Calculate leaving score for content
 */
function calculateLeavingScore(item: SearchResult, isOnPlatform: boolean = false): number {
  if (isOnPlatform) {
    return Math.random() * 0.3 + 0.7; // Random score between 0.7-1.0
  }
  return Math.random() * 0.4 + 0.3; // Lower score for non-platform content
}

/**
 * Calculate trending score for content
 */
function calculateTrendingScore(item: SearchResult, isDaily: boolean = false): number {
  const popularity = item.popularity || 0;
  return popularity * (isDaily ? 1.3 : 0.7);
}

/**
 * Get personalized content recommendations based on user preferences and watchlist
 */
export const getCuratedForYou = async (
  selectedGenres: string[],
  selectedServices: string[],
  watchlistItems: any[],
  mediaType: 'movie' | 'tv' | 'both' = 'both'
): Promise<SearchResult[]> => {
  try {
    console.log('🎯 getCuratedForYou called with:', {
      genres: selectedGenres.length,
      services: selectedServices.length,
      watchlist: watchlistItems.length,
      mediaType
    });

    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }

    let curatedResults: SearchResult[] = [];

    // Step 1: Get content based on selected genres
    if (selectedGenres.length > 0) {
      const genrePromises = selectedGenres.slice(0, 3).map(async (genreId) => {
        try {
          const movieResults = mediaType !== 'tv' ? await getTopMovieForPlatform(genreId) : null;
          const showResults = mediaType !== 'movie' ? await getTopTVShowForPlatform(genreId) : null;
          
          return [movieResults, showResults].filter(Boolean) as SearchResult[];
        } catch (error) {
          console.warn(`Failed to get content for genre ${genreId}:`, error);
          return [];
        }
      });

      const genreResults = await Promise.all(genrePromises);
      curatedResults = genreResults.flat();
    }

    // Step 2: Get similar content to watchlist items
    if (watchlistItems.length > 0) {
      const recentWatchlistItems = watchlistItems.slice(0, 3); // Focus on recent items
      
      for (const watchlistItem of recentWatchlistItems) {
        try {
          const similar = await getSimilarContent(watchlistItem);
          const similarResults = [...similar.movies, ...similar.shows].slice(0, 10);
          
          curatedResults.push(...similarResults);
        } catch (error) {
          console.warn(`Failed to get similar content for watchlist item ${watchlistItem.id}:`, error);
        }
      }
    }

    // Step 3: Filter by streaming platforms if specified
    let filteredResults = curatedResults;
    if (selectedServices.length > 0) {
      const availableOnServices: SearchResult[] = [];
      
      // Map service IDs to provider names
      const serviceToTmdbName: Record<string, string[]> = {
        'netflix': ['Netflix'],
        'amazon-prime': ['Amazon Prime Video', 'Prime Video'],
        'disney-plus': ['Disney Plus', 'Disney+'],
        'hulu': ['Hulu'],
        'hbo-max': ['Max', 'HBO Max'],
        'apple-tv': ['Apple TV Plus', 'Apple TV+'],
        'peacock': ['Peacock Premium', 'Peacock'],
        'paramount-plus': ['Paramount Plus', 'Paramount+']
      };

      const selectedProviderNames = selectedServices.flatMap(serviceId => 
        serviceToTmdbName[serviceId] || []
      );

      // Check streaming availability for each item
      for (const item of curatedResults.slice(0, 30)) {
        try {
          const watchProviders = await getApiClient().get(
            `/${item.media_type}/${item.id}/watch/providers`
          );
          const usProviders = watchProviders.data.results?.US?.flatrate || [];
          
          const hasMatchingService = usProviders.some((provider: any) => 
            selectedProviderNames.some(name => provider.provider_name.includes(name))
          );
          
          if (hasMatchingService) {
            availableOnServices.push(item);
          }
        } catch (error) {
          console.warn(`Failed to check streaming availability for ${item.title || item.name}`);
        }
      }

      // If we have good platform matches, prioritize them; otherwise use all results
      if (availableOnServices.length >= 5) {
        filteredResults = [...availableOnServices, ...curatedResults.filter(item => 
          !availableOnServices.some(available => available.id === item.id)
        )];
      }
    }

    // Step 4: Add trending content if we need more results
    if (filteredResults.length < 15) {
      try {
        const trendingMovies = mediaType !== 'tv' ? await getTrending('movie') : [];
        const trendingShows = mediaType !== 'movie' ? await getTrending('tv') : [];
        
        const trendingResults = [...trendingMovies, ...trendingShows]
          .filter(item => !filteredResults.some(existing => existing.id === item.id))
          .slice(0, 15 - filteredResults.length);
        
        filteredResults.push(...trendingResults);
      } catch (error) {
        console.warn('Failed to add trending fallback content:', error);
      }
    }

    // Step 5: Remove duplicates and sort by calculated score
    const uniqueResults = Array.from(
      new Map(filteredResults.map(item => [item.id, item])).values()
    );

    // Sort by a combination of factors (no custom properties)
    const finalResults = uniqueResults
      .sort((a, b) => {
        // Score based on popularity, vote average, and recency
        const scoreA = (a.popularity || 0) * 0.7 + (a.vote_average || 0) * 0.3;
        const scoreB = (b.popularity || 0) * 0.7 + (b.vote_average || 0) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 30);

    console.log('🎯 getCuratedForYou completed:', {
      totalResults: finalResults.length,
      genres: selectedGenres.length,
      watchlistSimilar: watchlistItems.length > 0,
      platformFiltered: selectedServices.length > 0
    });

    return finalResults;
  } catch (error) {
    console.error('🎯 getCuratedForYou failed:', error);
    // Fallback to basic trending
    return getTrending(mediaType === 'both' ? 'movie' : mediaType);
  }
};

/**
 * Get content that's actually leaving from user's selected streaming platforms
 */
export const getLeavingSoonFromPlatforms = async (
  selectedServices: string[]
): Promise<SearchResult[]> => {
  try {
    console.log('⏳ getLeavingSoonFromPlatforms called with services:', selectedServices);

    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }

    // Note: TMDB doesn't directly provide "leaving soon" data
    // We'll simulate this by finding older popular content that's typically cycled out
    const leavingSoon: SearchResult[] = [];

    // Get older highly-rated content that's typically rotated
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Content older than 2 years
    const dateFilter = cutoffDate.toISOString().split('T')[0];

    const serviceToTmdbName: Record<string, string[]> = {
      'netflix': ['Netflix'],
      'amazon-prime': ['Amazon Prime Video', 'Prime Video'],
      'disney-plus': ['Disney Plus', 'Disney+'],
      'hulu': ['Hulu'],
      'hbo-max': ['Max', 'HBO Max'],
      'apple-tv': ['Apple TV Plus', 'Apple TV+'],
      'peacock': ['Peacock Premium', 'Peacock'],
      'paramount-plus': ['Paramount Plus', 'Paramount+']
    };

    const selectedProviderNames = selectedServices.flatMap(serviceId => 
      serviceToTmdbName[serviceId] || []
    );

    // Get older popular movies and shows
    const [oldMoviesResponse, oldShowsResponse] = await Promise.all([
      getApiClient().get('/discover/movie', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 1000,
          'vote_average.gte': 7,
          'primary_release_date.lte': dateFilter,
          page: 1
        }
      }),
      getApiClient().get('/discover/tv', {
        params: {
          sort_by: 'popularity.desc',
          'vote_count.gte': 500,
          'vote_average.gte': 7.5,
          'first_air_date.lte': dateFilter,
          page: 1
        }
      })
    ]);

    const candidateContent = [
      ...oldMoviesResponse.data.results.map((movie: any) => ({ ...movie, media_type: 'movie' })),
      ...oldShowsResponse.data.results.map((show: any) => ({ ...show, media_type: 'tv' }))
    ].filter((item: any) => item.poster_path);

    // Check which content is available on user's platforms (simulating "leaving soon")
    const platformMatches: SearchResult[] = [];
    const otherContent: SearchResult[] = [];

    for (const item of candidateContent.slice(0, 50)) {
      try {
        const watchProviders = await getApiClient().get(
          `/${item.media_type}/${item.id}/watch/providers`
        );
        const usProviders = watchProviders.data.results?.US?.flatrate || [];
        
        const hasMatchingService = selectedServices.length === 0 || 
          usProviders.some((provider: any) => 
            selectedProviderNames.some(name => provider.provider_name.includes(name))
          );
        
        if (hasMatchingService) {
          platformMatches.push(item);
        } else {
          otherContent.push(item);
        }
        
        if (platformMatches.length >= 25) break;
      } catch (error) {
        console.warn(`Failed to check availability for ${item.title || item.name}`);
      }
    }

    // Combine results, prioritizing platform matches
    leavingSoon.push(...platformMatches);
    
    // If we don't have enough content from user's platforms, add general content
    if (leavingSoon.length < 10) {
      const additionalContent = otherContent.slice(0, 15 - leavingSoon.length);
      leavingSoon.push(...additionalContent);
    }

    // Sort by a combination of factors (simulating "leaving soon" urgency)
    const sortedResults = leavingSoon
      .sort((a, b) => {
        // Prioritize older content with higher ratings
        const ageA = a.release_date ? new Date().getFullYear() - new Date(a.release_date).getFullYear() : 0;
        const ageB = b.release_date ? new Date().getFullYear() - new Date(b.release_date).getFullYear() : 0;
        const scoreA = (a.vote_average || 0) * 0.7 + ageA * 0.3;
        const scoreB = (b.vote_average || 0) * 0.7 + ageB * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 25);

    console.log('⏳ getLeavingSoonFromPlatforms completed:', {
      resultCount: sortedResults.length,
      servicesChecked: selectedServices.length
    });

    return sortedResults;
  } catch (error) {
    console.error('⏳ getLeavingSoonFromPlatforms failed:', error);
    // Fallback to existing function
    return getExpiringContent();
  }
};

/**
 * Get content that has been trending in searches over the last 7 days
 */
export const getTopSearchesTrending = async (): Promise<SearchResult[]> => {
  try {
    console.log('🔍 getTopSearchesTrending called');

    // Check if TMDB token is available
    const token = TMDB_API_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ TMDB API unavailable - token not configured');
      return [];
    }

    // Get trending content for the past week (this represents search trends)
    const [
      trendingMoviesWeek,
      trendingShowsWeek,
      trendingMoviesDay,
      trendingShowsDay
    ] = await Promise.all([
      getApiClient().get('/trending/movie/week', { params: { page: 1 } }),
      getApiClient().get('/trending/tv/week', { params: { page: 1 } }),
      getApiClient().get('/trending/movie/day', { params: { page: 1 } }),
      getApiClient().get('/trending/tv/day', { params: { page: 1 } })
    ]);

    // Combine and score based on trending velocity
    const weeklyMovies = trendingMoviesWeek.data.results.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    }));

    const weeklyShows = trendingShowsWeek.data.results.map((show: any) => ({
      ...show,
      media_type: 'tv'
    }));

    const dailyMovies = trendingMoviesDay.data.results.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    }));

    const dailyShows = trendingShowsDay.data.results.map((show: any) => ({
      ...show,
      media_type: 'tv'
    }));

    // Merge and combine scores for items that appear in both daily and weekly
    const allContent = [...weeklyMovies, ...weeklyShows, ...dailyMovies, ...dailyShows]
      .filter((item: any) => item.poster_path);

    // Group by ID and calculate trending scores
    const contentMap = new Map<string, {item: SearchResult, weeklyScore: number, dailyScore: number}>();
    
    // Process weekly content
    [...weeklyMovies, ...weeklyShows].forEach((item: any) => {
      const key = `${item.id}-${item.media_type}`;
      const existing = contentMap.get(key);
      const weeklyScore = (item.popularity || 0) * 0.7;
      
      if (existing) {
        existing.weeklyScore += weeklyScore;
      } else {
        contentMap.set(key, {
          item,
          weeklyScore,
          dailyScore: 0
        });
      }
    });

    // Process daily content
    [...dailyMovies, ...dailyShows].forEach((item: any) => {
      const key = `${item.id}-${item.media_type}`;
      const existing = contentMap.get(key);
      const dailyScore = (item.popularity || 0) * 1.3;
      
      if (existing) {
        existing.dailyScore += dailyScore;
      } else {
        contentMap.set(key, {
          item,
          weeklyScore: 0,
          dailyScore
        });
      }
    });

    // Convert back to array and sort by combined trending score
    const topSearchResults = Array.from(contentMap.values())
      .sort((a, b) => {
        const scoreA = a.weeklyScore + a.dailyScore;
        const scoreB = b.weeklyScore + b.dailyScore;
        return scoreB - scoreA;
      })
      .map(entry => entry.item)
      .slice(0, 30);

    console.log('🔍 getTopSearchesTrending completed:', {
      resultCount: topSearchResults.length,
      topItems: topSearchResults.slice(0, 3).map((item: any) => ({
        title: item.title || item.name,
        popularity: item.popularity
      }))
    });

    return topSearchResults;
  } catch (error) {
    console.error('🔍 getTopSearchesTrending failed:', error);
    // Fallback to existing function
    return getTopSearches();
  }
};