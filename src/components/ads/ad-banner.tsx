
import type { FirestoreAdData } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdBannerProps {
  ad: FirestoreAdData | null; // Allow ad to be null
}

export function AdBanner({ ad }: AdBannerProps) {
  if (!ad) return null;

  const posterSrc = ad.posterImageUrl || `https://placehold.co/1280x320.png?text=${encodeURIComponent(ad.title)}`;
  const isPlaceholder = !ad.posterImageUrl || ad.posterImageUrl.includes('placehold.co');

  return (
    <Card className="w-full overflow-hidden shadow-lg my-6 md:my-8 hover:shadow-primary/20 transition-shadow duration-300">
      <Link href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
        <div className="relative aspect-[16/5] sm:aspect-[16/4] md:aspect-[16/3] bg-muted">
          <Image
            src={posterSrc}
            alt={`Advertisement for ${ad.title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1280px"
            className="object-cover"
            data-ai-hint="advertisement banner"
            unoptimized={isPlaceholder}
            priority={false} // Generally, ads are not LCP elements
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent p-4 sm:p-6 md:p-8 flex flex-col justify-end items-start">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-headline font-bold text-white mb-2 md:mb-3 drop-shadow-md">
              {ad.title}
            </h3>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" tabIndex={-1} >
              {/* Button wrapped in Link, so targetUrl is on Link. Button acts as visual element. */}
              <span>{ad.buttonLabel}</span>
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}
