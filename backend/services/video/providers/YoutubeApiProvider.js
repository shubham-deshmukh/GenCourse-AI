import VideoProvider from './VideoProvider.js';
import { getEnv } from '../../../config/env.js';

/**
 * YouTube search provider using the official Google YouTube Data API (v3).
 */
export default class YoutubeApiProvider extends VideoProvider {
  constructor() {
    super('YouTube Official API');
  }

  /**
   * Search for a video matching the query using official YouTube Data API.
   *
   * @param {string} query - The query to search for
   * @returns {Promise<string|null>} The resolved Video ID or null
   */
  async searchVideo(query) {
    const apiKey = getEnv('YOUTUBE_API_KEY', '');
    if (!apiKey) {
      console.warn(`[${this.name}] YOUTUBE_API_KEY is not defined. Skipping primary search.`);
      return null;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('q', query);
    url.searchParams.append('type', 'video');
    url.searchParams.append('key', apiKey);

    console.log(`[${this.name}] Searching video for query: "${query}"`);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${this.name}] Search API returned error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const items = data.items || [];
    if (items.length === 0) {
      console.log(`[${this.name}] No videos found for query: "${query}"`);
      return null;
    }

    const videoId = items[0]?.id?.videoId;
    if (videoId) {
      console.log(`[${this.name}] Found video ID: "${videoId}"`);
      return videoId;
    }

    return null;
  }
}
