import Link from 'next/link';
import type { SVGProps } from 'react';
import { APP_NAME } from '@/lib/constants';

// Placeholder TV icon, replace with actual logo SVG if available
function TvIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  );
}


export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const textSizeClass = size === 'small' ? 'text-xl' : size === 'large' ? 'text-4xl' : 'text-3xl';
  const iconSizeClass = size === 'small' ? 'h-5 w-5' : size === 'large' ? 'h-8 w-8' : 'h-7 w-7';

  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label={`${APP_NAME} Home`}>
      <TvIcon className={`${iconSizeClass} text-primary group-hover:text-accent transition-colors`} />
      <span className={`font-headline font-bold ${textSizeClass} text-foreground group-hover:text-accent transition-colors`}>
        {APP_NAME}
      </span>
    </Link>
  );
}
