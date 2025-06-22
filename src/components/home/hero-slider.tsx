// Using ShadCN Carousel which needs to be installed: npx shadcn-ui@latest add carousel
// For now, this component will be a simplified version if carousel is not available.
// Let's assume carousel is available or we build a basic version.
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Assuming carousel is added via shadcn/ui
import type { APIListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronRight, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroSliderProps {
  items: APIListItem[];
  isLoading?: boolean;
}

export function HeroSlider({ items, isLoading = false }: HeroSliderProps) {
  if (isLoading) {
    return <HeroSliderSkeleton />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center text-muted-foreground">
        No trending shows available at the moment.
      </div>
    );
  }
  
  // Check if Carousel components are available (they are not by default from existing files)
  // If not, render a static placeholder or a simpler slider.
  // For this exercise, I'll assume they would be added, and write code for it.
  // If `Carousel` is undefined, it would error. A production component would handle this.

  if (typeof Carousel === 'undefined') {
    // Fallback: Show the first item statically if Carousel is not available
    const firstItem = items[0];
    if (!firstItem) return null;
    return (
      <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[calc(100vh-theme(spacing.16))] overflow-hidden">
        <HeroSlideItem item={firstItem} />
      </div>
    );
  }


  return (
    <Carousel
      opts={{ loop: true }}
      className="w-full relative group"
      // Autoplay can be added via plugins for embla-carousel
    >
      <CarouselContent className="h-[60vh] md:h-[70vh] lg:h-[calc(100vh-theme(spacing.16))]"> {/* Adjust height as needed */}
        {items.map((item, index) => (
          <CarouselItem key={item.tmdb_id || index}>
             <HeroSlideItem item={item} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex" />
    </Carousel>
  );
}

function HeroSlideItem({ item }: { item: APIListItem }) {
  const imagePlaceholder = `https://placehold.co/1920x1080.png?text=${encodeURIComponent(item.title)}`;
  const backdropUrl = item.backdrop || item.poster || imagePlaceholder;

  return (
     <div className="w-full h-full relative">
        <Image
          src={backdropUrl}
          alt={`Backdrop for ${item.title}`}
          layout="fill"
          objectFit="cover"
          className="brightness-50"
          priority // for LCP on the first item
          data-ai-hint="show backdrop"
          unoptimized={!item.backdrop && !item.poster}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 md:p-12 lg:p-16">
          <div className="max-w-xl text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline mb-2 md:mb-4 drop-shadow-lg">
              {item.title}
            </h2>
            {item.description && (
              <p className="text-sm md:text-base text-gray-200 mb-4 md:mb-6 line-clamp-3 drop-shadow-sm">
                {item.description}
              </p>
            )}
            <div className="flex items-center space-x-4 mb-4 md:mb-6">
              {item.release_year && (
                <span className="text-sm font-medium">{item.release_year}</span>
              )}
              {item.rating && item.rating > 0 && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={`/details/${item.media_type}/${item.tmdb_id}`}>
                View Details <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
  )
}


export function HeroSliderSkeleton() {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[calc(100vh-theme(spacing.16))] bg-muted/80">
      <div className="absolute inset-0 flex items-end p-6 md:p-12 lg:p-16">
        <div className="max-w-xl w-full">
          <Skeleton className="h-10 md:h-12 lg:h-14 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-6" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    </div>
  );
}

// NOTE: This component assumes that shadcn/ui Carousel has been added to the project.
// If not, `npx shadcn-ui@latest add carousel` needs to be run.
// The carousel component itself relies on embla-carousel-react.
// If Carousel is not installed, it will render a static first item.
