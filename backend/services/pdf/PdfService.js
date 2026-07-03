import PdfExporterFactory from './providers/PdfExporterFactory.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PdfService {
  constructor() {
    this.exporter = PdfExporterFactory.getExporter();
  }

  /**
   * Generates a PDF buffer for a course document
   * @param {Object} course 
   * @returns {Promise<Buffer>}
   */
  async generatePdf(course) {
    return await this.exporter.generatePdf(course);
  }

  /**
   * Stores the PDF buffer in local secure storage
   * @param {string} courseId 
   * @param {Buffer} pdfBuffer 
   * @returns {Promise<string>} File path
   */
  async savePdfFile(courseId, pdfBuffer) {
    // Save to secure storage (non-public VPS directory)
    const storagePath = path.join(__dirname, '../../storage/pdfs');
    await fs.mkdir(storagePath, { recursive: true });

    const filePath = path.join(storagePath, `${courseId}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);
    return filePath;
  }
}

const pdfService = new PdfService();
export default pdfService;
