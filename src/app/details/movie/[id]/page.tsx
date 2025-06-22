import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';

import { getMediaDetails, getStreamUrl } from '@/lib/api';
import type { APIMovieDetail, FirestorePostData, FirestoreAdData, APITelegramItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, CalendarDays, Download, LanguagesIcon, Info, Send, ArrowLeft, Tags } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { APP_NAME, TELEGRAM_BOT_USERNAME } from '@/lib/constants';
import { getPostById, getActiveAds } from '@/lib/firebase';
import { AdBanner } from '@/components/ads/ad-banner';
import { shortenSingleUrlIfEnabled } from '@/services/url-shortener-service';

// Helper to transform Firestore post data to APIMovieDetail structure
function transformFirestoreToAPIMovieDetail(post: FirestorePostData): APIMovieDetail {
  return {
    tmdb_id: post.id,
    title: post.title,
    description: post.description,
    poster: post.posterUrl,
    backdrop: post.backdropUrl || null,
    release_year: post.releaseYear,
    rating: post.rating,
    genres: post.genres || [],
    media_type: 'movie',
    rip: post.ripQuality,
    runtime: post.runtime,
    languages: post.languages || [],
    telegram: [],
    isFirestoreSource: true,
  };
}

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const numericId = parseInt(params.id, 10);
  let title = `Detail Not Found | ${APP_NAME}`;
  let description = `Details for the requested media could not be found.`;
  let imageUrl: string | undefined = undefined;

  try {
    if (isNaN(numericId)) {
      const firestorePost = await getPostById(params.id);
      if (firestorePost && firestorePost.mediaType === 'movie') {
        title = `${firestorePost.title} | ${APP_NAME}`;
        description = firestorePost.description;
        imageUrl = firestorePost.posterUrl ?? undefined;
      }
    } else {
      const mediaDetails = await getMediaDetails(numericId);
      if (mediaDetails.media_type === 'movie') {
        title = `${mediaDetails.title} | ${APP_NAME}`;
        description = mediaDetails.description;
        imageUrl = mediaDetails.poster ?? undefined;
      }
    }
  } catch (error) {
    console.error(`Error fetching movie details for metadata (ID: ${params.id}):`, error);
  }

  const openGraphImages = imageUrl ? [{ url: imageUrl }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: openGraphImages,
      type: 'video.movie',
      url: `/details/movie/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : ((await parent).twitter?.images || []),
    },
  };
}

export default async function MovieDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  let movieDetails: APIMovieDetail;
  let firestorePostData: FirestorePostData | null = null;
  const numericId = parseInt(params.id, 10);

  if (isNaN(numericId)) {
    const post = await getPostById(params.id);
    if (!post || post.mediaType !== 'movie') {
      console.warn(`Firestore post not found or not a movie for ID: ${params.id}`);
      notFound();
    }
    firestorePostData = post;
    movieDetails = transformFirestoreToAPIMovieDetail(post);
  } else {
    try {
      const fetchedDetails = await getMediaDetails(numericId);
      if (fetchedDetails.media_type !== 'movie') {
        console.warn(`Expected movie, got ${fetchedDetails.media_type} for TMDB ID ${numericId}`);
        notFound();
      }
      movieDetails = fetchedDetails as APIMovieDetail;
      movieDetails.isFirestoreSource = false;
    } catch (error) {
      console.error(`Failed to fetch movie details from API (ID: ${numericId}):`, error);
      notFound();
    }
  }

  const posterUrl = movieDetails.poster || `https://placehold.co/500x750.png?text=${encodeURIComponent(movieDetails.title || 'Movie')}`;

  const allActiveAds = await getActiveAds().catch(e => {
    console.error("Failed to fetch active ads for movie page", e);
    return [];
  });

  let randomAdForBottom: FirestoreAdData | null = null;
  if (allActiveAds.length > 0) {
    randomAdForBottom = allActiveAds[Math.floor(Math.random() * allActiveAds.length)];
  }

  // Prepare shortened links for Firestore data if enabled
  let processedFirestoreTelegramLinks: { qualityLabel: string; name: string; size?: string; url: string; type: 'telegram' }[] = [];
  let processedFirestoreDirectLinks: { qualityLabel: string; name: string; size?: string; url: string; type: 'direct' }[] = [];

  if (firestorePostData) {
    if (firestorePostData.telegramOptions && firestorePostData.telegramOptions.length > 0) {
      const allLinks = await Promise.all(
        firestorePostData.telegramOptions.flatMap(qualityOpt =>
          qualityOpt.links.map(async link => {
            const shortenedUrl = await shortenSingleUrlIfEnabled(link.url);
            return { ...link, qualityLabel: qualityOpt.qualityLabel, url: shortenedUrl };
          })
        )
      );
      processedFirestoreTelegramLinks = allLinks.filter(link => link.type === 'telegram') as typeof processedFirestoreTelegramLinks;
    }
    if (firestorePostData.directDownloadOptions && firestorePostData.directDownloadOptions.length > 0) {
      const allLinks = await Promise.all(
        firestorePostData.directDownloadOptions.flatMap(qualityOpt =>
          qualityOpt.links.map(async link => {
            const shortenedUrl = await shortenSingleUrlIfEnabled(link.url);
            return { ...link, qualityLabel: qualityOpt.qualityLabel, url: shortenedUrl };
          })
        )
      );
      processedFirestoreDirectLinks = allLinks.filter(link => link.type === 'direct') as typeof processedFirestoreDirectLinks;
    }
  }

  // Prepare shortened links for API data if enabled
  let processedApiTelegramLinks: (APITelegramItem & { finalStreamUrl: string; finalTelegramFileUrl: string })[] = [];
  if (!movieDetails.isFirestoreSource && movieDetails.telegram && movieDetails.telegram.length > 0) {
      processedApiTelegramLinks = await Promise.all(movieDetails.telegram.map(async (link) => {
        const originalStreamUrl = getStreamUrl(link.id, link.name);
        const finalStreamUrl = await shortenSingleUrlIfEnabled(originalStreamUrl);

        const originalTelegramFileUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=file_${movieDetails.tmdb_id}_${link.quality}`;
        const finalTelegramFileUrl = await shortenSingleUrlIfEnabled(originalTelegramFileUrl);

        return {
            ...link,
            finalStreamUrl,
            finalTelegramFileUrl,
        };
    }));
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/movies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Movies
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-start">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={posterUrl}
                  alt={`Poster for ${movieDetails.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  data-ai-hint="movie poster detail"
                  unoptimized={!movieDetails.poster || posterUrl.includes('placehold.co')}
                  priority
                />
              </div>
            </div>

            <div className="w-full md:w-2/3 lg:w-3/4 mt-6 md:mt-0 text-foreground">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-2 drop-shadow-lg">
                {movieDetails.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                {movieDetails.release_year && (
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1.5" />
                    <span>{movieDetails.release_year}</span>
                  </div>
                )}
                {movieDetails.runtime && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{movieDetails.runtime} min</span>
                  </div>
                )}
                {typeof movieDetails.rating === 'number' && movieDetails.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />
                    <span>{movieDetails.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {movieDetails.genres && movieDetails.genres.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {movieDetails.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>
                  ))}
                </div>
              )}

              <p className="text-base text-muted-foreground leading-relaxed mb-6 line-clamp-5 md:line-clamp-none">
                {movieDetails.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                {movieDetails.languages && movieDetails.languages.length > 0 && (
                  <div className="flex items-start">
                    <LanguagesIcon className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Languages</h3>
                      <p className="text-muted-foreground">{movieDetails.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
                {movieDetails.rip && (
                  <div className="flex items-start">
                    <Info className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Quality</h3>
                      <Badge variant="outline">{movieDetails.rip}</Badge>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-6 md:my-8" />

              {movieDetails.isFirestoreSource && firestorePostData && (
                <>
                  {processedFirestoreTelegramLinks.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-headline font-semibold mb-4">Telegram Options</h2>
                      <div className="space-y-4">
                        {processedFirestoreTelegramLinks.map((link, index) => (
                          <div key={`fs-tg-${index}-${link.url}`} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                              <Badge variant="default" className="mr-2 mb-1 md:mb-0">{link.qualityLabel}</Badge>
                              <span className="font-medium text-sm text-foreground break-all block md:inline">{link.name}</span>
                              {link.size && <span className="text-xs text-muted-foreground ml-0 md:ml-2 block md:inline">({link.size})</span>}
                            </div>
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              <Button asChild size="sm" className="w-full">
                                <Link href={link.url} target="_blank" rel="noopener noreferrer">
                                  <Send className="w-4 h-4 mr-2" /> Open Telegram
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {processedFirestoreDirectLinks.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-headline font-semibold mb-4">Direct Download Options</h2>
                      <div className="space-y-4">
                        {processedFirestoreDirectLinks.map((link, index) => (
                           <div key={`fs-dd-${index}-${link.url}`} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                              <Badge variant="default" className="mr-2 mb-1 md:mb-0">{link.qualityLabel}</Badge>
                              <span className="font-medium text-sm text-foreground break-all block md:inline">{link.name}</span>
                              {link.size && <span className="text-xs text-muted-foreground ml-0 md:ml-2 block md:inline">({link.size})</span>}
                            </div>
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              <Button asChild size="sm" className="w-full">
                                <Link href={link.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(processedFirestoreTelegramLinks.length === 0 && processedFirestoreDirectLinks.length === 0) && (
                    <p className="text-muted-foreground">No download links available for this movie from our collection.</p>
                  )}

                  {firestorePostData.seoKeywords && firestorePostData.seoKeywords.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-xl font-headline font-semibold mb-3 flex items-center">
                        <Tags className="w-5 h-5 mr-2 text-primary" />
                        SEO Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {firestorePostData.seoKeywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!movieDetails.isFirestoreSource && processedApiTelegramLinks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-headline font-semibold mb-4">Download Options</h2>
                  <div className="space-y-4">
                    {processedApiTelegramLinks.map((link, index) => (
                        <div key={`${link.id}-${index}-${link.finalStreamUrl}`} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-grow">
                            <Badge variant="default" className="mr-2 mb-1 md:mb-0">{link.quality}</Badge>
                            <span className="font-medium text-sm text-foreground break-all block md:inline">{link.name}</span>
                            {link.size && <span className="text-xs text-muted-foreground ml-0 md:ml-2 block md:inline">({link.size})</span>}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-3 md:mt-0 flex-shrink-0 w-full sm:w-auto">
                            <Button asChild size="sm" className="w-full sm:w-auto">
                            <Link href={link.finalStreamUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                            <Link href={link.finalTelegramFileUrl} target="_blank" rel="noopener noreferrer">
                                <Send className="w-4 h-4 mr-2" />
                                Telegram File
                            </Link>
                            </Button>
                        </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              {!movieDetails.isFirestoreSource && processedApiTelegramLinks.length === 0 && (
                <p className="text-muted-foreground">No download links available for this movie from API.</p>
              )}
            </div>
          </div>
        </div>

        {randomAdForBottom && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AdBanner ad={randomAdForBottom} />
          </div>
        )}
      </main>
    </div>
  );
}
