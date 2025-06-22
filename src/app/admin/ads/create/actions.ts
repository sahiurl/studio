
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { AdFormData, AdExpiryUnit } from '@/types';
import { revalidatePath } from 'next/cache';

function calculateExpiryTimestamp(value: number, unit: AdExpiryUnit): Timestamp {
  const now = new Date();
  let expiryDate = new Date(now);

  switch (unit) {
    case 'minutes':
      expiryDate.setMinutes(now.getMinutes() + value);
      break;
    case 'hours':
      expiryDate.setHours(now.getHours() + value);
      break;
    case 'days':
      expiryDate.setDate(now.getDate() + value);
      break;
    default:
      throw new Error('Invalid expiry unit');
  }
  return Timestamp.fromDate(expiryDate);
}

export async function createAdAction(formData: AdFormData): Promise<{ success: boolean; message: string; adId?: string }> {
  try {
    const { title, posterImageUrl, buttonLabel, targetUrl, expiryValue, expiryUnit } = formData;

    if (!title || !posterImageUrl || !buttonLabel || !targetUrl || expiryValue <= 0) {
      return { success: false, message: 'Missing required fields or invalid expiry value.' };
    }

    const expiresAt = calculateExpiryTimestamp(expiryValue, expiryUnit);

    const adData = {
      title,
      posterImageUrl,
      buttonLabel,
      targetUrl,
      expiryValue,
      expiryUnit,
      createdAt: serverTimestamp(),
      expiresAt,
    };

    const docRef = await addDoc(collection(db, 'ads'), adData);
    
    revalidatePath('/admin/ads/manage'); // Revalidate the manage page to show new ad
    revalidatePath('/'); // Revalidate home page or relevant pages where ads might show

    return { success: true, message: `Ad "${title}" created successfully.`, adId: docRef.id };
  } catch (error) {
    console.error('Error creating ad:', error);
    let errorMessage = 'Failed to create ad.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
