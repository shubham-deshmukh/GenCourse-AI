# PDF Scheduler & Exporter Provider Integration Tests

This suite validates the in-memory queue management, sequential locking, retry logic, error handling, SSE notification dispatches, and multi-provider export mechanisms of the PDF generation pipeline (`PdfScheduler`, `PdfWorker`, and `PdfExporterFactory`).

---

## Target Test Suites

1. **`services/scheduler/__tests__/pdfScheduler.test.js`**: Core queue orchestration, database updates, and file I/O.
2. **`services/scheduler/__tests__/pdfExporter.test.js`**: Exporter provider selection and HTML multipart compilation for Gotenberg and Puppeteer.

---

## Test Scopes & Scenarios Documented

### 1. `pdfScheduler.test.js` Test Cases

* **Enqueuing a Job:**
  * Asserts calling `addPdfJob(courseId)` transitions the course's `pdfStatus` to `queued`, then `generating`, and finally `completed` with a download URL (`/api/courses/:id/download-pdf`).
  * Validates that SSE events are published on `course:<courseId>` with the payload structure `{ event: 'pdf_status', data: { status: 'completed', url: ... } }`.
* **Sequential Processing Safety:**
  * Enqueues multiple PDF requests concurrently and verifies that only one job transitions to `processing` while others remain `pending`.
  * Verifies that `isProcessing` flag accurately manages single-threaded execution to prevent resource exhaustion from headless Chromium instances.
* **Generation Error Cleanup:**
  * Simulates a rendering crash or database error during generation.
  * Verifies the course `pdfStatus` in MongoDB updates to `failed`, the queue is cleared, and an SSE failure event is dispatched with the error message.
* **Duplicate Job Suppression:**
  * Attempts to enqueue a second PDF generation job for an already active course.
  * Verifies the duplicate job is skipped and not duplicated in the queue.
* **Max Retry Exhaustion:**
  * Simulates intermittent failures and asserts that the job retries up to its `maxRetries` (default: 3) before finally marking the course as `failed` and removing the job from the queue.
* **Sparse / Malformed Syllabus Fallbacks:**
  * Compiles an empty or sparse course (no modules, empty quizzes) to ensure HTML template generation does not throw `TypeError` and falls back gracefully to a skeleton layout.
* **Physical Storage Verification:**
  * Asserts the rendered binary buffer is physically written to `backend/storage/pdfs/{courseId}.pdf` and verifies cleanup safety.

---

### 2. `pdfExporter.test.js` Test Cases

* **Provider Factory Resolution (`PdfExporterFactory`):**
  * Asserts `PDF_PROVIDER=puppeteer` (or omitted) resolves to `LocalPuppeteerExporter`.
  * Asserts `PDF_PROVIDER=gotenberg` (case-insensitive) resolves to `GotenbergExporter`.
  * Asserts unknown provider values fall back safely to `LocalPuppeteerExporter`.
* **Gotenberg Exporter Request Encoding:**
  * Tests that `GotenbergExporter` properly formats the multipart form-data payload (including `index.html`), sends the POST request to `${GOTENBERG_URL}/forms/chromium/convert/html`, and returns the binary PDF buffer.

---

## Running PDF Tests

Execute the PDF test suites using Node's native test runner:

```bash
# Run both PDF suites directly
node --env-file=.env --test services/scheduler/__tests__/pdfScheduler.test.js
node --env-file=.env --test services/scheduler/__tests__/pdfExporter.test.js
```

Or run all backend suites configured in `package.json`:
```bash
npm run test
```
