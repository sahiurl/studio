
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { MediaCard } from '@/components/media/media-card';
import { GridSkeleton } from '@/components/skeletons/grid-skeleton';
import { getTvShows } from '@/lib/api';
import { getFirestorePosts, getActiveAds } from '@/lib/firebase'; // Added getActiveAds
import type { APIListItem, SortOption, FirestoreAdData } from '@/types'; // Added FirestoreAdData
import { PAGE_SIZE_LISTINGS, APP_NAME } from '@/lib/constants';
import { SortDropdown } from '@/components/media/sort-dropdown';
import { PaginationControls } from '@/components/media/pagination-controls';
import { AdBanner } from '@/components/ads/ad-banner'; // Added AdBanner

export const metadata: Metadata = {
  title: `Webseries | ${APP_NAME}`,
  description: `Browse all available webseries on ${APP_NAME}.`,
};

interface TvShowsPageProps {
  searchParams?: {
    page?: string;
    sort_by?: string;
  };
}

// Updated TvShowList to handle in-grid ads
async function TvShowList({
  currentPage,
  currentSort,
  activeAds,
}: {
  currentPage: number;
  currentSort: SortOption;
  activeAds: FirestoreAdData[];
}) {
  const apiTvShowsDataPromise = getTvShows(currentPage, PAGE_SIZE_LISTINGS, currentSort)
    .catch(e => {
      console.error("Failed to fetch API TV shows", e);
      return { results: [], page: currentPage, total_pages: 0, total_results: 0 };
    });

  let firestoreTvShows: APIListItem[] = [];
  if (currentPage === 1) {
    firestoreTvShows = await getFirestorePosts('tv')
      .catch(e => {
        console.error("Failed to fetch Firestore TV shows", e);
        return [];
      });
  }

  const apiTvShowsData = await apiTvShowsDataPromise;

  const combinedResults = currentPage === 1
    ? [...firestoreTvShows, ...apiTvShowsData.results]
    : apiTvShowsData.results;

  // Overall check for no results
  if (combinedResults.length === 0 && apiTvShowsData.total_results === 0 && firestoreTvShows.length === 0) {
    return <p className="text-muted-foreground text-center py-8 col-span-full">No webseries found.</p>;
  }

  const itemsWithAds: React.ReactNode[] = [];
  let postCount = 0;

  combinedResults.forEach((show, index) => {
    itemsWithAds.push(<MediaCard key={`${show.media_type}-${show.tmdb_id}`} media={show} />);
    postCount++;

    // Add ad after every 9 posts, but not after the very last item
    if (activeAds.length > 0 && postCount > 0 && postCount % 9 === 0 && index < combinedResults.length -1 ) {
      const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
      itemsWithAds.push(
        <div key={`ad-${randomAd.id}-${index}`} className="col-span-full my-4 md:my-6"> {/* Ad spans full width */}
          <AdBanner ad={randomAd} />
        </div>
      );
    }
  });

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {itemsWithAds}
      </div>
      <PaginationControls currentPage={apiTvShowsData.page} totalPages={apiTvShowsData.total_pages} />
    </>
  );
}

function TvShowListSkeleton() {
  return (
    <>
      <GridSkeleton count={PAGE_SIZE_LISTINGS} />
      <div className="flex justify-center py-8">
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
      </div>
    </>
  );
}

export default async function TvShowsPage({ searchParams }: TvShowsPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const currentSort = (searchParams?.sort_by || 'updated_on:desc') as SortOption;

  const allActiveAds = await getActiveAds().catch(e => {
    console.error("Failed to fetch active ads for TV page", e);
    return [];
  });

  let topAd: FirestoreAdData | null = null;
  if (allActiveAds.length > 0) {
    topAd = allActiveAds[Math.floor(Math.random() * allActiveAds.length)];
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h1 className="text-3xl md:text-4xl font-headline font-semibold">Webseries</h1>
            <SortDropdown defaultSort={currentSort} />
          </div>

          {/* Top Ad Banner */}
          {topAd && (
            <div className="mb-6 md:mb-8">
              <AdBanner ad={topAd} />
            </div>
          )}

          <Suspense fallback={<TvShowListSkeleton />}>
            <TvShowList 
              key={`${currentPage}-${currentSort}`}
              currentPage={currentPage} 
              currentSort={currentSort} 
              activeAds={allActiveAds} 
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
