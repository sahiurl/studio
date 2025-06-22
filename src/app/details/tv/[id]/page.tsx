import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';

import { getMediaDetails, getStreamUrl } from '@/lib/api';
import type { APITVShowDetail, APIEpisodeDetail, APISeasonDetail, FirestorePostData, FirestoreAdData, APITelegramItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, CalendarDays, LanguagesIcon, Info, TvIcon, Download, Send, ChevronsUpDown, ArrowLeft, Tags } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { APP_NAME, TELEGRAM_BOT_USERNAME } from '@/lib/constants';
import { getPostById, getActiveAds } from '@/lib/firebase';
import { AdBanner } from '@/components/ads/ad-banner';
import { shortenSingleUrlIfEnabled } from '@/services/url-shortener-service';

interface ProcessedSeason extends Omit<APISeasonDetail, 'episodes'> {
  episodes: (APIEpisodeDetail & {
    isFirestoreLink?: boolean;
  })[];
}

interface ProcessedEpisode extends Omit<APIEpisodeDetail, 'telegram'> {
  shortenedDirectDownloadLinks: { quality: string; url: string; size?: string }[];
}

const getUniqueQualitiesForSeason = (season?: APISeasonDetail): string[] => {
  if (!season || !season.episodes || season.episodes.length === 0) {
    return [];
  }
  const qualities = new Set<string>();
  season.episodes.forEach(episode => {
    if (episode && episode.telegram && episode.telegram.length > 0) {
      episode.telegram.forEach(link => {
        if (link && link.quality) {
          qualities.add(link.quality.toLowerCase().includes('480p') ? '480p' :
                        link.quality.toLowerCase().includes('720p') ? '720p' :
                        link.quality.toLowerCase().includes('1080p') ? '1080p' : link.quality);
        }
      });
    }
  });
  const sortedQualities = Array.from(qualities).sort((a, b) => {
    const order = ['480p', '720p', '1080p'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  return sortedQualities;
};

function transformFirestoreToAPITVDetail(post: FirestorePostData): APITVShowDetail {
  return {
    tmdb_id: post.id, 
    title: post.title,
    description: post.description,
    poster: post.posterUrl,
    backdrop: post.backdropUrl || null,
    release_year: post.releaseYear,
    rating: post.rating,
    genres: post.genres || [],
    media_type: 'tv',
    rip: post.ripQuality,
    languages: post.languages || [],
    total_seasons: post.totalSeasons,
    total_episodes: post.totalEpisodes,
    telegram: [], 
    seasons: [], 
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
  let pageUrl = `/details/tv/${params.id}`;


  if (isNaN(numericId)) { 
    const firestorePost = await getPostById(params.id);
    if (firestorePost && firestorePost.mediaType === 'tv') {
      title = `${firestorePost.title || 'TV Show'} | ${APP_NAME}`;
      description = firestorePost.description;
      imageUrl = firestorePost.posterUrl ?? undefined;
    }
  } else {
    try {
      const mediaDetails = await getMediaDetails(numericId);
      if (mediaDetails.media_type === 'tv') {
        title = `${mediaDetails.title || 'TV Show'} | ${APP_NAME}`;
        description = mediaDetails.description;
        imageUrl = mediaDetails.poster ?? undefined;
      }
    } catch (error) {
      console.error(`Error generating metadata for TV show ${numericId}:`, error);
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const openGraphImages = imageUrl ? [{ url: imageUrl }, ...previousImages] : previousImages;


  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: openGraphImages,
      type: 'video.tv_show',
      url: pageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : ((await parent).twitter?.images || []),
    },
  };
}

export default async function TVShowDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  let tvShowDetails: APITVShowDetail;
  let firestorePostData: FirestorePostData | null = null;
  const numericId = parseInt(params.id, 10);


  if (isNaN(numericId)) { 
    const post = await getPostById(params.id);
    if (!post || post.mediaType !== 'tv') {
      console.warn(`Firestore post not found or not a TV show for ID: ${params.id}`);
      notFound();
    }
    firestorePostData = post;
    tvShowDetails = transformFirestoreToAPITVDetail(post);
  } else { 
    try {
      const fetchedDetails = await getMediaDetails(numericId);
      if (fetchedDetails.media_type !== 'tv') {
        console.warn(`Expected TV show, got ${fetchedDetails.media_type} for TMDB ID ${numericId}`);
        notFound();
      }
      tvShowDetails = fetchedDetails as APITVShowDetail;
      tvShowDetails.isFirestoreSource = false;
    } catch (error) {
      console.error(`Failed to fetch TV show details for TMDB ID ${numericId}:`, error);
      notFound();
    }
  }

  const posterUrl = tvShowDetails.poster || `https://placehold.co/500x750.png?text=${encodeURIComponent(tvShowDetails.title || 'TV Show')}`;
  
  const allActiveAds = await getActiveAds().catch(e => { 
    console.error("Failed to fetch active ads for TV page", e); 
    return []; 
  });

  let randomAdForBottom: FirestoreAdData | null = null;
  if (allActiveAds.length > 0) {
    randomAdForBottom = allActiveAds[Math.floor(Math.random() * allActiveAds.length)];
  }

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

  if (!tvShowDetails.isFirestoreSource && tvShowDetails.telegram && tvShowDetails.telegram.length > 0) {
    // ... existing code ...
  }

  let processedSeasons: ProcessedSeason[] = [];
  if (!tvShowDetails.isFirestoreSource && tvShowDetails.seasons && tvShowDetails.seasons.length > 0) {
    processedSeasons = await Promise.all(
      tvShowDetails.seasons
        .filter(season => season && typeof season.season_number === 'number')
        .sort((a, b) => (a.season_number || 0) - (b.season_number || 0))
        .map(async (season) => {
          if (!season) return null; // Should not happen due to filter but good for type safety

          const uniqueSeasonQualities = getUniqueQualitiesForSeason(season);
          const shortenedSeasonPackLinks = await Promise.all(
            uniqueSeasonQualities.map(async (quality) => {
              const originalUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=file_${tvShowDetails.tmdb_id}_${season.season_number}_${quality}`;
              const shortenedUrl = await shortenSingleUrlIfEnabled(originalUrl);
              return { quality, url: shortenedUrl };
            })
          );

          const processedEpisodes = await Promise.all(
            (season.episodes || [])
              .filter(episode => episode && typeof episode.episode_number === 'number')
              .sort((a,b) => (a.episode_number || 0) - (b.episode_number || 0))
              .map(async (episode) => {
                if (!episode) return null;
                
                const shortenedDirectDownloadLinks: { quality: string; url: string; size?: string }[] = [];
                if (episode.telegram) {
                  const linksToShorten = episode.telegram.map(link => ({
                    originalUrl: getStreamUrl(link.id, link.name),
                    quality: link.quality,
                    size: link.size
                  }));
                  
                  const shortenedResults = await Promise.all(
                    linksToShorten.map(async item => ({
                      quality: item.quality,
                      url: await shortenSingleUrlIfEnabled(item.originalUrl),
                      size: item.size
                    }))
                  );
                  shortenedDirectDownloadLinks.push(...shortenedResults);
                }
                const { telegram, ...restOfEpisode } = episode;
                return { ...restOfEpisode, shortenedDirectDownloadLinks };
              })
          );
          
          const { episodes, ...restOfSeason } = season;
          return { 
            ...restOfSeason, 
            shortenedSeasonPackLinks, 
            processedEpisodes: processedEpisodes.filter(Boolean) as ProcessedEpisode[]
          };
        })
    ).then(results => results.filter(Boolean)) as ProcessedSeason[];
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tv">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Webseries
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-start">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={posterUrl}
                  alt={`Poster for ${tvShowDetails.title || 'TV Show'}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  data-ai-hint="tv show poster detail"
                  unoptimized={!tvShowDetails.poster || posterUrl.includes('placehold.co')}
                  priority
                />
              </div>
            </div>

            <div className="w-full md:w-2/3 lg:w-3/4 mt-6 md:mt-0 text-foreground">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-2 drop-shadow-lg">
                {tvShowDetails.title || 'TV Show Title Not Available'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                {tvShowDetails.release_year && (
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1.5" />
                    <span>{tvShowDetails.release_year}</span>
                  </div>
                )}
                {typeof tvShowDetails.rating === 'number' && tvShowDetails.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />
                    <span>{tvShowDetails.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {tvShowDetails.genres && tvShowDetails.genres.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {tvShowDetails.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>
                  ))}
                </div>
              )}
              
              <p className="text-base text-muted-foreground leading-relaxed mb-6 line-clamp-5 md:line-clamp-none">
                {tvShowDetails.description || 'Description not available.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                {tvShowDetails.total_seasons && (
                  <div className="flex items-start">
                    <TvIcon className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Seasons</h3>
                      <p className="text-muted-foreground">{tvShowDetails.total_seasons}</p>
                    </div>
                  </div>
                )}
                 {tvShowDetails.total_episodes && (
                  <div className="flex items-start">
                    <ChevronsUpDown className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Episodes</h3>
                      <p className="text-muted-foreground">{tvShowDetails.total_episodes}</p>
                    </div>
                  </div>
                )}
                {tvShowDetails.languages && tvShowDetails.languages.length > 0 && (
                  <div className="flex items-start">
                    <LanguagesIcon className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Languages</h3>
                      <p className="text-muted-foreground">{tvShowDetails.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
                {tvShowDetails.rip && (
                  <div className="flex items-start">
                    <Info className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-semibold mb-1">Quality</h3>
                      <Badge variant="outline">{tvShowDetails.rip}</Badge>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6 md:my-8" />
              
              {tvShowDetails.isFirestoreSource && firestorePostData && (
                 <>
                  {processedFirestoreTelegramLinks.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-headline font-semibold mb-4">Telegram Options</h2>
                      <div className="space-y-4">
                        {processedFirestoreTelegramLinks.map((link, index) => (
                          <div key={`fs-tg-tv-${index}-${link.url}`} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                           <div key={`fs-dd-tv-${index}-${link.url}`} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                     <p className="text-muted-foreground">No download links available for this TV show from our collection.</p>
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

              {!tvShowDetails.isFirestoreSource && processedSeasons.length > 0 ? (
                <>
                  <h2 className="text-2xl font-headline font-semibold mb-4">Seasons &amp; Episodes</h2>
                  <Accordion type="multiple" className="w-full">
                    {processedSeasons.map((season) => {
                        return (
                          <AccordionItem key={`season-${season.season_number}`} value={`season-${season.season_number}`}>
                            <AccordionTrigger className="text-lg hover:no-underline">
                              Season {season.season_number}
                              {season.title && <span className="text-sm text-muted-foreground ml-2 font-normal hidden sm:inline">- {season.title}</span>}
                            </AccordionTrigger>
                            <AccordionContent>
                              {season.shortenedSeasonPackLinks.length > 0 && (
                                <div className="mb-4 p-3 border rounded-md bg-card/30">
                                  <h4 className="font-semibold text-sm mb-2">Telegram Season Packs:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {season.shortenedSeasonPackLinks.map(link => (
                                      <Button key={link.quality} asChild size="sm" variant="outline">
                                        <Link href={link.url} target="_blank" rel="noopener noreferrer">
                                          <Send className="w-3.5 h-3.5 mr-1.5" /> {link.quality} Pack
                                        </Link>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <h4 className="font-semibold text-sm mb-3 mt-2">Direct Download Episodes:</h4>
                              {season.processedEpisodes && season.processedEpisodes.length > 0 ? (
                                  <div className="space-y-4">
                                    {season.processedEpisodes.map((episode) => {
                                      const placeholderImage = `https://placehold.co/300x170.png?text=S${season.season_number}E${episode.episode_number}`;
                                      const episodeImage = episode.thumbnail || episode.episode_backdrop || placeholderImage;

                                      let link480p: { url: string; size?: string } | null = null;
                                      let link720p: { url: string; size?: string } | null = null;
                                      const otherLinks: { quality: string; url: string; size?: string }[] = [];

                                      episode.shortenedDirectDownloadLinks.forEach(link => {
                                        if (link.quality && link.quality.toLowerCase().includes('480p') && !link480p) {
                                          link480p = link;
                                        } else if (link.quality && link.quality.toLowerCase().includes('720p') && !link720p) {
                                          link720p = link;
                                        } else {
                                          otherLinks.push(link);
                                        }
                                      });


                                      return (
                                      <div key={`${season.season_number}-${episode.episode_number}`} className="p-4 border rounded-lg bg-card/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-shrink-0 w-full sm:w-32 md:w-40 aspect-video relative rounded overflow-hidden bg-muted">
                                          <Image
                                            src={episodeImage}
                                            alt={`Thumbnail for S${season.season_number}E${episode.episode_number} - ${episode.title || 'Episode'}`}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 128px"
                                            className="object-cover"
                                            data-ai-hint="episode thumbnail"
                                            unoptimized={!episode.thumbnail && !episode.episode_backdrop || episodeImage.includes('placehold.co')}
                                          />
                                        </div>
                                        <div className="flex-grow">
                                          <h5 className="font-semibold text-sm mb-0.5">E{episode.episode_number}: {episode.title || 'Episode Title Not Available'}</h5>
                                          {episode.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{episode.description}</p>}
                                          <div className="flex flex-wrap gap-2">
                                            {link480p && (
                                              <Button asChild size="sm">
                                                <Link href={link480p.url} target="_blank" rel="noopener noreferrer">
                                                  <Download className="w-4 h-4 mr-2" /> 480p {link480p.size ? `(${link480p.size})` : ''}
                                                </Link>
                                              </Button>
                                            )}
                                            {link720p && (
                                              <Button asChild size="sm">
                                                <Link href={link720p.url} target="_blank" rel="noopener noreferrer">
                                                  <Download className="w-4 h-4 mr-2" /> 720p {link720p.size ? `(${link720p.size})` : ''}
                                                </Link>
                                              </Button>
                                            )}
                                            {(!link480p && !link720p && otherLinks.length > 0) && otherLinks.map((otherLink, idx) => (
                                                <Button key={`${otherLink.quality}-${idx}`} asChild size="sm">
                                                  <Link href={otherLink.url} target="_blank" rel="noopener noreferrer" className="bg-secondary hover:bg-secondary/80">
                                                    <Download className="w-4 h-4 mr-2" /> {otherLink.quality} {otherLink.size ? `(${otherLink.size})` : ''}
                                                  </Link>
                                                </Button>
                                            ))}
                                            {(!link480p && !link720p && otherLinks.length === 0 && episode.shortenedDirectDownloadLinks.length === 0) && (
                                              <p className="text-xs text-muted-foreground">No direct download links available for this episode.</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )})}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No episodes listed for this season.</p>
                                )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                </>
              ) : null }

              {((!tvShowDetails.isFirestoreSource && (!processedSeasons || processedSeasons.length === 0))) && (
                <p className="text-muted-foreground">No season information available for this TV show from API.</p>
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
