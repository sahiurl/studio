
import Link from 'next/link';
import type { APIListItem } from '@/types';
import { MediaCard } from './media-card';
import { GridSkeleton } from '../skeletons/grid-skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface MediaGridSectionProps {
  title: string;
  items: APIListItem[];
  totalItems?: number; // Total number of items available on the server for this category
  isLoading?: boolean;
  viewAllLink?: string;
  gridItemCount?: number; // Number of items to show in the grid before "View All"
}

export function MediaGridSection({
  title,
  items,
  totalItems,
  isLoading = false,
  viewAllLink,
  gridItemCount = 6, // Default to 6 items for typical sections
}: MediaGridSectionProps) {

  const displayedItems = items.slice(0, gridItemCount);
  
  // Show "View All" button if a link is provided AND totalItems is greater than the number of items shown in this section
  const showViewAllButton = viewAllLink && typeof totalItems === 'number' && totalItems > gridItemCount;

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold">{title}</h2>
          {showViewAllButton && (
            <Button variant="ghost" asChild>
              <Link href={viewAllLink} className="text-sm text-primary hover:text-primary/80">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
        {isLoading ? (
          <GridSkeleton count={gridItemCount} />
        ) : displayedItems.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {displayedItems.map((item) => (
              <MediaCard key={`${item.media_type}-${item.tmdb_id}`} media={item} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No {title.toLowerCase()} available at the moment.</p>
        )}
      </div>
    </section>
  );
}
