
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { FeedbackFormData, FeedbackType } from '@/types';

const feedbackFormSchema = z.object({
  type: z.enum(['feedback', 'request', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export async function submitFeedbackAction(
  formData: FeedbackFormData
): Promise<{ success: boolean; message: string; feedbackId?: string }> {
  const validation = feedbackFormSchema.safeParse(formData);

  if (!validation.success) {
    return { success: false, message: `Validation Error: ${validation.error.errors.map(e => e.message).join(', ')}` };
  }

  try {
    const { type, message, email } = validation.data;

    const feedbackData = {
      type,
      message,
      email: email || null, // Store null if empty
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'feedbacks'), feedbackData);
    
    return { success: true, message: 'Your submission has been received. Thank you!', feedbackId: docRef.id };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    let errorMessage = 'Failed to submit feedback.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
