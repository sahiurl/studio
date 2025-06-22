
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { APIListItem } from '@/types';
import { Star, Tv, Film } from 'lucide-react';

interface MediaCardProps {
  media: APIListItem;
}

export function MediaCard({ media }: MediaCardProps) {
  const { tmdb_id, title, poster, rating, release_year, media_type, rip } = media;
  const detailUrl = `/details/${media_type}/${tmdb_id}`;
  const imagePlaceholder = `https://placehold.co/500x750.png?text=${encodeURIComponent(title)}`;
  const imageUrl = poster || imagePlaceholder;
  const aiHint = media_type === 'movie' ? 'movie poster' : 'tv show poster';

  return (
    <Card className="overflow-hidden h-full flex flex-col group border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <Link href={detailUrl} className="block aspect-[2/3] relative overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          width={500}
          height={750}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={aiHint}
          unoptimized={poster ? false : true} // Don't optimize placeholder.co images
        />
        <Badge
          variant="secondary"
          className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-foreground text-[0.65rem] px-1.5 py-[1px] font-semibold"
        >
          {media_type === 'tv' ? <Tv className="w-2.5 h-2.5 mr-1" /> : <Film className="w-2.5 h-2.5 mr-1" />}
          {media_type === 'tv' ? 'TV' : 'Movie'}
        </Badge>
        {/* RIP quality badge removed from here */}
      </Link>
      <CardHeader className="p-3 flex-grow">
        <Link href={detailUrl}>
          <CardTitle className="text-sm sm:text-base font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {release_year && <span>{release_year}</span>}
        </div>
        {typeof rating === 'number' && rating > 0 && (
          <div className="flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
