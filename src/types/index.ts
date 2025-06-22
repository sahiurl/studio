
// Represents an item in a list from /api/movies or /api/tvshows
export interface APIListItem {
  tmdb_id: number | string; // Allow string for Firestore IDs
  title: string; // Movie title or TV show name
  poster: string | null; // Full URL to poster image
  backdrop?: string | null; // Full URL, for hero slider
  rating?: number | null; // Allow null
  release_year?: number;
  description?: string; // For hero slider items
  media_type: 'movie' | 'tv'; // To distinguish type
  rip?: string; // e.g., WEB-DL, HDTC
  // Fields that might be present in TV show list items from API
  total_seasons?: number;
  total_episodes?: number;
  status?: string;
  updated_on?: string;
  languages?: string[];
}

// Represents the paginated response structure for /api/movies and /api/tvshows
export interface APIListResponse {
  results: APIListItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Interface for the raw API response for movies list from /api/movies
export interface RawMoviesAPIResponse {
  total_count: number;
  movies: APIListItem[]; // Assumes movies array directly contains items compatible with APIListItem
}

// Interface for the raw API response for TV shows list from /api/tvshows
export interface RawTVShowsAPIResponse {
  total_count: number;
  tv_shows: APIListItem[]; // API returns 'tv_shows' key
}


// Represents an individual episode's details, part of a season
export interface APIEpisodeDetail {
  id?: number; 
  tmdb_id?: number; 
  title: string;
  description?: string | null;
  thumbnail?: string | null; 
  episode_number: number; 
  season_number?: number; 
  episode_backdrop?: string | null; 
  telegram?: APITelegramItem[]; 
}

// Represents a season's details, including its episodes
export interface APISeasonDetail {
  season_number: number; 
  title?: string; 
  description?: string | null;
  poster?: string | null; 
  episodes: APIEpisodeDetail[];
}

// Represents a download link item from the 'telegram' array (API) or 'downloadOptions' (Firestore)
export interface APITelegramItem {
  quality: string;
  id: string; // For API: the API's internal ID for the link. For Firestore: can be the direct URL.
  name: string;
  size?: string;
  // New fields for Firestore-sourced links
  isFirestoreLink?: boolean;
  linkUrl?: string; // Actual URL from Firestore
  linkType?: 'direct' | 'telegram'; // Type from Firestore
}

// Represents the detailed response for a movie from /api/id/{tmdb_id} or Firestore
export interface APIMovieDetail {
  id?: number; // TMDB's internal DB ID (from API source)
  tmdb_id: number | string; // Numeric TMDB ID (API source) or string Firestore Doc ID
  title: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  release_year: number;
  rating: number | null;
  genres: string[];
  media_type: 'movie';
  rip?: string;
  runtime?: number | null;
  languages?: string[];
  telegram?: APITelegramItem[];
  isFirestoreSource?: boolean; // True if this data comes from Firestore
}

// Represents the detailed response for a TV show from /api/id/{tmdb_id} or Firestore
export interface APITVShowDetail {
  id?: number; // TMDB's internal DB ID (from API source)
  tmdb_id: number | string; // Numeric TMDB ID (API source) or string Firestore Doc ID
  title: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  release_year: number;
  rating: number | null;
  genres: string[];
  seasons?: APISeasonDetail[]; // Optional: API source will have this, Firestore source (current schema) won't.
  media_type: 'tv';
  runtime?: number | null;
  languages?: string[];
  telegram?: APITelegramItem[]; // For Firestore source, this will be a flat list from downloadOptions
  total_seasons?: number | null;
  total_episodes?: number | null;
  status?: string;
  updated_on?: string;
  rip?: string;
  isFirestoreSource?: boolean; // True if this data comes from Firestore
}

// Union type for detailed responses
export type APIDetailResponse = APIMovieDetail | APITVShowDetail;

// Represents an item in the search results from /api/search
export interface APISearchResultItem {
  tmdb_id: number;
  title: string;
  description: string | null;
  poster: string | null; 
  media_type: 'movie' | 'tv' | 'episode'; 
  release_year?: number;
  rating?: number;
  rip?: string;
  genres?: string[];
  backdrop?: string | null;
  _id?: string; 
}

// Interface for the raw API response for search results from /api/search
export interface RawAPISearchResponse {
  total_count: number;
  results: APISearchResultItem[];
}

// Represents the paginated response structure for /api/search
export interface APISearchResponse {
  results: APISearchResultItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Represents an item for /api/similar
export interface APISimilarItem {
  tmdb_id: number;
  title: string;
  poster: string | null; 
  media_type: 'movie' | 'tv';
  rating?: number;
  release_year?: number;
  rip?: string;
}

export interface APISimilarResponse {
  results: APISimilarItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Generic error response from API
export interface APIError {
  message: string;
  details?: string; 
}

// Type for sort options used in UI and API calls
export type SortOption =
  | 'rating:desc'
  | 'rating:asc'
  | 'release_year:desc'
  | 'release_year:asc'
  | 'updated_on:desc'
  | 'updated_on:asc'
  | 'title:asc'
  | 'title:desc';


// Types for Admin Create Post Form
export type AdminPostFormLinkItem = {
  name: string;
  url: string;
  type: 'direct' | 'telegram';
  size?: string;
};

export type AdminPostFormQualityOption = {
  qualityLabel: string;
  links: AdminPostFormLinkItem[];
};

export type AdminPostFormData = {
  title: string;
  mediaType: 'movie' | 'tv';
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  releaseYear: number;
  rating?: number;
  ripQuality: string;
  languages: string[]; 
  genres: string[]; // Changed from string to string[] for checkbox group
  runtime?: number; // Only for movies
  totalSeasons?: number; // Only for TV
  totalEpisodes?: number; // Only for TV
  telegramOptions?: AdminPostFormQualityOption[]; 
  directDownloadOptions?: AdminPostFormQualityOption[];
  seoKeywords?: string[];
};

// Type for data as stored in Firestore (and potentially used for display)
export interface FirestorePostData extends Omit<AdminPostFormData, 'backdropUrl' | 'rating' | 'runtime' | 'totalSeasons' | 'totalEpisodes' | 'telegramOptions' | 'directDownloadOptions' | 'seoKeywords'> {
  id: string; // Firestore document ID
  createdAt: any; // Firebase Timestamp type, or Date if converted by Firestore SDK
  updatedAt?: any; // Firebase Timestamp for updates
  backdropUrl: string | null; 
  rating: number | null; 
  runtime: number | null; 
  totalSeasons: number | null;
  totalEpisodes: number | null;
  telegramOptions?: AdminPostFormQualityOption[]; 
  directDownloadOptions?: AdminPostFormQualityOption[]; 
  downloadOptions?: AdminPostFormQualityOption[]; // Keep for potential backward compatibility during migration if needed
  seoKeywords?: string[];
}

// TMDB API related types
export interface TMDBMinimalSearchResult {
  id: number;
  title: string; // 'title' for movie, 'name' for TV
  poster_path: string | null;
  release_date?: string; // For movies
  first_air_date?: string; // For TV
  media_type: 'movie' | 'tv'; // Added to ensure we know what we searched for
}

export interface TMDBFormattedSearchResult extends Omit<TMDBMinimalSearchResult, 'poster_path' | 'release_date' | 'first_air_date'> {
  posterUrl: string | null;
  year: number | string; // string if date is invalid
}


export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genres: TMDBGenre[];
  spoken_languages: TMDBSpokenLanguage[];
  runtime: number | null;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: TMDBGenre[];
  spoken_languages: TMDBSpokenLanguage[];
  number_of_seasons: number;
  number_of_episodes: number;
}

export type TMDBGenericDetails = TMDBMovieDetails | TMDBTVDetails;

// This is the data structure returned by getTMDBDetailsAction
export interface FormPopulatableDetails {
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  releaseYear: number;
  rating?: number;
  genres: string; // Comma-separated genre names from TMDB
  languages: string; // Comma-separated string of ISO 639-1 codes
  runtime?: number; // Movie
  totalSeasons?: number; // TV
  totalEpisodes?: number; // TV
  mediaType: 'movie' | 'tv';
}

// Ad Management Types
export type AdExpiryUnit = 'minutes' | 'hours' | 'days';

export interface AdFormData {
  title: string;
  posterImageUrl: string;
  buttonLabel: string;
  targetUrl: string;
  expiryValue: number;
  expiryUnit: AdExpiryUnit;
}

export interface FirestoreAdData extends AdFormData {
  id: string; // Firestore document ID
  createdAt: any; // Firebase Timestamp
  expiresAt: any; // Firebase Timestamp
  isActive?: boolean; // Derived field, true if expiresAt is in the future
}

// Site Settings Types
export interface SiteSettings {
  appUrl?: string; 
  telegramChannelUrl?: string;
  howToDownloadVideoUrl?: string;
  howToDownloadInstructions?: string;
  disclaimerContent?: string;
  privacyPolicyContent?: string;
  telegramBotToken?: string;
  telegramChannelIds?: string; // Comma-separated list of channel IDs/usernames
  enableUrlShortener?: boolean;
  urlShortenerApiUrl?: string;
  urlShortenerApiKey?: string;
  enableCreateWebsiteButton?: boolean; // Controls visibility of the special button
  createWebsiteButtonText?: string; // Text for the special button
}

export interface AdminSiteSettingsFormData extends SiteSettings {
  // This field is only for client-side form submission when trying to disable the special button
  disableButtonPasswordAttempt?: string; 
}

// Feedback & Request Types
export type FeedbackType = 'feedback' | 'request' | 'other';
export type FeedbackStatus = 'pending' | 'approved' | 'rejected' | 'viewed';

export interface FeedbackFormData {
  type: FeedbackType;
  message: string;
  email?: string;
}

export interface FirestoreFeedbackData extends FeedbackFormData {
  id: string; // Firestore document ID
  status: FeedbackStatus;
  createdAt: any; // Firebase Timestamp
  updatedAt?: any; // Firebase Timestamp for status changes
}

    