
'use client'; 

import { useState, useEffect } from 'react'; 
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPrivacyPolicyContentAction } from '@/app/admin/settings/actions';


export default function PrivacyPolicyPage() {
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string | null>(null);
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState<string | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    setLastUpdatedDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    async function fetchContent() {
      try {
        const content = await getPrivacyPolicyContentAction();
        setPrivacyPolicyContent(content);
      } catch (error) {
        console.error("Failed to fetch privacy policy content", error);
        // Keep default content if fetch fails
      } finally {
        setIsLoadingContent(false);
      }
    }
    fetchContent();
  }, []);

  const defaultPrivacyPolicy = `
Your privacy is important to us. This Privacy Policy explains how ${APP_NAME} ("we", "us", or "our") collects, uses, and discloses information about you when you use our website and services (collectively, the "Service").

**Information We Collect**
We may collect the following types of information:
- Log Data: When you use our Service, our servers automatically record information ("Log Data"), including your IP address, browser type, operating system, the referring web page, pages visited, location, your mobile carrier, device information, search terms, and cookie information. This data is used for analytics and service improvement and is not typically linked to personally identifiable information.
- Cookies: We use cookies to collect information and improve our Services. A cookie is a small data file that we transfer to your device. We may use "session ID cookies" to enable certain features of the Service, to better understand how you interact with the Service and to monitor aggregate usage and web traffic routing on the Service. You can control cookie settings through your browser.
- User Submissions: If you submit feedback or requests through our Service, we may collect the information you provide, such as your email address (if provided) and the content of your message. This information is used solely to address your submission.
- Analytics: We use Firebase Analytics to collect anonymized and aggregated information about your use of the Service to help us understand how users engage with our app and to improve its functionality.

**How We Use Information**
We use the information we collect to:
- Provide, maintain, and improve our Service.
- Monitor and analyze trends, usage, and activities in connection with our Service.
- Respond to your comments, questions, and requests (if you provide contact information for this purpose).
- Personalize and improve the Service and provide advertisements, content, or features that match user profiles or interests (e.g., via ads served by third-party networks).

**Information Sharing and Disclosure**
We do not sell your personal information. We may share information about you as follows or as otherwise described in this Privacy Policy:
- With Service Providers: We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., hosting, analytics). These providers are obligated to protect your information.
- For Legal Reasons: We may disclose your information if we believe that disclosure is reasonably necessary to comply with any applicable law, regulation, legal process, or governmental request, or to protect the rights, property, and safety of ${APP_NAME}, our users, or the public.
- Aggregated or De-Identified Data: We may share aggregated or de-identified information, which cannot reasonably be used to identify you.

**Third-Party Links & Advertising**
Our Service links to third-party websites and content. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies. Ads appearing on our site may be delivered by third-party advertising partners, who may set cookies. These cookies allow the ad server to recognize your computer each time they send you an online advertisement to compile information about you or others who use your computer. This information allows ad networks to, among other things, deliver targeted advertisements that they believe will be of most interest to you. This Privacy Policy does not cover the use of cookies by any advertisers.

**Your Choices**
You can usually instruct your browser, by changing its settings, to stop accepting cookies or to prompt you before accepting a cookie from the websites you visit. If you do not accept cookies, however, you may not be able to use all aspects of our Service.

**Data Security**
We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no internet or email transmission is ever fully secure or error-free.

**Children's Privacy**
Our Service is not directed to individuals under the age of 13 (or the relevant age in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.

**Changes to This Policy**
We may update this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).

**Contact Us**
If you have any questions about this Privacy Policy, please contact us through the feedback form available on our website.
  `.trim();

  const displayContent = isLoadingContent ? "Loading content..." : (privacyPolicyContent || defaultPrivacyPolicy);


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
            <CardTitle className="text-3xl font-headline text-center">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
            {lastUpdatedDate ? <p><strong>Last Updated:</strong> {lastUpdatedDate}</p> : <p><strong>Last Updated:</strong> Loading...</p>}
            
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">Loading policy...</p>
              </div>
            ) : (
              <div className="whitespace-pre-line">{displayContent}</div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

