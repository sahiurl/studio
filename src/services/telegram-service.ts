
'use server';

import { getSiteSettings, getPostById } from '@/lib/firebase';
import type { FirestorePostData, SiteSettings } from '@/types';
import { APP_NAME } from '@/lib/constants';

interface TelegramServiceResponse {
  success: boolean;
  message: string;
  details?: any;
}

async function constructWebsiteLink(postId: string, mediaType: 'movie' | 'tv'): Promise<string> {
  const settings = await getSiteSettings();
  let baseUrl = '';

  if (settings?.appUrl && settings.appUrl.trim() !== '') {
    baseUrl = settings.appUrl.trim();
  } else {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    if (!baseUrl) {
      console.warn("App URL not configured in Site Settings and NEXT_PUBLIC_APP_URL environment variable is not set. Telegram links may be relative or incorrect.");
    }
  }
  // Ensure base URL doesn't end with a slash if it's not empty
  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  return `${baseUrl}/details/${mediaType}/${postId}`;
}

export async function sendTelegramPost(
  postId: string
): Promise<TelegramServiceResponse[]> {
  const settings = await getSiteSettings();
  if (!settings?.telegramBotToken || !settings?.telegramChannelIds) {
    return [{ success: false, message: 'Telegram Bot Token or Channel IDs not configured in site settings.' }];
  }

  const post = await getPostById(postId);
  if (!post) {
    return [{ success: false, message: `Post with ID ${postId} not found.`}];
  }

  const botToken = settings.telegramBotToken;
  const channelIds = settings.telegramChannelIds.split(',').map(id => id.trim()).filter(id => id);

  if (channelIds.length === 0) {
    return [{ success: false, message: 'No valid Telegram Channel IDs configured.' }];
  }

  const websiteLink = await constructWebsiteLink(postId, post.mediaType);

  let caption = `🎬 *${post.title}* (${post.releaseYear})\n\n`;
  caption += `🌟 Rating: ${post.rating ? post.rating.toFixed(1) : 'N/A'}\n`;
  caption += `🗣️ Languages: ${(post.languages && post.languages.length > 0) ? post.languages.join(', ') : 'N/A'}\n`;
  caption += `🏷️ Genres: ${(post.genres && post.genres.length > 0) ? post.genres.join(', ') : 'N/A'}\n\n`;
  
  const descriptionSnippet = post.description ? 
    (post.description.length > 200 ? `${post.description.substring(0, 200)}...` : post.description) 
    : 'No description available.';
  caption += `📝 ${descriptionSnippet}\n\n`;


  const responses: TelegramServiceResponse[] = [];

  for (const channelId of channelIds) {
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    
    const queryParams = new URLSearchParams({
      chat_id: channelId,
      photo: post.posterUrl,
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: `View on ${APP_NAME}`, url: websiteLink }]
        ]
      })
    });

    try {
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: 'POST', 
      });
      const result = await response.json();

      if (result.ok) {
        responses.push({ success: true, message: `Successfully posted to Telegram channel ${channelId}.` });
      } else {
        console.error(`Error posting to Telegram channel ${channelId}:`, result);
        responses.push({ success: false, message: `Error posting to Telegram channel ${channelId}: ${result.description || 'Unknown error'}`, details: result });
      }
    } catch (error) {
      console.error(`Network error posting to Telegram channel ${channelId}:`, error);
      responses.push({ success: false, message: `Network error posting to Telegram channel ${channelId}.`, details: error });
    }
  }
  return responses;
}
