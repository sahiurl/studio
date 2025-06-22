'use client'; // Required for usePathname hook

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import { FirebaseAnalyticsTracker } from '@/components/layout/firebase-analytics-tracker';
import { FeedbackSection } from '@/components/layout/feedback-section';
import { Footer } from '@/components/layout/footer';
import { usePathname } from 'next/navigation';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <head>
        <title>{APP_NAME}</title>
        <meta name="description" content={`Modern movie streaming web app - ${APP_NAME}`} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen" suppressHydrationWarning={true}>
        <FirebaseAnalyticsTracker />
        <div className="flex-grow">
          {children}
        </div>
        {!isAdminPage && <FeedbackSection />}
        {!isAdminPage && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
