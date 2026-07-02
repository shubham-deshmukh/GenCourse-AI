/**
 * Base abstract class defining the interface for a PDF exporter.
 */
export default class PdfExporter {
  constructor() {
    if (this.constructor === PdfExporter) {
      throw new Error('Abstract class PdfExporter cannot be instantiated directly.');
    }
  }

  /**
   * Generates a PDF buffer from fully populated course data
   * @param {Object} course - The course document populated with modules and lessons
   * @returns {Promise<Buffer>} - Resolves to the PDF buffer
   */
  async generatePdf(course) {
    throw new Error('generatePdf(course) must be implemented by concrete exporter subclass');
  }
}
