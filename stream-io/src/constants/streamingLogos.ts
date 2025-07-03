// Import local logo assets
import appleTvLogo from '../assets/images/logos/apple-tv/logo.png';
import appleTvFallback from '../assets/images/logos/apple-tv/fallback.ico';
import netflixLogo from '../assets/images/logos/netflix/logo.ico';
import netflixFallback from '../assets/images/logos/netflix/fallback.png';
import disneyLogo from '../assets/images/logos/disney-plus/logo.png';
import primeLogo from '../assets/images/logos/prime-video/logo.png';
import huluLogo from '../assets/images/logos/hulu/logo.png';
import maxLogo from '../assets/images/logos/max/logo.png';
import peacockLogo from '../assets/images/logos/peacock/logo.png';
import paramountLogo from '../assets/images/logos/paramount-plus/logo.jpg';

export interface StreamingService {
  id: string;
  name: string;
  primaryLogo: string;
  fallbackLogos: string[];
  icon: string;
  color: string;
}

export const STREAMING_LOGOS: Record<string, StreamingService> = {
  'apple': {
    id: 'apple',
    name: 'Apple TV+',
    primaryLogo: appleTvLogo,
    fallbackLogos: [appleTvFallback],
    icon: '🍎',
    color: '#000000'
  },
  'netflix': {
    id: 'netflix',
    name: 'Netflix',
    primaryLogo: netflixLogo,
    fallbackLogos: [netflixFallback],
    icon: '🔴',
    color: '#E50914'
  },
  'disney': {
    id: 'disney',
    name: 'Disney+',
    primaryLogo: disneyLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '🏰',
    color: '#113CCF'
  },
  'prime': {
    id: 'prime',
    name: 'Prime Video',
    primaryLogo: primeLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '📦',
    color: '#00A8E1'
  },
  'hulu': {
    id: 'hulu',
    name: 'Hulu',
    primaryLogo: huluLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '💚',
    color: '#1CE783'
  },
  'max': {
    id: 'max',
    name: 'Max',
    primaryLogo: maxLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '👑',
    color: '#9D34DA'
  },
  'peacock': {
    id: 'peacock',
    name: 'Peacock',
    primaryLogo: peacockLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '🦚',
    color: '#0066CC'
  },
  'paramount': {
    id: 'paramount',
    name: 'Paramount+',
    primaryLogo: paramountLogo,
    fallbackLogos: [], // No fallback available - will use icon
    icon: '⭐',
    color: '#0066FF'
  }
};

export const getStreamingService = (serviceId: string): StreamingService | null => {
  return STREAMING_LOGOS[serviceId] || null;
}; 