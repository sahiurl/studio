
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getDisclaimerContentAction } from '@/app/admin/settings/actions';

export const metadata: Metadata = {
  title: `Disclaimer | ${APP_NAME}`,
  description: `Disclaimer for ${APP_NAME}.`,
};

export default async function DisclaimerPage() {
  const customContent = await getDisclaimerContentAction();

  const defaultDisclaimer = `
${APP_NAME} is a search engine and index for publicly available media files. We do not host, upload, or store any files on our servers. All content linked to by ${APP_NAME} is hosted on third-party websites and services that are not affiliated with us.

${APP_NAME} respects the intellectual property rights of others. If you believe that any content linked to by our service infringes your copyright, please contact the respective third-party hosting service to have the content removed. ${APP_NAME} acts solely as an index and does not have control over the content hosted by third parties. We encourage copyright holders to directly address content removal with the source host.

The use of ${APP_NAME} is at your own risk. We do not guarantee the accuracy, legality, or safety of the content found through our search engine. Users are responsible for complying with all applicable laws and regulations in their jurisdiction when accessing or downloading content.

All trademarks, logos, and brand names are the property of their respective owners. All company, product, and service names used in this website are for identification purposes only. Use of these names, trademarks, and brands does not imply endorsement by ${APP_NAME}.

${APP_NAME} is intended for personal, non-commercial use only. Any commercial use or redistribution of the content found via our service may be a violation of third-party terms of service or copyright laws.
  `.trim();

  const displayContent = customContent || defaultDisclaimer;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="mb-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
                </Link>
            </Button>
        </div>
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Disclaimer</CardTitle>
          </CardHeader>
          <CardContent 
            className="space-y-4 prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line"
          >
            {displayContent}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
