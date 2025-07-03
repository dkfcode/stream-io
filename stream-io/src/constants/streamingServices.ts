export interface StreamingService {
  id: string;
  name: string;
  logo: string;
  color: string;
  providerId: number; // TMDB provider ID
}

export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', logo: '/images/logos/netflix/logo.ico', color: '#E50914', providerId: 8 },
  { id: 'amazon-prime', name: 'Amazon Prime Video', logo: '/images/logos/prime-video/logo.png', color: '#00A8E1', providerId: 9 },
  { id: 'disney-plus', name: 'Disney+', logo: '/images/logos/disney-plus/logo.png', color: '#113CCF', providerId: 337 },
  { id: 'hulu', name: 'Hulu', logo: '/images/logos/hulu/logo.png', color: '#1CE783', providerId: 15 },
  { id: 'hbo-max', name: 'Max', logo: '/images/logos/max/logo.png', color: '#9D34DA', providerId: 384 },
  { id: 'apple-tv', name: 'Apple TV+', logo: '/images/logos/apple-tv/logo.png', color: '#000000', providerId: 350 },
  { id: 'peacock', name: 'Peacock', logo: '/images/logos/peacock/logo.png', color: '#0066CC', providerId: 386 },
  { id: 'paramount-plus', name: 'Paramount+', logo: '/images/logos/paramount-plus/logo.jpg', color: '#0066FF', providerId: 531 },
  { id: 'crunchyroll', name: 'Crunchyroll', logo: '/images/logos/crunchyroll/logo.png', color: '#FF6600', providerId: 283 },
  { id: 'starz', name: 'Starz', logo: '/images/logos/starz/logo.png', color: '#000000', providerId: 43 }
]; 