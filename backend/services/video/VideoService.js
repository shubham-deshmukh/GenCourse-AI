import YoutubeApiProvider from './providers/YoutubeApiProvider.js';
import YoutubeSearchFallback from './providers/YoutubeSearchFallback.js';

class VideoService {
  constructor() {
    this.providers = [
      new YoutubeApiProvider(),
      new YoutubeSearchFallback()
    ];
  }

  /**
   * Search for a matching video across all registered providers sequentially.
   * If a provider succeeds, returns the Video ID. If all fail, returns null.
   *
   * @param {string} query - The search query
   * @returns {Promise<string|null>} The resolved Video ID or null
   */
  async searchVideo(query) {
    if (!query) {
      return null;
    }

    for (const provider of this.providers) {
      try {
        const videoId = await provider.searchVideo(query);
        if (videoId) {
          console.log(`[VideoService] Successfully matched video using provider "${provider.name}": "${videoId}"`);
          return videoId;
        }
      } catch (err) {
        // Log error and allow fallback to the next provider
        console.error(`[VideoService] Provider "${provider.name}" failed:`, err.message);
      }
    }

    console.warn(`[VideoService] All video search providers failed for query: "${query}"`);
    return null;
  }
}

export default new VideoService();
