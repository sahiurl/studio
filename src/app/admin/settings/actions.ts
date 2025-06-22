
'use server';

import { z } from 'zod';
import { updateSiteSettings as updateSiteSettingsInDb, getSiteSettings } from '@/lib/firebase'; // Renamed for clarity
import type { SiteSettings, AdminSiteSettingsFormData } from '@/types';
import { revalidatePath } from 'next/cache';

// This password is intentionally not part of the SiteSettings type or Firestore document.
// It's only used server-side to authorize disabling the special button.
const CREATE_WEBSITE_BUTTON_DISABLE_PASSWORD = '9630';

const siteSettingsSchema = z.object({
  appUrl: z.string().url("Application URL must be a valid URL").or(z.literal("")).optional(),
  telegramChannelUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  howToDownloadVideoUrl: z.string().url("Must be a valid video URL (e.g., YouTube)").or(z.literal("")).optional(),
  howToDownloadInstructions: z.string().min(10, "Instructions must be at least 10 characters").or(z.literal("")).optional(),
  disclaimerContent: z.string().min(20, "Disclaimer content must be at least 20 characters").or(z.literal("")).optional(),
  privacyPolicyContent: z.string().min(20, "Privacy Policy content must be at least 20 characters").or(z.literal("")).optional(),
  telegramBotToken: z.string().optional().or(z.literal("")),
  telegramChannelIds: z.string().optional().or(z.literal("")),
  enableUrlShortener: z.boolean().optional(),
  urlShortenerApiUrl: z.string().url("Shortener API URL must be valid if provided").or(z.literal("")).optional(),
  urlShortenerApiKey: z.string().optional().or(z.literal("")),
  enableCreateWebsiteButton: z.boolean().optional(),
  createWebsiteButtonText: z.string().min(1, "Button text cannot be empty if button is enabled").or(z.literal("")).optional(),
  disableButtonPasswordAttempt: z.string().optional(), // For the disable check
}).refine(data => {
  if (data.enableUrlShortener) {
    return !!data.urlShortenerApiUrl && data.urlShortenerApiUrl.trim() !== '' &&
           !!data.urlShortenerApiKey && data.urlShortenerApiKey.trim() !== '';
  }
  return true;
}, {
  message: "If URL Shortener is enabled, both API URL and API Key must be provided.",
  path: ['enableUrlShortener'], 
}).refine(data => {
  if (data.enableCreateWebsiteButton && (!data.createWebsiteButtonText || data.createWebsiteButtonText.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Button text is required if 'Create Your Own Website' button is enabled.",
  path: ['createWebsiteButtonText'],
});


export async function updateSiteSettingsAction(
  formData: AdminSiteSettingsFormData
): Promise<{ success: boolean; message: string }> {
  const validationResult = siteSettingsSchema.safeParse(formData);

  if (!validationResult.success) {
    return { success: false, message: `Validation Error: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
  }

  const validatedData = validationResult.data;

  try {
    const currentSettings = await getSiteSettings();
    const wasSpecialButtonEnabled = currentSettings?.enableCreateWebsiteButton === true;
    const isTryingToDisableSpecialButton = validatedData.enableCreateWebsiteButton === false && wasSpecialButtonEnabled;

    if (isTryingToDisableSpecialButton) {
      if (validatedData.disableButtonPasswordAttempt !== CREATE_WEBSITE_BUTTON_DISABLE_PASSWORD) {
        return { success: false, message: "Incorrect password to disable the 'Create Your Own Website' button." };
      }
    }

    // Prepare settings for Firestore, excluding the password attempt field
    const settingsToSave: SiteSettings = {
      appUrl: validatedData.appUrl || '',
      telegramChannelUrl: validatedData.telegramChannelUrl || '',
      howToDownloadVideoUrl: validatedData.howToDownloadVideoUrl || '',
      howToDownloadInstructions: validatedData.howToDownloadInstructions || '',
      disclaimerContent: validatedData.disclaimerContent || '',
      privacyPolicyContent: validatedData.privacyPolicyContent || '',
      telegramBotToken: validatedData.telegramBotToken || '',
      telegramChannelIds: validatedData.telegramChannelIds || '',
      enableUrlShortener: validatedData.enableUrlShortener || false,
      urlShortenerApiUrl: validatedData.urlShortenerApiUrl || '',
      urlShortenerApiKey: validatedData.urlShortenerApiKey || '',
      enableCreateWebsiteButton: validatedData.enableCreateWebsiteButton === undefined ? wasSpecialButtonEnabled : validatedData.enableCreateWebsiteButton, // preserve if not sent
      createWebsiteButtonText: validatedData.createWebsiteButtonText || 'Create Your Own Website',
    };

    await updateSiteSettingsInDb(settingsToSave);
    
    revalidatePath('/', 'layout'); 
    revalidatePath('/how-to-download');
    revalidatePath('/disclaimer');
    revalidatePath('/privacy-policy');
    revalidatePath('/admin/posts/create', 'page');
    revalidatePath('/details', 'layout');

    return { success: true, message: 'Site settings updated successfully.' };
  } catch (error) {
    console.error('Error updating site settings:', error);
    let errorMessage = 'Failed to update site settings.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}

export async function getPublicSiteSettingsAction(): Promise<SiteSettings | null> {
    const settings = await getSiteSettings();
    return settings; 
}

export async function getTelegramUrlAction(): Promise<string | null> {
    const settings = await getSiteSettings();
    return settings?.telegramChannelUrl || null;
}

export async function getHowToDownloadContentAction(): Promise<{ videoUrl?: string; instructions?: string }> {
  const settings = await getSiteSettings();
  return {
    videoUrl: settings?.howToDownloadVideoUrl || undefined,
    instructions: settings?.howToDownloadInstructions || undefined,
  };
}

export async function getDisclaimerContentAction(): Promise<string | undefined> {
  const settings = await getSiteSettings();
  return settings?.disclaimerContent || undefined;
}

export async function getPrivacyPolicyContentAction(): Promise<string | undefined> {
  const settings = await getSiteSettings();
  return settings?.privacyPolicyContent || undefined;
}

    