import { getEnv } from '../../config/env.js';

/**
 * Searches for a YouTube video using the provided query and returns the video ID.
 * Returns null if the API key is not configured, if the search returns no results,
 * or if any error occurs.
 *
 * @param {string} query - The search query (e.g. "react state hook tutorial")
 * @returns {Promise<string|null>} The YouTube video ID or null
 */
export async function searchYoutubeVideo(query) {
  if (!query) {
    return null;
  }

  const apiKey = getEnv('YOUTUBE_API_KEY', '');
  if (!apiKey) {
    console.warn('[YouTube Service] YOUTUBE_API_KEY is not defined. Skipping video search.');
    return null;
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('q', query);
    url.searchParams.append('type', 'video');
    url.searchParams.append('key', apiKey);

    console.log(`[YouTube Service] Fetching video for query: "${query}"`);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YouTube Service] Search API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const items = data.items || [];
    if (items.length === 0) {
      console.log(`[YouTube Service] No videos found for query: "${query}"`);
      return null;
    }

    const videoId = items[0]?.id?.videoId;
    if (videoId) {
      console.log(`[YouTube Service] Found video ID: "${videoId}" for query: "${query}"`);
      return videoId;
    }

    return null;
  } catch (error) {
    console.error(`[YouTube Service] Search failed for query "${query}":`, error.message);
    return null;
  }
}
