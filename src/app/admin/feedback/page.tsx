'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle, XCircle, MoreVertical, Eye } from 'lucide-react';
import type { FirestoreFeedbackData, FeedbackStatus } from '@/types';
import { getFeedbacksForAdmin } from '@/lib/firebase';
import { updateFeedbackStatusAction } from './actions';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<FeedbackStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
  approved: 'bg-green-500/20 text-green-700 border-green-500/50',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/50',
  viewed: 'bg-blue-500/20 text-blue-700 border-blue-500/50',
};

const statusIcons: Record<FeedbackStatus, React.ElementType> = {
  pending: Loader2, 
  approved: CheckCircle,
  rejected: XCircle,
  viewed: Eye,
};

export default function ManageFeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<FirestoreFeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
      router.replace('/admin/access');
    } else {
      fetchFeedbacks();
    }
  }, [router]);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFeedbacks = await getFeedbacksForAdmin();
      setFeedbacks(fetchedFeedbacks);
    } catch (e) {
      console.error('Error fetching feedbacks: ', e);
      setError('Failed to fetch feedbacks. Please try again.');
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch feedbacks.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    setIsUpdatingStatus(feedbackId);
    const result = await updateFeedbackStatusAction(feedbackId, newStatus);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setFeedbacks(prev => 
        prev.map(fb => fb.id === feedbackId ? { ...fb, status: newStatus, updatedAt: new Date() } : fb)
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsUpdatingStatus(null);
  };
  
  const renderStatusBadge = (status: FeedbackStatus) => {
    const IconComponent = statusIcons[status] || Eye;
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);

    const badgeContent = (
      <Badge variant="outline" className={`capitalize ${statusColors[status] || statusColors.viewed} font-medium px-2 py-1`}>
        <IconComponent className={`h-4 w-4 ${status === 'pending' && 'animate-spin'} ${(status === 'approved' || status === 'rejected') ? '' : 'mr-1.5'}`} />
        {(status !== 'approved' && status !== 'rejected') && statusText}
      </Badge>
    );

    if (status === 'approved' || status === 'rejected') {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badgeContent;
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
            <h1 className="text-3xl font-headline font-semibold">Manage Feedback & Requests</h1>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading submissions...</p>
          </div>
        )}
        {error && <p className="text-destructive text-center">{error}</p>}

        {!isLoading && !error && feedbacks.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No feedback or requests submitted yet.</p>
        )}

        {!isLoading && !error && feedbacks.length > 0 && (
          <div className="bg-card p-0 sm:p-2 md:p-4 rounded-lg shadow-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="hidden md:table-cell w-[180px]">Email</TableHead>
                  <TableHead className="hidden sm:table-cell w-[150px]">Submitted</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map(fb => (
                  <TableRow key={fb.id}>
                    <TableCell className="font-medium capitalize">{fb.type}</TableCell>
                    <TableCell className="max-w-xs truncate" title={fb.message}>{fb.message}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{fb.email || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                        {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{renderStatusBadge(fb.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdatingStatus === fb.id}>
                            {isUpdatingStatus === fb.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(['pending', 'viewed', 'rejected'] as FeedbackStatus[]).includes(fb.status) && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(fb.id, 'approved')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> <span className="text-white text-opacity-100">Approve</span>
                            </DropdownMenuItem>
                          )}
                           {(['pending', 'viewed', 'approved'] as FeedbackStatus[]).includes(fb.status) && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(fb.id, 'rejected')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                            </DropdownMenuItem>
                          )}
                          {fb.status === 'pending' && (
                             <DropdownMenuItem onClick={() => handleUpdateStatus(fb.id, 'viewed')}>
                              <Eye className="mr-2 h-4 w-4 text-blue-600" /> Mark as Viewed
                            </DropdownMenuItem>
                          )}
                          {(fb.status === 'approved' || fb.status === 'rejected') && (
                             <DropdownMenuItem onClick={() => handleUpdateStatus(fb.id, 'pending')}>
                              <Loader2 className="mr-2 h-4 w-4 text-yellow-600" /> Mark as Pending
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
