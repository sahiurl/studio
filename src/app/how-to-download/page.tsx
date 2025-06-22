
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, VideoOff } from 'lucide-react';
import { getHowToDownloadContentAction } from '@/app/admin/settings/actions';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: `How to Download | ${APP_NAME}`,
  description: `Instructions on how to download content from ${APP_NAME}.`,
};

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        return url; // Already an embed URL
      } else if (urlObj.hostname === 'youtu.be') {
         videoId = urlObj.pathname.substring(1);
      }
    } else if (urlObj.hostname === 'youtu.be') {
         videoId = urlObj.pathname.substring(1);
    }
     // Check for common direct embed format (less common for YouTube but good fallback)
    if (url.includes('/embed/')) return url;


    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    // Invalid URL
    console.warn("Invalid video URL for YouTube conversion:", url, e);
  }
  // If it's not a recognizable YouTube URL, return null or the original if it looks like an embed link
  if (url.includes('/embed/')) return url; 
  return null;
}


export default async function HowToDownloadPage() {
  const { videoUrl, instructions } = await getHowToDownloadContentAction();
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  const defaultInstructions = `
Welcome to ${APP_NAME}! Follow these simple steps to download your favorite movies and TV shows.

**Step 1: Find Your Content**
Browse through our extensive library of movies and webseries. Use the search bar or navigate through the "Movies" and "Webseries" sections to find what you're looking for.

**Step 2: Go to the Details Page**
Once you find a movie or TV show you like, click on its poster or title to go to its details page.

**Step 3: Choose Download Option**
On the details page, scroll down to find the "Download Options" or "Telegram Options" section. Here you'll see links for different qualities and sources.
  - **Direct Download:** Clicking a "Download" button will usually start the download directly in your browser or through a download manager if you have one.
  - **Telegram Options:** Clicking an "Open Telegram" or "Telegram File" button will typically redirect you to our Telegram bot or channel where you can access the file. Ensure you have Telegram installed.

**Tips for Faster Downloads:**
  - Use a stable internet connection. Wi-Fi is generally recommended over mobile data for large files.
  - Consider using a download manager application for better speed and resume capabilities, especially for direct download links.
  - For Telegram, ensure your app is updated to the latest version.

If you encounter any issues, feel free to join our Telegram channel for support! (Link in the header, if configured)
  `.trim();

  const displayInstructions = instructions || defaultInstructions;

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
            <CardTitle className="text-3xl font-headline text-center">How to Download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {embedUrl ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-inner">
                <iframe
                  src={embedUrl}
                  title="How to Download Tutorial Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : videoUrl ? ( // If videoUrl was provided but couldn't be converted to an embed URL
                <div className="p-4 border rounded-md bg-muted text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                    <VideoOff className="w-12 h-12 mb-3 text-destructive" />
                    <p className="text-center font-medium">Could not load video tutorial.</p>
                    <p className="text-xs text-center">The provided video URL might be incorrect or not embeddable: <br/> <code className="text-xs bg-destructive/10 px-1 py-0.5 rounded">{videoUrl}</code> </p>
                </div>
            ) : (
              <div className="p-4 border-dashed border-2 rounded-md bg-muted text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                <VideoOff className="w-12 h-12 mb-3" />
                <p className="text-center font-medium">Tutorial Video Not Available</p>
                <p className="text-xs text-center">A video guide has not been set up in the admin panel yet.</p>
              </div>
            )}
            
            <Separator />

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Instructions:</h2>
              <div 
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground space-y-3"
                dangerouslySetInnerHTML={{ __html: displayInstructions.replace(/\n/g, '<br />') }} 
              />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
