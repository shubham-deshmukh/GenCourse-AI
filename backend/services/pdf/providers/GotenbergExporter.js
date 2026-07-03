import { getEnv } from '../../../config/env.js';
import PdfExporter from './PdfExporter.js';

export default class GotenbergExporter extends PdfExporter {
  /**
   * Generates a PDF buffer from fully populated course data using Gotenberg API
   * @param {Object} course 
   * @returns {Promise<Buffer>}
   */
  async generatePdf(course) {
    const htmlContent = this.compileHtml(course);
    const gotenbergUrl = getEnv('GOTENBERG_URL', 'http://localhost:3000');

    // Build the footer HTML as a complete document as required by Gotenberg
    const footerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            margin: 0;
            padding: 0;
          }
          .footer {
            width: 100%;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 5px;
            color: #888;
            display: flex;
            justify-content: space-between;
            padding-left: 40px;
            padding-right: 40px;
          }
        </style>
      </head>
      <body>
        <div class="footer">
          <span>GenCourse AI Academy</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      </body>
      </html>
    `;

    // Construct FormData payload
    const formData = new FormData();
    
    // Gotenberg reads 'index.html' and 'footer.html' from 'files' field
    const indexBlob = new Blob([htmlContent], { type: 'text/html' });
    formData.append('files', indexBlob, 'index.html');

    const footerBlob = new Blob([footerHtml], { type: 'text/html' });
    formData.append('files', footerBlob, 'footer.html');

    // Set page dimensions and margins (A4: 8.27in x 11.69in)
    formData.append('paperWidth', '8.27');
    formData.append('paperHeight', '11.69');
    formData.append('marginTop', '0.625');     // ~60px
    formData.append('marginBottom', '0.833');  // ~80px
    formData.append('marginLeft', '0');
    formData.append('marginRight', '0');
    formData.append('printBackground', 'true');
    formData.append('displayHeaderFooter', 'true');

    const endpoint = `${gotenbergUrl.replace(/\/$/, '')}/forms/chromium/convert/html`;
    console.log(`[GotenbergExporter] Sending PDF conversion request to: ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gotenberg returned error status ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('[GotenbergExporter] HTTP error communicating with Gotenberg:', error);
      throw error;
    }
  }
}
