import VideoProvider from './VideoProvider.js';
import yts from 'yt-search';

/**
 * YouTube search provider using public scraping via the 'yt-search' npm library.
 */
export default class YoutubeSearchFallback extends VideoProvider {
  constructor() {
    super('YouTube Scraper Fallback');
  }

  /**
   * Search for a video matching the query using public scraper.
   *
   * @param {string} query - The query to search for
   * @returns {Promise<string|null>} The resolved Video ID or null
   */
  async searchVideo(query) {
    console.log(`[${this.name}] Searching video for query: "${query}"`);

    const result = await yts(query);
    const videos = result.videos || [];

    if (videos.length === 0) {
      console.log(`[${this.name}] No videos resolved for query: "${query}"`);
      return null;
    }

    const videoId = videos[0]?.videoId;
    if (videoId) {
      console.log(`[${this.name}] Found video ID: "${videoId}"`);
      return videoId;
    }

    return null;
  }
}
