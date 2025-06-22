
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Loader2, PlusCircle, ArrowLeft } from 'lucide-react';
import type { FirestorePostData } from '@/types';
import { APP_NAME } from '@/lib/constants';

// No direct export of Metadata for client components
// export const metadata: Metadata = {
//   title: `Manage Posts | ${APP_NAME}`,
// };


export default function ManagePostsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FirestorePostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<FirestorePostData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
      router.replace('/admin/access');
    } else {
      fetchPosts();
    }
  }, [router]);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<FirestorePostData, 'id' | 'createdAt'> & { createdAt: Timestamp }; // Firestore data
        return {
          ...data,
          id: doc.id,
          // Ensure all fields from AdminPostFormData are present or defaulted if optional
          title: data.title || '',
          mediaType: data.mediaType || 'movie',
          description: data.description || '',
          posterUrl: data.posterUrl || '',
          backdropUrl: data.backdropUrl || null,
          releaseYear: data.releaseYear || new Date().getFullYear(),
          rating: data.rating === undefined ? null : data.rating,
          ripQuality: data.ripQuality || '',
          languages: Array.isArray(data.languages) ? data.languages : [],
          genres: Array.isArray(data.genres) ? data.genres : [],
          runtime: data.mediaType === 'movie' ? (data.runtime === undefined ? null : data.runtime) : null,
          totalSeasons: data.mediaType === 'tv' ? (data.totalSeasons === undefined ? null : data.totalSeasons) : null,
          totalEpisodes: data.mediaType === 'tv' ? (data.totalEpisodes === undefined ? null : data.totalEpisodes) : null,
          downloadOptions: Array.isArray(data.downloadOptions) ? data.downloadOptions : [],
          createdAt: data.createdAt.toDate(), // Convert Timestamp to Date for easier display if needed
        } as FirestorePostData;
      });
      setPosts(fetchedPosts);
    } catch (e) {
      console.error('Error fetching posts: ', e);
      setError('Failed to fetch posts. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch posts.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (post: FirestorePostData) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
      toast({
        title: 'Success',
        description: `Post "${postToDelete.title}" deleted successfully.`,
      });
    } catch (e) {
      console.error('Error deleting post: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete post.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setPostToDelete(null);
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
                <h1 className="text-3xl font-headline font-semibold">Manage Posts</h1>
            </div>
          <Button asChild>
            <Link href="/admin/posts/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Post
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading posts...</p>
          </div>
        )}
        {error && <p className="text-destructive text-center">{error}</p>}

        {!isLoading && !error && posts.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No posts found. Create one!</p>
        )}

        {!isLoading && !error && posts.length > 0 && (
          <div className="bg-card p-6 rounded-lg shadow-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.mediaType === 'tv' ? 'TV Show' : 'Movie'}</TableCell>
                    <TableCell>{post.releaseYear}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/posts/edit/${post.id}`}> 
                          <Edit className="mr-1 h-4 w-4" /> Edit
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(post)} disabled={isDeleting}>
                        {isDeleting && postToDelete?.id === post.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
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
      {/* Footer component usage removed from here */}
      {/* <Footer /> */}

      {postToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the post
                "{postToDelete.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPostToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
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

