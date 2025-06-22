import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Skeleton className="aspect-[2/3] w-full bg-muted/80" />
      <CardHeader className="p-4">
        <Skeleton className="h-5 w-3/4 bg-muted/80" />
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Skeleton className="h-4 w-1/4 bg-muted/80" />
        <Skeleton className="h-4 w-1/4 bg-muted/80" />
      </CardFooter>
    </Card>
  );
}
