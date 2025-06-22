
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
// Removed Footer import
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Loader2, PlusCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import type { FirestoreAdData } from '@/types';
import { format } from 'date-fns';

export default function ManageAdsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ads, setAds] = useState<FirestoreAdData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adToDelete, setAdToDelete] = useState<FirestoreAdData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
      router.replace('/admin/access');
    } else {
      fetchAds();
    }
  }, [router]);

  const fetchAds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const adsQuery = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(adsQuery);
      const fetchedAds = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const expiresAtDate = (data.expiresAt as Timestamp)?.toDate();
        const now = new Date();
        return {
          id: docSnap.id,
          title: data.title || '',
          posterImageUrl: data.posterImageUrl || '',
          buttonLabel: data.buttonLabel || '',
          targetUrl: data.targetUrl || '',
          expiryValue: data.expiryValue || 0,
          expiryUnit: data.expiryUnit || 'days',
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          expiresAt: expiresAtDate || new Date(),
          isActive: expiresAtDate ? expiresAtDate > now : false,
        } as FirestoreAdData;
      });
      setAds(fetchedAds);
    } catch (e) {
      console.error('Error fetching ads: ', e);
      setError('Failed to fetch ads. Please try again.');
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch ads.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (ad: FirestoreAdData) => {
    setAdToDelete(ad);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!adToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'ads', adToDelete.id));
      setAds(prevAds => prevAds.filter(ad => ad.id !== adToDelete.id));
      toast({ title: 'Success', description: `Ad "${adToDelete.title}" deleted successfully.` });
    } catch (e) {
      console.error('Error deleting ad: ', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete ad.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setAdToDelete(null);
    }
  };

  if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="flex-shrink-0">
              <Link href="/admin/dashboard" aria-label="Back to Admin Dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-headline font-semibold">Manage Ads</h1>
          </div>
          <Button asChild>
            <Link href="/admin/ads/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Ad
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading ads...</p>
          </div>
        )}
        {error && <p className="text-destructive text-center">{error}</p>}

        {!isLoading && !error && ads.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No ads found. Create one!</p>
        )}

        {!isLoading && !error && ads.length > 0 && (
          <div className="bg-card p-0 sm:p-2 md:p-4 rounded-lg shadow-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Poster</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Button</TableHead>
                  <TableHead className="hidden lg:table-cell">Target URL</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map(ad => (
                  <TableRow key={ad.id}>
                    <TableCell className="hidden sm:table-cell p-2">
                      <div className="w-16 h-16 relative rounded overflow-hidden bg-muted">
                        <Image
                          src={ad.posterImageUrl}
                          alt={`Poster for ${ad.title}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{ad.buttonLabel}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-xs break-all">
                        {ad.targetUrl.length > 30 ? `${ad.targetUrl.substring(0, 30)}...` : ad.targetUrl}
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0"/>
                      </a>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(ad.expiresAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? 'default' : 'destructive'} className="bg-opacity-80">
                        {ad.isActive ? 'Active' : 'Expired'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Edit button - placeholder for future */}
                      {/* <Button variant="outline" size="sm" asChild disabled>
                        <span className="cursor-not-allowed"><Edit className="mr-1 h-4 w-4" /> Edit</span>
                      </Button> */}
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(ad)} disabled={isDeleting}>
                        {isDeleting && adToDelete?.id === ad.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      {/* Footer component usage removed from here, it's handled by layout.tsx */}

      {adToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the ad
                "{adToDelete.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAdToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
