'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOption } from '@/types';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated_on:desc', label: 'Latest Uploads' },
  { value: 'release_year:desc', label: 'Newest Releases' },
  { value: 'rating:desc', label: 'Highest Rated' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
  { value: 'rating:asc', label: 'Lowest Rated' },
  { value: 'release_year:asc', label: 'Oldest Releases' },
  { value: 'updated_on:asc', label: 'Oldest Uploads' },
];

interface SortDropdownProps {
  defaultSort?: SortOption;
}

export function SortDropdown({ defaultSort = 'updated_on:desc' }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort_by') as SortOption || defaultSort;

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort_by', value);
    params.set('page', '1'); // Reset to page 1 when sort changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 focus:bg-muted">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
