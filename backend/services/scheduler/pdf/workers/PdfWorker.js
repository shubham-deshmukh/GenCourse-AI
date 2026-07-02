import Course from '../../../../models/Course.js';
import LocalPuppeteerExporter from '../providers/LocalPuppeteerExporter.js';
import generationEvents from '../../eventEmitter.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Concrete worker responsible for fetching course schemas, converting markdown modules,
 * compiling PDF buffers via Puppeteer, and writing them to secure storage.
 * Decoupled from the base worker template.
 */
export default class PdfWorker {
  constructor() {
    this.exporter = new LocalPuppeteerExporter();
  }

  /**
   * Generates a PDF for a given course ID
   * @param {string} courseId 
   * @returns {Promise<Object>}
   */
  async generate(courseId) {
    console.log(`[PdfWorker] Starting PDF generation for course ID: ${courseId}`);

    try {
      // 1. Mark status as generating in DB
      await Course.findByIdAndUpdate(courseId, { pdfStatus: 'generating' });
      generationEvents.emit(`course:${courseId}`, {
        event: 'pdf_status',
        data: { status: 'generating' }
      });

      // 2. Fetch fully populated course
      const course = await Course.findById(courseId)
        .populate({
          path: 'modules',
          populate: { path: 'lessons' }
        });

      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      // 3. Generate PDF Buffer
      const pdfBuffer = await this.exporter.generatePdf(course);

      // 4. Save to secure storage (non-public VPS directory)
      const storagePath = path.join(__dirname, '../../../../storage/pdfs');
      await fs.mkdir(storagePath, { recursive: true });

      const filePath = path.join(storagePath, `${courseId}.pdf`);
      await fs.writeFile(filePath, pdfBuffer);
      console.log(`[PdfWorker] Successfully stored course PDF at: ${filePath}`);

      // 5. Update course status in DB
      const pdfUrl = `/api/courses/${courseId}/download-pdf`;
      await Course.findByIdAndUpdate(courseId, {
        pdfStatus: 'completed',
        pdfUrl
      });

      // 6. Notify SSE listeners of completion
      generationEvents.emit(`course:${courseId}`, {
        event: 'pdf_status',
        data: { status: 'completed', url: pdfUrl }
      });

      return { filePath, pdfUrl };

    } catch (error) {
      console.error(`[PdfWorker] Generation error for course ${courseId}:`, error);

      // Reset PDF status to failed in DB
      await Course.findByIdAndUpdate(courseId, { pdfStatus: 'failed' });
      
      // Notify SSE listeners of failure
      generationEvents.emit(`course:${courseId}`, {
        event: 'pdf_status',
        data: { status: 'failed', error: error.message }
      });

      throw error;
    }
  }
}
