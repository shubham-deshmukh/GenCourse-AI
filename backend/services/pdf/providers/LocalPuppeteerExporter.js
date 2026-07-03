import puppeteer from 'puppeteer';
import PdfExporter from './PdfExporter.js';

export default class LocalPuppeteerExporter extends PdfExporter {
  /**
   * Generates a PDF buffer from fully populated course data
   * @param {Object} course 
   * @returns {Promise<Buffer>}
   */
  async generatePdf(course) {
    const htmlContent = this.compileHtml(course);

    // Launch headless browser with sandbox options for Linux/Docker compatibility
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set the generated HTML content and wait for network/styles to settle
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Print PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Empty top header
        footerTemplate: `
          <div style="font-family: 'Inter', sans-serif; font-size: 8px; width: 100%; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px; color: #888; display: flex; justify-content: space-between; padding-left: 40px; padding-right: 40px;">
            <span>GenCourse AI Academy</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
        margin: {
          top: '60px',
          bottom: '80px',
          left: '0px',
          right: '0px'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}
