
'use server';

import { updateFeedbackStatus as updateStatusInDb } from '@/lib/firebase';
import type { FeedbackStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function updateFeedbackStatusAction(
  feedbackId: string,
  newStatus: FeedbackStatus
): Promise<{ success: boolean; message: string }> {
  if (!feedbackId || !newStatus) {
    return { success: false, message: 'Feedback ID and new status are required.' };
  }

  try {
    await updateStatusInDb(feedbackId, newStatus);
    revalidatePath('/admin/feedback'); // Revalidate the feedback management page
    return { success: true, message: `Feedback status updated to ${newStatus}.` };
  } catch (error) {
    console.error('Error updating feedback status action:', error);
    let errorMessage = 'Failed to update feedback status.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
