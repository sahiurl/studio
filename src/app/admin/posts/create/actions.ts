
'use server';

import { TMDB_API_BASE_URL, TMDB_API_KEY, TMDB_IMAGE_BASE_URL } from '@/lib/constants';
import type { 
  TMDBMinimalSearchResult, 
  TMDBFormattedSearchResult, 
  TMDBMovieDetails, 
  TMDBTVDetails,
  FormPopulatableDetails
} from '@/types';

interface TMDBListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const constructPosterUrl = (path: string | null, size: string = 'w500') => {
  return path ? `${TMDB_IMAGE_BASE_URL}${size}${path}` : `https://placehold.co/500x750.png?text=No+Image`;
};

const constructBackdropUrl = (path: string | null, size: string = 'original') => {
  return path ? `${TMDB_IMAGE_BASE_URL}${size}${path}` : `https://placehold.co/1280x720.png?text=No+Image`;
};

const getYearFromDate = (dateString?: string): number | string => {
  if (!dateString) return 'N/A';
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? 'N/A' : year;
};

export async function searchTMDBAction(
  query: string,
  mediaType: 'movie' | 'tv'
): Promise<TMDBFormattedSearchResult[]> {
  if (!query.trim()) {
    return [];
  }
  const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
  const url = `${TMDB_API_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TMDB API Error (${endpoint}): ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("TMDB Error Body:", errorBody);
      return [];
    }
    const data: TMDBListResponse<TMDBMinimalSearchResult> = await response.json();
    
    return data.results.map((item) => ({
      id: item.id,
      title: mediaType === 'movie' ? item.title : (item as any).name, // TMDB uses 'name' for TV shows
      posterUrl: constructPosterUrl(item.poster_path, 'w185'),
      year: getYearFromDate(mediaType === 'movie' ? item.release_date : item.first_air_date),
      media_type: mediaType, // Keep track of original search type
    }));
  } catch (error) {
    console.error(`Error fetching TMDB search results (${endpoint}):`, error);
    return [];
  }
}

export async function getTMDBDetailsAction(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<FormPopulatableDetails | null> {
  const endpoint = mediaType === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;
  const url = `${TMDB_API_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TMDB API Error (details ${mediaType}): ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("TMDB Error Body:", errorBody);
      return null;
    }

    if (mediaType === 'movie') {
      const data: TMDBMovieDetails = await response.json();
      return {
        title: data.title,
        description: data.overview || '',
        posterUrl: constructPosterUrl(data.poster_path),
        backdropUrl: constructBackdropUrl(data.backdrop_path),
        releaseYear: typeof getYearFromDate(data.release_date) === 'number' ? getYearFromDate(data.release_date) as number : new Date().getFullYear(),
        rating: data.vote_average > 0 ? parseFloat(data.vote_average.toFixed(1)) : undefined,
        genres: data.genres.map(g => g.name).join(', '),
        languages: data.spoken_languages.map(l => l.iso_639_1).filter(Boolean).join(', ') || 'en', // Default to 'en' if none
        runtime: data.runtime || undefined,
        mediaType: 'movie',
      };
    } else { // mediaType === 'tv'
      const data: TMDBTVDetails = await response.json();
      return {
        title: data.name,
        description: data.overview || '',
        posterUrl: constructPosterUrl(data.poster_path),
        backdropUrl: constructBackdropUrl(data.backdrop_path),
        releaseYear: typeof getYearFromDate(data.first_air_date) === 'number' ? getYearFromDate(data.first_air_date) as number : new Date().getFullYear(),
        rating: data.vote_average > 0 ? parseFloat(data.vote_average.toFixed(1)) : undefined,
        genres: data.genres.map(g => g.name).join(', '),
        languages: data.spoken_languages.map(l => l.iso_639_1).filter(Boolean).join(', ') || 'en',
        totalSeasons: data.number_of_seasons || undefined,
        totalEpisodes: data.number_of_episodes || undefined,
        mediaType: 'tv',
      };
    }
  } catch (error) {
    console.error(`Error fetching TMDB details (${mediaType} ${tmdbId}):`, error);
    return null;
  }
}
