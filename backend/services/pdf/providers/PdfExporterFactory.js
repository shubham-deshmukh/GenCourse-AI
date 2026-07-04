import { getEnv } from '../../../config/env.js';
import LocalPuppeteerExporter from './LocalPuppeteerExporter.js';
import GotenbergExporter from './GotenbergExporter.js';
import fs from 'fs';

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

    if (provider === 'puppeteer' && fs.existsSync('/.dockerenv')) {
      console.warn('⚠️ Warning: Local Puppeteer exporter is selected inside a Docker container, but Chromium is not bundled in the backend image. It is highly recommended to configure PDF_PROVIDER=gotenberg in production.');
    }

    switch (provider) {
      case 'gotenberg':
        return new GotenbergExporter();
      case 'puppeteer':
      default:
        return new LocalPuppeteerExporter();
    }
  }
}
