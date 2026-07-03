import test from 'node:test';
import assert from 'node:assert';
import PdfExporterFactory from '../../pdf/providers/PdfExporterFactory.js';
import LocalPuppeteerExporter from '../../pdf/providers/LocalPuppeteerExporter.js';
import GotenbergExporter from '../../pdf/providers/GotenbergExporter.js';

test('PdfExporterFactory - Provider Resolution', () => {
  const originalProvider = process.env.PDF_PROVIDER;

  try {
    // 1. Defaults to LocalPuppeteerExporter
    delete process.env.PDF_PROVIDER;
    let exporter = PdfExporterFactory.getExporter();
    assert.ok(exporter instanceof LocalPuppeteerExporter);

    // 2. Resolves Puppeteer case-insensitively
    process.env.PDF_PROVIDER = 'PUPPETEER';
    exporter = PdfExporterFactory.getExporter();
    assert.ok(exporter instanceof LocalPuppeteerExporter);

    // 3. Resolves Gotenberg case-insensitively
    process.env.PDF_PROVIDER = 'Gotenberg';
    exporter = PdfExporterFactory.getExporter();
    assert.ok(exporter instanceof GotenbergExporter);

    // 4. Fallback for unknown providers
    process.env.PDF_PROVIDER = 'unknown-provider';
    exporter = PdfExporterFactory.getExporter();
    assert.ok(exporter instanceof LocalPuppeteerExporter);
  } finally {
    if (originalProvider) {
      process.env.PDF_PROVIDER = originalProvider;
    } else {
      delete process.env.PDF_PROVIDER;
    }
  }
});

test('GotenbergExporter - HTML compilation and Multipart request encoding', async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.PDF_PROVIDER;
  const originalUrl = process.env.GOTENBERG_URL;

  process.env.PDF_PROVIDER = 'gotenberg';
  process.env.GOTENBERG_URL = 'http://mock-gotenberg:3000';

  const course = {
    title: 'Test Gotenberg Course',
    description: 'Verify multipart compilation',
    modules: [
      {
        title: 'Module 1',
        lessons: [
          { title: 'Lesson 1', content: 'Markdown content for Gotenberg' }
        ]
      }
    ],
    quizzes: []
  };

  let capturedUrl = null;
  let capturedOptions = null;

  // Mock global fetch
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;

    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => {
        // Return a mock PDF binary buffer
        return new TextEncoder().encode('mock-gotenberg-pdf-binary').buffer;
      }
    };
  };

  try {
    const exporter = PdfExporterFactory.getExporter();
    assert.ok(exporter instanceof GotenbergExporter);

    const pdfBuffer = await exporter.generatePdf(course);

    // Assert fetch call details
    assert.strictEqual(capturedUrl, 'http://mock-gotenberg:3000/forms/chromium/convert/html');
    assert.strictEqual(capturedOptions.method, 'POST');
    assert.ok(capturedOptions.body instanceof FormData);

    // Inspect the FormData fields
    const formData = capturedOptions.body;
    assert.strictEqual(formData.get('paperWidth'), '8.27');
    assert.strictEqual(formData.get('paperHeight'), '11.69');
    assert.strictEqual(formData.get('marginTop'), '0.625');
    assert.strictEqual(formData.get('marginBottom'), '0.833');
    assert.strictEqual(formData.get('printBackground'), 'true');
    assert.strictEqual(formData.get('displayHeaderFooter'), 'true');

    // Inspect compiled files
    const files = formData.getAll('files');
    assert.strictEqual(files.length, 3);

    const indexFile = files.find(f => f.name === 'index.html' || (f instanceof File && f.name === 'index.html'));
    const headerFile = files.find(f => f.name === 'header.html' || (f instanceof File && f.name === 'header.html'));
    const footerFile = files.find(f => f.name === 'footer.html' || (f instanceof File && f.name === 'footer.html'));

    assert.ok(indexFile);
    assert.ok(headerFile);
    assert.ok(footerFile);

    // Verify PDF buffer response
    assert.strictEqual(pdfBuffer.toString(), 'mock-gotenberg-pdf-binary');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.PDF_PROVIDER = originalProvider;
    process.env.GOTENBERG_URL = originalUrl;
  }
});

test('GotenbergExporter - Handles Gotenberg API errors gracefully', async () => {
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 500,
      text: async () => 'Internal server crash in Gotenberg Chromium'
    };
  };

  try {
    const exporter = new GotenbergExporter();
    await assert.rejects(
      async () => exporter.generatePdf({ title: 'Crash' }),
      /Gotenberg returned error status 500: Internal server crash in Gotenberg Chromium/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
