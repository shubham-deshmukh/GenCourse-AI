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
        headerTemplate: `
          <style>
            .header-wrapper {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 60px;
              background-color: #030014;
              -webkit-print-color-adjust: exact;
              margin: 0;
              padding: 0;
            }
          </style>
          <div class="header-wrapper"></div>
        `,
        footerTemplate: `
          <style>
            .footer-wrapper {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 80px;
              background-color: #030014;
              color: #888;
              font-family: 'Inter', sans-serif;
              font-size: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-left: 40px;
              padding-right: 40px;
              box-sizing: border-box;
              border-top: 1px solid rgba(255,255,255,0.05);
              -webkit-print-color-adjust: exact;
              margin: 0;
            }
          </style>
          <div class="footer-wrapper">
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
