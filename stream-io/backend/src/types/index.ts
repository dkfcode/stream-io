// Database Models
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  verification_token?: string;
  verification_expires_at?: Date;
  password_reset_token?: string;
  password_reset_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  device_info?: any;
  ip_address?: string;
  created_at: Date;
  last_used_at: Date;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  selected_genres: string[];
  selected_services: string[];
  selected_providers: string[];
  language: string;
  region: string;
  timezone: string;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  auto_play_trailers: boolean;
  mature_content: boolean;
  privacy_mode: boolean;
  data_sharing: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  list_type: 'favorites' | 'watch_later' | 'watched' | 'custom';
  sort_order: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  release_date?: Date;
  rating?: number;
  genres?: string[];
  streaming_platforms?: StreamingPlatform[];
  notes?: string;
  watched_date?: Date;
  is_watched: boolean;
  added_at: Date;
  updated_at: Date;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  result_count: number;
  search_type: 'general' | 'ai' | 'voice';
  filters?: any;
  created_at: Date;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  content_id?: number;
  content_type?: 'movie' | 'tv';
  metadata?: any;
  created_at: Date;
}

// API Request/Response Types
export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TokenPayload {
  user_id: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface UpdatePreferencesRequest {
  selected_genres?: string[];
  selected_services?: string[];
  selected_providers?: string[];
  language?: string;
  region?: string;
  timezone?: string;
  theme?: string;
}

export interface UpdateSettingsRequest {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  auto_play_trailers?: boolean;
  mature_content?: boolean;
  privacy_mode?: boolean;
  data_sharing?: boolean;
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface AddToWatchlistRequest {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  release_date?: string;
  rating?: number;
  genres?: string[];
  streaming_platforms?: StreamingPlatform[];
  notes?: string;
}

export interface UpdateWatchlistItemRequest {
  notes?: string;
  is_watched?: boolean;
  watched_date?: Date;
}

// External API Types
export interface StreamingPlatform {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
}

export interface GeminiSearchRequest {
  query: string;
  context?: string;
  user_preferences?: UserPreferences;
}

export interface GeminiSearchResponse {
  interpretation: string;
  search_suggestions: string[];
  content_recommendations: TMDBSearchResult[];
  confidence: number;
}

export interface GracenoteProgram {
  id: string;
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  duration: number;
  channel: string;
  network: string;
  genre: string;
  rating?: string;
  is_live: boolean;
  is_new: boolean;
}

// Validation Schemas
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Express Request Extensions
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password_hash'>;
  token?: TokenPayload;
}

// Service Interfaces
export interface DatabaseService {
  query(text: string, params?: any[]): Promise<any>;
  getClient(): Promise<any>;
  transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}

export interface AuthService {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  refreshToken(refresh_token: string): Promise<AuthResponse>;
  logout(refresh_token: string): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, new_password: string): Promise<boolean>;
}

export interface UserService {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  getUserPreferences(user_id: string): Promise<UserPreferences>;
  updateUserPreferences(user_id: string, data: UpdatePreferencesRequest): Promise<UserPreferences>;
  getUserSettings(user_id: string): Promise<UserSettings>;
  updateUserSettings(user_id: string, data: UpdateSettingsRequest): Promise<UserSettings>;
}

export interface WatchlistService {
  getUserWatchlists(user_id: string): Promise<Watchlist[]>;
  getWatchlist(id: string): Promise<Watchlist | null>;
  createWatchlist(user_id: string, data: CreateWatchlistRequest): Promise<Watchlist>;
  updateWatchlist(id: string, data: Partial<Watchlist>): Promise<Watchlist>;
  deleteWatchlist(id: string): Promise<boolean>;
  getWatchlistItems(watchlist_id: string): Promise<WatchlistItem[]>;
  addToWatchlist(watchlist_id: string, data: AddToWatchlistRequest): Promise<WatchlistItem>;
  updateWatchlistItem(id: string, data: UpdateWatchlistItemRequest): Promise<WatchlistItem>;
  removeFromWatchlist(id: string): Promise<boolean>;
} 