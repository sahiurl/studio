
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
// Removed Footer import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_ACCESS_PASSWORD, APP_NAME } from '@/lib/constants';
import type { Metadata } from 'next';

// No direct export of Metadata for client components, handled by Next.js if in a server component parent or layout
// export const metadata: Metadata = {
//   title: `Admin Access | ${APP_NAME}`,
// };

export default function AdminAccessPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated, redirect to dashboard
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === ADMIN_ACCESS_PASSWORD) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
      }
      router.push('/admin/dashboard');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Enter the password to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/50 focus:bg-muted"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      {/* Footer component usage removed from here, it's handled by layout.tsx */}
    </div>
  );
}
