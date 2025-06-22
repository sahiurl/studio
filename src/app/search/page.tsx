
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MediaCard } from '@/components/media/media-card';
import { GridSkeleton } from '@/components/skeletons/grid-skeleton';
import { searchMedia } from '@/lib/api';
import { searchFirestorePosts } from '@/lib/firebase'; // Added
import type { APISearchResultItem, APIListItem, APIListResponse } from '@/types';
import { PAGE_SIZE_SEARCH, APP_NAME } from '@/lib/constants';
import { PaginationControls } from '@/components/media/pagination-controls';

interface SearchPageProps {
  searchParams?: {
    query?: string;
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams?.query || '';
  if (query) {
    return {
      title: `Search results for "${query}" | ${APP_NAME}`,
      description: `Find movies and TV shows matching your search for "${query}".`,
    };
  }
  return {
    title: `Search | ${APP_NAME}`,
    description: 'Search for movies and TV shows.',
  };
}

async function SearchResults({ query, currentPage }: { query: string; currentPage: number }) {
  if (!query) {
    return <p className="text-muted-foreground text-center py-8 col-span-full">Please enter a search term.</p>;
  }

  const apiSearchPromise = searchMedia(query, currentPage, PAGE_SIZE_SEARCH)
    .catch(e => {
      console.error("Failed to fetch API search results for query:", query, e);
      return { results: [], page: currentPage, total_pages: 0, total_results: 0 } as APIListResponse; // Use APIListResponse for error state
    });

  let firestoreSearchPromise = Promise.resolve<APIListItem[]>([]);
  if (currentPage === 1) { // Only fetch Firestore results on the first page
    firestoreSearchPromise = searchFirestorePosts(query)
      .catch(e => {
        console.error("Failed to fetch Firestore search results for query:", query, e);
        return [];
      });
  }

  const [apiData, firestoreData] = await Promise.all([apiSearchPromise, firestoreSearchPromise]);

  const firestoreResults: APIListItem[] = firestoreData || [];
  const apiResults: APIListItem[] = (apiData.results || []).map(item => ({ // Map APISearchResultItem to APIListItem
    tmdb_id: item.tmdb_id,
    title: item.title,
    poster: item.poster,
    rating: item.rating,
    release_year: item.release_year,
    media_type: item.media_type === 'episode' ? 'tv' : item.media_type,
    description: item.description || undefined,
    rip: item.rip,
    backdrop: item.backdrop || null,
  }));


  let combinedItems: APIListItem[] = [];
  let totalResultsForDisplay = apiData.total_results || 0;

  if (currentPage === 1) {
    const firestoreTmdbIds = new Set(firestoreResults.map(item => String(item.tmdb_id)));
    const uniqueApiResults = apiResults.filter(item => !firestoreTmdbIds.has(String(item.tmdb_id)));
    combinedItems = [...firestoreResults, ...uniqueApiResults];
    // Adjust total if Firestore added new items not counted by API pagination
    totalResultsForDisplay = firestoreResults.length + uniqueApiResults.length + (apiData.total_results - apiResults.length);

  } else {
    combinedItems = apiResults;
  }
  
  if (combinedItems.length === 0) {
    return <p className="text-muted-foreground text-center py-8 col-span-full">No results found for "{query}".</p>;
  }

  // The items in combinedItems should already be compatible with APIListItem structure
  // if searchFirestorePosts maps correctly.
  // APISearchResultItem might have slightly different fields than APIListItem, ensure mapping if needed.

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {combinedItems.map((item) => (
          <MediaCard key={`${item.media_type}-${item.tmdb_id}`} media={item} />
        ))}
      </div>
      <PaginationControls 
        currentPage={apiData.page || currentPage} 
        totalPages={apiData.total_pages || 0} 
      />
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <>
      <GridSkeleton count={PAGE_SIZE_SEARCH} />
      <div className="flex justify-center py-8">
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
      </div>
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.query || '';
  const currentPage = parseInt(searchParams?.page || '1', 10);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-headline font-semibold mb-6">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults 
              key={`${query}-${currentPage}`} // Re-render if query or page changes
              query={query} 
              currentPage={currentPage} 
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

