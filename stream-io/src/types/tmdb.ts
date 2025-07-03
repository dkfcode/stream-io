export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  media_type: 'movie' | 'tv' | 'person';
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  description?: string;
  genre_ids?: number[];
  popularity?: number;
  platform?: string;
  known_for_department?: string;
  known_for?: SearchResult[];
  origin_country?: string[];
  channel_info?: {
    id: string;
    name: string;
    number: string;
    category: string;
    logo: string;
    popularity: number;
  };
}

export interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: SearchResult[];
  popularity: number;
}

export interface NetworkResult {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface EnhancedSearchResult {
  movies: SearchResult[];
  shows: SearchResult[];
  people: PersonResult[];
  networks: NetworkResult[];
}

export interface RecentSearch {
  id: number;
  title: string;
  media_type: 'movie' | 'tv' | 'person' | 'network';
  poster_path?: string | null;
  profile_path?: string | null;
  logo_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  timestamp: number;
  query: string;
}

export interface StreamingService {
  name: string;
  url: string;
  logo: string;
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

// TMDB API Response Interfaces
export interface TmdbProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface TmdbWatchProviders {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  ads?: TmdbProvider[];
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TmdbTVShow {
  id: number;
  name: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  origin_country: string[];
  original_language: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: (TmdbMovie | TmdbTVShow)[];
  popularity: number;
  adult: boolean;
  gender: number;
}

export interface TmdbNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbDiscoverResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
  guest_stars: TmdbPerson[];
  crew: TmdbPerson[];
}

export interface TmdbSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  episodes?: TmdbEpisode[];
}

export interface TmdbTVShowDetail extends TmdbTVShow {
  seasons: TmdbSeason[];
  networks: TmdbNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  genres: { id: number; name: string; }[];
  production_companies: { id: number; name: string; logo_path: string | null; }[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  genres: { id: number; name: string; }[];
  production_companies: { id: number; name: string; logo_path: string | null; }[];
  production_countries: { iso_3166_1: string; name: string; }[];
  spoken_languages: { iso_639_1: string; name: string; }[];
}

export interface TmdbVideoResponse {
  id: number;
  results: {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
    published_at: string;
    size: number;
    iso_639_1: string;
    iso_3166_1: string;
  }[];
}

export interface TmdbWatchProvidersResponse {
  id: number;
  results: Record<string, TmdbWatchProviders>;
}

export interface ActorTVShowEpisodeResult {
  showDetails: TmdbTVShowDetail;
  actorEpisodes: Array<{
    seasonNumber: number;
    seasonName: string;
    episodes: TmdbEpisode[];
  }>;
}

// Enhanced TMDB API Response Interfaces
export interface TmdbProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface TmdbWatchProviders {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  ads?: TmdbProvider[];
}

// Enhanced Genre Interface
export interface TmdbGenre {
  id: number;
  name: string;
}

// Enhanced Production Company Interface
export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// Enhanced Production Country Interface
export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

// Enhanced Spoken Language Interface
export interface TmdbSpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name: string;
}

// Enhanced Cast Member Interface
export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number | null;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id?: number;
}

// Enhanced Crew Member Interface
export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  credit_id: string;
  adult: boolean;
  gender: number | null;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
}

// Enhanced Credits Interface
export interface TmdbCredits {
  id?: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

// Enhanced Movie Interface
export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

// Enhanced Movie Detail Interface
export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  production_countries: TmdbProductionCountry[];
  spoken_languages: TmdbSpokenLanguage[];
  credits?: TmdbCredits;
  videos?: TmdbVideoResponse;
  watch_providers?: TmdbWatchProvidersResponse;
  similar?: TmdbSearchResponse<TmdbMovie>;
  recommendations?: TmdbSearchResponse<TmdbMovie>;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  imdb_id?: string;
  homepage?: string;
}

export interface TmdbTVShow {
  id: number;
  name: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  origin_country: string[];
  original_language: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: (TmdbMovie | TmdbTVShow)[];
  popularity: number;
  adult: boolean;
  gender: number;
}

// Enhanced Person Detail Interface
export interface TmdbPersonDetail extends TmdbPerson {
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
  movie_credits?: {
    cast: TmdbMovie[];
    crew: TmdbMovie[];
  };
  tv_credits?: {
    cast: TmdbTVShow[];
    crew: TmdbTVShow[];
  };
  combined_credits?: {
    cast: (TmdbMovie | TmdbTVShow)[];
    crew: (TmdbMovie | TmdbTVShow)[];
  };
  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
}

export interface TmdbNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// Enhanced Network Detail Interface
export interface TmdbNetworkDetail extends TmdbNetwork {
  headquarters: string;
  homepage: string;
}

export interface TmdbSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbDiscoverResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
  dates?: {
    maximum: string;
    minimum: string;
  };
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  guest_stars: TmdbPerson[];
  crew: TmdbPerson[];
  production_code: string;
}

export interface TmdbSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  episodes?: TmdbEpisode[];
}

// Enhanced Season Detail Interface
export interface TmdbSeasonDetail extends TmdbSeason {
  _id: string;
  episodes: TmdbEpisode[];
  credits?: TmdbCredits;
  external_ids?: {
    freebase_id: string | null;
    freebase_mid: string | null;
    tvdb_id: number | null;
    tvrage_id: number | null;
  };
  videos?: TmdbVideoResponse;
}

// Enhanced TV Show Detail Interface
export interface TmdbTVShowDetail extends TmdbTVShow {
  seasons: TmdbSeason[];
  networks: TmdbNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  production_countries: TmdbProductionCountry[];
  spoken_languages: TmdbSpokenLanguage[];
  created_by: {
    id: number;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  credits?: TmdbCredits;
  videos?: TmdbVideoResponse;
  watch_providers?: TmdbWatchProvidersResponse;
  similar?: TmdbSearchResponse<TmdbTVShow>;
  recommendations?: TmdbSearchResponse<TmdbTVShow>;
  status: string;
  type: string;
  tagline: string;
  homepage: string | null;
  in_production: boolean;
  languages: string[];
  last_air_date: string | null;
  last_episode_to_air: TmdbEpisode | null;
  next_episode_to_air: TmdbEpisode | null;
}

// Enhanced Video Response Interface
export interface TmdbVideoResponse {
  id: number;
  results: {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
    published_at: string;
    size: number;
    iso_639_1: string;
    iso_3166_1: string;
  }[];
}

// Enhanced Watch Providers Response Interface
export interface TmdbWatchProvidersResponse {
  id: number;
  results: Record<string, TmdbWatchProviders>;
}

// Enhanced Images Response Interface
export interface TmdbImagesResponse {
  id: number;
  backdrops: {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
    width: number;
  }[];
  posters: {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
    width: number;
  }[];
  logos?: {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
    width: number;
  }[];
}

// Enhanced Reviews Response Interface
export interface TmdbReviewsResponse {
  id: number;
  page: number;
  results: {
    id: string;
    author: string;
    author_details: {
      name: string;
      username: string;
      avatar_path: string | null;
      rating: number | null;
    };
    content: string;
    created_at: string;
    updated_at: string;
    url: string;
  }[];
  total_pages: number;
  total_results: number;
}

// Configuration Interface
export interface TmdbConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
  change_keys: string[];
}

// Trending Interface
export interface TmdbTrendingResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ActorTVShowEpisodeResult {
  showDetails: TmdbTVShowDetail;
  actorEpisodes: Array<{
    seasonNumber: number;
    seasonName: string;
    episodes: TmdbEpisode[];
  }>;
}

// Type aliases for backward compatibility
export type TmdbResponse<T> = TmdbSearchResponse<T>;
export type TmdbVideo = TmdbVideoResponse;
export type TmdbPersonCombinedCredits = TmdbPersonDetail['combined_credits'];