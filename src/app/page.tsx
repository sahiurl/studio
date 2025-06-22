
import { Header } from '@/components/layout/header';
// Footer import explicitly removed
import { MediaGridSection } from '@/components/media/media-grid-section';
import { getLatestMovies, getLatestTvShows } from '@/lib/api'; 
import type { APIListItem, APIListResponse, FirestorePostData, FirestoreAdData } from '@/types';
import { db, getActiveAds } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { AdBanner } from '@/components/ads/ad-banner';

const HOMEPAGE_SECTION_ITEM_COUNT = 12;

interface HomePageSectionData {
  items: APIListItem[];
  total_results: number;
}

interface AssignedAdsData {
  header: FirestoreAdData | null;
  movies: FirestoreAdData | null;
  tvShows: FirestoreAdData | null;
}

interface HomePageData {
  featuredPosts: HomePageSectionData;
  latestMovies: HomePageSectionData;
  latestTvShows: HomePageSectionData;
  assignedAds: AssignedAdsData;
}

async function getHomePageData(): Promise<HomePageData> {
  try {
    const postsCol = collection(db, 'posts');
    const postsQuery = query(postsCol, orderBy('createdAt', 'desc'), limit(HOMEPAGE_SECTION_ITEM_COUNT));
    const postsSnapshot = await getDocs(postsQuery);
    
    const featuredItems: APIListItem[] = postsSnapshot.docs.map((doc) => {
      const data = doc.data() as Omit<FirestorePostData, 'id' | 'createdAt'> & { createdAt: Timestamp };
      return {
        tmdb_id: doc.id,
        title: data.title,
        poster: data.posterUrl,
        rating: data.rating ?? undefined,
        release_year: data.releaseYear,
        media_type: data.mediaType,
        description: data.description,
        rip: data.ripQuality,
      };
    });

    const [latestMoviesData, latestTvShowsData, allActiveAdsData] = await Promise.all([
      getLatestMovies(1, HOMEPAGE_SECTION_ITEM_COUNT).catch(e => { console.error("Failed to fetch latest movies", e); return { results: [], total_results: 0, page: 1, total_pages: 0 } as APIListResponse; }),
      getLatestTvShows(1, HOMEPAGE_SECTION_ITEM_COUNT).catch(e => { console.error("Failed to fetch latest TV shows", e); return { results: [], total_results: 0, page: 1, total_pages: 0 } as APIListResponse; }),
      getActiveAds().catch(e => { console.error("Failed to fetch active ads", e); return []; })
    ]);
    
    let adForHeaderSlot: FirestoreAdData | null = null;
    let adForMoviesSlot: FirestoreAdData | null = null;
    let adForTvShowsSlot: FirestoreAdData | null = null;

    if (allActiveAdsData.length > 0) {
      adForHeaderSlot = allActiveAdsData[0];
      adForMoviesSlot = allActiveAdsData[1 % allActiveAdsData.length];
      adForTvShowsSlot = allActiveAdsData[2 % allActiveAdsData.length];
    }
    
    return {
      featuredPosts: {
        items: featuredItems,
        total_results: featuredItems.length, // For "Featured", total is what we fetched
      },
      latestMovies: {
        items: (latestMoviesData?.results || []).map(item => ({
          ...item,
          media_type: item.media_type || 'movie', 
        })),
        total_results: latestMoviesData?.total_results || 0,
      },
      latestTvShows: {
        items: (latestTvShowsData?.results || []).map(item => ({
          ...item,
          media_type: 'tv', 
        })),
        total_results: latestTvShowsData?.total_results || 0,
      },
      assignedAds: {
        header: adForHeaderSlot,
        movies: adForMoviesSlot,
        tvShows: adForTvShowsSlot,
      }
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      featuredPosts: { items: [], total_results: 0 },
      latestMovies: { items: [], total_results: 0 },
      latestTvShows: { items: [], total_results: 0 },
      assignedAds: { header: null, movies: null, tvShows: null },
    };
  }
}


export default async function HomePage() {
  const { featuredPosts, latestMovies, latestTvShows, assignedAds } = await getHomePageData();

  const adForHeaderSlot = assignedAds.header;
  const adForMoviesSlot = assignedAds.movies;
  const adForTvShowsSlot = assignedAds.tvShows;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Ad Slot 1: Below Header/Search - inside a container for padding */}
        {adForHeaderSlot && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <AdBanner ad={adForHeaderSlot} />
            </div>
        )}

        <MediaGridSection
          title="Featured From Our Collection"
          items={featuredPosts.items}
          totalItems={featuredPosts.total_results}
          isLoading={false} 
          gridItemCount={HOMEPAGE_SECTION_ITEM_COUNT}
          // No "View All" for featured section by default, unless specified
        />

        {/* Ad Slot 2: Above Latest Movies */}
        {adForMoviesSlot && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AdBanner ad={adForMoviesSlot} />
          </div>
        )}
        <MediaGridSection 
          title="Latest Movies" 
          items={latestMovies.items} 
          totalItems={latestMovies.total_results}
          isLoading={false} 
          viewAllLink="/movies" 
          gridItemCount={HOMEPAGE_SECTION_ITEM_COUNT} 
        />

        {/* Ad Slot 3: Above Latest Webseries */}
        {adForTvShowsSlot && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AdBanner ad={adForTvShowsSlot} />
          </div>
        )}
        <MediaGridSection 
          title="Latest Webseries" 
          items={latestTvShows.items} 
          totalItems={latestTvShows.total_results}
          isLoading={false}
          viewAllLink="/tv"
          gridItemCount={HOMEPAGE_SECTION_ITEM_COUNT}
        />
      </main>
      {/* Footer rendering removed from here, it's handled by layout.tsx */}
    </div>
  );
}
