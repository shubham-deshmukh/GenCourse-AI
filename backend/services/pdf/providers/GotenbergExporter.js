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
          html, body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            height: 100%;
          }
          .footer {
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

    // Build the header HTML to cover the top margin area with a dark background
    const headerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            height: 100%;
          }
          .header {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background-color: #030014;
            -webkit-print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="header"></div>
      </body>
      </html>
    `;

    // Construct FormData payload
    const formData = new FormData();
    
    // Gotenberg reads 'index.html', 'header.html', and 'footer.html' from 'files' field
    const indexBlob = new Blob([htmlContent], { type: 'text/html' });
    formData.append('files', indexBlob, 'index.html');

    const headerBlob = new Blob([headerHtml], { type: 'text/html' });
    formData.append('files', headerBlob, 'header.html');

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
    formData.append('waitDelay', '1.5s');

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
