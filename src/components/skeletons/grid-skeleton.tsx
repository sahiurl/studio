
import { CardSkeleton } from './card-skeleton';

interface GridSkeletonProps {
  count?: number;
  className?: string;
}

export function GridSkeleton({ count = 8, className }: GridSkeletonProps) {
  return (
    <div className={`grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
