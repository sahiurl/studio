
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { APP_NAME } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-8 mt-auto border-t border-border/40 bg-background/50">
      <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-3 mb-4">
          <Link href="/disclaimer" className="text-sm hover:text-primary transition-colors">
            Disclaimer
          </Link>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </div>
        <p className="text-xs">
          &copy; {currentYear} {APP_NAME}. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          {APP_NAME} does not host any files on its server. All content is provided by non-affiliated third parties.
          Users are responsible for complying with all applicable laws in their jurisdiction.
        </p>
      </div>
    </footer>
  );
}
