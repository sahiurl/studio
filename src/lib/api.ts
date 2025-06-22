
import type {
  APIListResponse,
  APIDetailResponse,
  APISearchResponse,
  APISimilarResponse,
  APIError,
  SortOption,
  APIListItem,
  RawMoviesAPIResponse,
  RawAPISearchResponse,
  RawTVShowsAPIResponse,
} from '@/types';
import { API_BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_LISTINGS, PAGE_SIZE_SEARCH, TELEGRAM_BOT_USERNAME } from './constants';


async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorData: APIError | null = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      const errorMessage = errorData?.message || `API Error: ${response.status} ${response.statusText}`;
      console.error(`Failed to fetch ${url}: ${errorMessage}`, errorData);
      throw new Error(errorMessage);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Network or other error fetching ${url}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Fetch latest TV shows for homepage
export const getLatestTvShows = (page = 1, pageSize = 6): Promise<APIListResponse> => {
  return fetchAPI<RawTVShowsAPIResponse>(`/api/tvshows?sort_by=updated_on:desc&page=${page}&page_size=${pageSize}`)
    .then(data => ({
      results: (data.tv_shows || []).map(item => ({
        ...item,
        media_type: 'tv', 
      })),
      page: page,
      total_pages: Math.ceil((data.total_count || 0) / pageSize),
      total_results: data.total_count || 0,
    }));
};

// Fetch latest movies for homepage
export const getLatestMovies = (page = 1, pageSize = 6): Promise<APIListResponse> => { // Changed pageSize to 6 for homepage display consistency
  return fetchAPI<RawMoviesAPIResponse>(`/api/movies?sort_by=updated_on:desc&page=${page}&page_size=${pageSize}`)
    .then(data => ({
      results: (data.movies || []).map(item => ({
        ...item,
        media_type: item.media_type || 'movie',
      })),
      page: page,
      total_pages: Math.ceil((data.total_count || 0) / pageSize),
      total_results: data.total_count || 0,
    }));
};


// Fetch movies with sorting and pagination
export const getMovies = async (page = 1, pageSize = PAGE_SIZE_LISTINGS, sortBy: SortOption = 'updated_on:desc'): Promise<APIListResponse> => {
  const data = await fetchAPI<RawMoviesAPIResponse>(`/api/movies?sort_by=${sortBy}&page=${page}&page_size=${pageSize}`);
  return {
    results: (data.movies || []).map(movie => ({
      ...movie,
      media_type: 'movie', 
    })),
    page: page,
    total_pages: Math.ceil((data.total_count || 0) / pageSize),
    total_results: data.total_count || 0,
  };
};

// Fetch TV shows with sorting and pagination
export const getTvShows = (page = 1, pageSize = PAGE_SIZE_LISTINGS, sortBy: SortOption = 'updated_on:desc'): Promise<APIListResponse> => {
  return fetchAPI<RawTVShowsAPIResponse>(`/api/tvshows?sort_by=${sortBy}&page=${page}&page_size=${pageSize}`)
    .then(data => ({
      results: (data.tv_shows || []).map(item => ({
        ...item,
        media_type: 'tv', 
      })),
      page: page,
      total_pages: Math.ceil((data.total_count || 0) / pageSize),
      total_results: data.total_count || 0,
    }));
};

// Fetch media details (movie or TV show) by TMDB ID
export const getMediaDetails = (tmdbId: number | string): Promise<APIDetailResponse> => {
  return fetchAPI<APIDetailResponse>(`/api/id/${tmdbId}`);
};

// Search for media
export const searchMedia = async (searchText: string, page = 1, pageSize = PAGE_SIZE_SEARCH): Promise<APISearchResponse> => {
  const encodedQuery = encodeURIComponent(searchText);
  const data = await fetchAPI<RawAPISearchResponse>(`/api/search/?query=${encodedQuery}&page=${page}&page_size=${pageSize}`);
  return {
    results: (data.results || []).map(item => ({
      ...item,
      media_type: item.media_type === 'episode' ? 'tv' : item.media_type || (item.title.toLowerCase().includes('series') ? 'tv' : 'movie'),
    })),
    page: page,
    total_pages: Math.ceil((data.total_count || 0) / pageSize),
    total_results: data.total_count || 0,
  };
};


// Fetch similar media
export const getSimilarMedia = (tmdbId: number | string, mediaType: 'movie' | 'tv', page = 1, pageSize = 10): Promise<APISimilarResponse> => {
  return fetchAPI<APISimilarResponse>(`/api/similar?tmdb_id=${tmdbId}&media_type=${mediaType}&page=${page}&page_size=${pageSize}`);
};

// Construct stream URL.
export const getStreamUrl = (contentId: string, name: string): string => {
  // Use standard encodeURIComponent, which encodes spaces as %20
  const encodedName = encodeURIComponent(name); 
  return `${API_BASE_URL}/dl/${contentId}/${encodedName}`;
};

// Construct Telegram file URL.
export const getTelegramFileUrl = (tmdbId: number | string, quality: string): string => {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=file_${tmdbId}_${quality}`;
}

// Watch page SSR helper (conceptual)
export const getWatchPageData = async (tmdbId: string | number) => {
  try {
    const details = await getMediaDetails(tmdbId);
    if (details.media_type === 'movie' && details.telegram && details.telegram.length > 0) {
      const firstStreamableLink = details.telegram[0];
      return {
        title: details.title,
        streamUrl: getStreamUrl(firstStreamableLink.id, firstStreamableLink.name),
        poster: details.poster,
      };
    } else if (details.media_type === 'tv' ) {
      // For TV, this would need to find the first streamable episode
      // For now, placeholder logic
      if (details.seasons?.[0]?.episodes?.[0]?.telegram?.[0]) {
        const firstEpisodeLink = details.seasons[0].episodes[0].telegram[0];
        const firstEpisodeDetails = details.seasons[0].episodes[0];
        return {
          title: `${details.title} - S${details.seasons[0].season_number}E${firstEpisodeDetails.episode_number}: ${firstEpisodeDetails.title}`,
          streamUrl: getStreamUrl(firstEpisodeLink.id, firstEpisodeLink.name),
          poster: details.poster,
        };
      }
    }
    throw new Error('Unsupported media type or no streamable content found for watch page.');
  } catch (error) {
    console.error(`Error preparing watch page data for ${tmdbId}:`, error);
    throw error;
  }
};

