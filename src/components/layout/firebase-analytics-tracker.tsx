
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { app } from '@/lib/firebase';
import { getAnalytics, logEvent, isSupported, setUserId, setUserProperties } from 'firebase/analytics';

export function FirebaseAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeAndLog = async () => {
      // isSupported() checks if the current environment supports Firebase Analytics.
      if (typeof window !== 'undefined' && (await isSupported())) {
        const analytics = getAnalytics(app);
        
        // Construct the full URL for more detailed tracking
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        
        // Log the page_view event
        logEvent(analytics, 'page_view', {
          page_path: url,
          page_title: document.title, // Uses the current document title
          // You can add more parameters here if needed, e.g., page_location: window.location.href
        });

        // Example: If you have user authentication, you could set user ID and properties
        // const userId = getCurrentUserId(); // Replace with your actual user ID logic
        // if (userId) {
        //   setUserId(analytics, userId);
        //   setUserProperties(analytics, { user_role: 'subscriber' }); // Example user property
        // }

      }
    };
    initializeAndLog();
  }, [pathname, searchParams]); // Re-run effect when pathname or searchParams change

  return null; // This component does not render anything visible
}
