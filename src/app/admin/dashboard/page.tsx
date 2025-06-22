
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
// Removed Footer import: import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListChecks, LayoutGrid, Settings, MessageSquareQuote } from 'lucide-react'; // Removed BarChartBig
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
      if (!isAuthenticated) {
        router.replace('/admin/access');
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('isAdminAuthenticated');
    }
    router.push('/admin/access');
  };

  // Render null or a loading state while checking auth to prevent flash of content
  if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-headline font-semibold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Content Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full h-auto py-4">
                <Link href="/admin/posts/create" className="flex flex-col items-center justify-center">
                  <PlusCircle className="mb-2 h-8 w-8" />
                  <span>Create New Post</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full h-auto py-4" variant="secondary">
                <Link href="/admin/posts/manage" className="flex flex-col items-center justify-center">
                  <ListChecks className="mb-2 h-8 w-8" />
                  <span>Manage Existing Posts</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Site Performance Card (Analytics) Removed */}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Ads Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button asChild size="lg" className="w-full h-auto py-4">
                <Link href="/admin/ads/create" className="flex flex-col items-center justify-center">
                  <PlusCircle className="mb-2 h-8 w-8" />
                  <span>Create New Ad</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full h-auto py-4" variant="secondary">
                <Link href="/admin/ads/manage" className="flex flex-col items-center justify-center">
                  <LayoutGrid className="mb-2 h-8 w-8" />
                  <span>Manage Existing Ads</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">User Interaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full h-auto py-4">
                <Link href="/admin/feedback" className="flex flex-col items-center justify-center">
                  <MessageSquareQuote className="mb-2 h-8 w-8" />
                  <span>Manage Feedback</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Site Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full h-auto py-4">
                <Link href="/admin/settings" className="flex flex-col items-center justify-center">
                  <Settings className="mb-2 h-8 w-8" />
                  <span>Manage Settings</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
      {/* Footer component usage removed from here, it's handled by layout.tsx */}
      {/* <Footer /> */}
    </div>
  );
}
