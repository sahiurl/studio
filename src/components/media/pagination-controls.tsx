'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationControls({ currentPage, totalPages }: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  const MAX_VISIBLE_PAGES = 5; // Example: Show 5 page numbers (e.g., 1 ... 3 4 5 ... 10)
  let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

  if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
    startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }
  
  const pageNumbers: (number | string)[] = [];

  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push('...');
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
  }


  return (
    <nav aria-label="Pagination" className="flex items-center justify-center space-x-2 py-8">
      <Button asChild variant="outline" size="icon" disabled={currentPage <= 1}>
        <Link href={createPageURL(currentPage - 1)} scroll={false} aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : undefined}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Link>
      </Button>

      {pageNumbers.map((page, index) =>
        typeof page === 'string' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            asChild
            variant={page === currentPage ? 'default' : 'outline'}
            className={cn("h-9 w-9 p-0", page === currentPage && "pointer-events-none")}
          >
            <Link href={createPageURL(page)} scroll={false}>
              {page}
            </Link>
          </Button>
        )
      )}

      <Button asChild variant="outline" size="icon" disabled={currentPage >= totalPages}>
        <Link href={createPageURL(currentPage + 1)} scroll={false} aria-disabled={currentPage >= totalPages} tabIndex={currentPage >= totalPages ? -1 : undefined}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Link>
      </Button>
    </nav>
  );
}
