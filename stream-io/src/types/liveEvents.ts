export interface SportsTeam {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
  conference?: string;
  division?: string;
  league?: string;
  record?: {
    wins: number;
    losses: number;
    ties?: number;
  };
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  category: string;
  subcategory?: string;
  isLive: boolean;
  venue?: string;
  location?: string;
}

export interface SportsEvent extends LiveEvent {
  matchup: {
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
    status: 'upcoming' | 'live' | 'halftime' | 'final' | 'postponed';
  };
  league: string;
  season?: string;
  week?: number;
  playoffs?: boolean;
} 