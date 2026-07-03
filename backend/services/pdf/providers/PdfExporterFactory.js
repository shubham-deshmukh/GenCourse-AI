import { getEnv } from '../../../config/env.js';
import LocalPuppeteerExporter from './LocalPuppeteerExporter.js';
import GotenbergExporter from './GotenbergExporter.js';

/**
 * Factory class to instantiate the configured PDF exporter provider.
 */
export default class PdfExporterFactory {
  /**
   * Retrieves the configured exporter instance.
   * @returns {PdfExporter}
   */
  static getExporter() {
    const provider = getEnv('PDF_PROVIDER', 'puppeteer').toLowerCase();

    switch (provider) {
      case 'gotenberg':
        return new GotenbergExporter();
      case 'puppeteer':
      default:
        return new LocalPuppeteerExporter();
    }
  }
}
