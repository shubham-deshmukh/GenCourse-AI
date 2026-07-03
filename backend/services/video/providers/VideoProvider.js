/**
 * Base abstract class defining the contract for video search providers.
 */
export default class VideoProvider {
  /**
   * @param {string} name - Name of the provider
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Searches for a video matching the query.
   * Must return the Video ID (string) if found, otherwise null.
   *
   * @param {string} query - The query to search for
   * @returns {Promise<string|null>} The resolved Video ID or null
   */
  async searchVideo(query) {
    throw new Error(`searchVideo() is not implemented in provider "${this.name}"`);
  }
}
