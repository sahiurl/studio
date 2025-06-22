
'use server';

import { getSiteSettings } from '@/lib/firebase';

// Adapted for Linkcents-like APIs
async function callShortenerApi(apiUrl: string, apiKey: string, originalUrl: string): Promise<string> {
  try {
    // Ensure apiUrl doesn't end with a slash if it's just the domain,
    // but preserve it if it's part of a path like /api
    let cleanedApiUrl = apiUrl;
    if (apiUrl.endsWith('/') && !apiUrl.endsWith('/api/')) { // Avoid stripping / from /api/
        cleanedApiUrl = apiUrl.slice(0, -1);
    }
    
    // Construct the URL compatible with Linkcents: API_URL?api=API_KEY&url=ORIGINAL_URL
    // The originalUrl is already encoded, so it should not be encoded again here.
    const fullApiUrl = `${cleanedApiUrl}?api=${encodeURIComponent(apiKey)}&url=${originalUrl}`;
    
    console.log(`[URLShortenerService] Attempting to shorten. Full API URL: ${fullApiUrl}`);

    const response = await fetch(fullApiUrl, {
      method: 'GET', 
      headers: {
        'Accept': 'application/json', 
      }
    });

    const responseText = await response.text(); 
    

    if (!response.ok) {
      console.error(`[URLShortenerService] API error for URL ${originalUrl}. Status: ${response.status}. Response: ${responseText}`);
      return originalUrl; 
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`[URLShortenerService] Parsed API Response JSON for ${originalUrl}:`, data);
    } catch (e) {
      console.error(`[URLShortenerService] API response for ${originalUrl} was not valid JSON: ${responseText}`, e);
      return originalUrl; 
    }
    
    if (data.status === 'success' && data.shortenedUrl && typeof data.shortenedUrl === 'string' && data.shortenedUrl.startsWith('http')) {
      console.log(`[URLShortenerService] Success! Original: ${originalUrl}, Shortened: ${data.shortenedUrl}`);
      return data.shortenedUrl;
    } else {
      console.warn(`[URLShortenerService] API did not return a valid 'success' status or 'shortenedUrl' for ${originalUrl}. Response:`, data);
      return originalUrl; 
    }

  } catch (error) {
    console.error(`[URLShortenerService] Network or other error calling URL Shortener API for ${originalUrl}:`, error);
    return originalUrl; 
  }
}

export async function shortenSingleUrlIfEnabled(originalUrl: string): Promise<string> {
  if (typeof originalUrl !== 'string' || !originalUrl.trim()) {
    return originalUrl;
  }

  let processedUrl = originalUrl.trim();
  
  if (processedUrl.startsWith('t.me/') && !processedUrl.startsWith('https://') && !processedUrl.startsWith('http://')) {
    processedUrl = `https://${processedUrl}`;
  }

  if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
    return originalUrl; 
  }
  
  const settings = await getSiteSettings();
  
  if (
    settings?.enableUrlShortener &&
    settings.urlShortenerApiUrl &&
    settings.urlShortenerApiKey &&
    settings.urlShortenerApiUrl.trim() !== '' &&
    settings.urlShortenerApiKey.trim() !== ''
  ) {
    console.log(`[URLShortenerService] Shortener enabled. API URL: ${settings.urlShortenerApiUrl.trim()}, Key: ${settings.urlShortenerApiKey.trim().substring(0,5)}... for URL: ${processedUrl}`);
    return callShortenerApi(settings.urlShortenerApiUrl.trim(), settings.urlShortenerApiKey.trim(), processedUrl);
  }
  
  return originalUrl;
}

