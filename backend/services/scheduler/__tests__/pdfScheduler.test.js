import test, { after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import pdfSchedulerDefault, { PdfScheduler } from '../pdf/PdfScheduler.js';
import PdfJob from '../pdf/PdfJob.js';
import Course from '../../../models/Course.js';

// Prevent the default scheduler singleton's background timer from ticking
clearInterval(pdfSchedulerDefault.intervalId);

import generationEvents from '../eventEmitter.js';
import LocalPuppeteerExporter from '../../pdf/providers/LocalPuppeteerExporter.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global mock memory store for DB updates
let mockDbUpdates = {};
let mockCourses = {};

// Mock DB methods to avoid connection errors and keep tests isolated
Course.findByIdAndUpdate = async (id, update) => {
  mockDbUpdates[id] = { ...mockDbUpdates[id], ...update };
  return { _id: id, ...mockDbUpdates[id] };
};

Course.findById = (id) => {
  return {
    populate: async () => {
      return {
        _id: id,
        title: mockCourses[id]?.title || 'Mock Course',
        description: 'Mock Description',
        modules: mockCourses[id]?.modules || [
          {
            title: 'Module 1: Intro',
            lessons: [
              { title: 'Lesson 1.1', content: 'Markdown content' }
            ]
          }
        ],
        quizzes: mockCourses[id]?.quizzes || []
      };
    }
  };
};

// Mock the LocalPuppeteerExporter to prevent launching actual headless Chromium
LocalPuppeteerExporter.prototype.generatePdf = async (_course) => {
  return Buffer.from('mock-pdf-binary-buffer');
};

// Helper helper to await the asynchronous scheduler queue processing
async function waitForQueueDrain(pdfScheduler) {
  await new Promise(resolve => setTimeout(resolve, 2));
  while (pdfScheduler.isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

test('PdfScheduler - Enqueuing a Job', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-enqueue-test-id';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  // Track event emission
  let sseEventEmitted = null;
  const eventListener = (data) => {
    sseEventEmitted = data;
  };
  generationEvents.on(`course:${courseId}`, eventListener);

  try {
    // 1. Enqueue job
    await pdfScheduler.addPdfJob(courseId);

    // 2. Wait for background tick to finish
    await waitForQueueDrain(pdfScheduler);

    // 3. Assertions on scheduler state
    assert.strictEqual(pdfScheduler.queue.length, 0); 
    assert.strictEqual(mockDbUpdates[courseId].pdfStatus, 'completed');
    assert.strictEqual(mockDbUpdates[courseId].pdfUrl, `/api/courses/${courseId}/download-pdf`);
    
    // 4. Assert SSE event
    assert.ok(sseEventEmitted);
    assert.strictEqual(sseEventEmitted.event, 'pdf_status');
    assert.strictEqual(sseEventEmitted.data.status, 'completed');
  } finally {
    generationEvents.off(`course:${courseId}`, eventListener);
  }
});

test('PdfScheduler - Sequential Processing Safety', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId1 = 'course-seq-1';
  const courseId2 = 'course-seq-2';
  mockDbUpdates[courseId1] = {};
  mockDbUpdates[courseId2] = {};
  mockCourses[courseId1] = {};
  mockCourses[courseId2] = {};

  // Mock worker.generate to hang/delay so we can verify sequential lock
  const originalGenerate = pdfScheduler.worker.generate;
  let resolveGenerate = null;
  const generatePromise = new Promise((resolve) => {
    resolveGenerate = resolve;
  });
  
  pdfScheduler.worker.generate = async () => {
    await generatePromise;
    return { filePath: 'mock-path', pdfUrl: 'mock-url' };
  };

  try {
    // 1. Enqueue two jobs
    const enqueuePromise1 = pdfScheduler.addPdfJob(courseId1);
    const enqueuePromise2 = pdfScheduler.addPdfJob(courseId2);

    // 2. Run a small yield to let the first job transition to processing
    await new Promise(resolve => setTimeout(resolve, 2));

    // 3. Verify first job is processing, and second job is still pending in the queue
    assert.strictEqual(pdfScheduler.isProcessing, true);
    assert.strictEqual(pdfScheduler.queue.length, 2);
    assert.strictEqual(pdfScheduler.queue[0].courseId, courseId1);
    assert.strictEqual(pdfScheduler.queue[0].status, 'processing');
    assert.strictEqual(pdfScheduler.queue[1].courseId, courseId2);
    assert.strictEqual(pdfScheduler.queue[1].status, 'pending');

    // 4. Resolve the mock generator for the first job
    resolveGenerate();
    await enqueuePromise1;

    // 5. Wait for the first job to finish processing completely
    await waitForQueueDrain(pdfScheduler);

    // 6. Manually tick the scheduler to process the second job
    await pdfScheduler.tick();
    await enqueuePromise2;

    // 7. Wait for the second job to finish processing completely
    await waitForQueueDrain(pdfScheduler);
    
    // 8. Assert queue is now empty
    console.log('DEBUG Test 2 queue:', pdfScheduler.queue.map(j => ({ id: j.id, courseId: j.courseId, status: j.status, retries: j.retries })));
    assert.strictEqual(pdfScheduler.queue.length, 0);
    assert.strictEqual(pdfScheduler.isProcessing, false);
  } finally {
    pdfScheduler.worker.generate = originalGenerate;
  }
});

test('PdfScheduler - Generation Error Cleanup', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-error-test';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  // Mock exporter to throw an error
  const originalGeneratePdf = LocalPuppeteerExporter.prototype.generatePdf;
  LocalPuppeteerExporter.prototype.generatePdf = async () => {
    throw new Error('Chromium crash or format error');
  };

  let sseEventEmitted = null;
  const eventListener = (data) => {
    sseEventEmitted = data;
  };
  generationEvents.on(`course:${courseId}`, eventListener);

  try {
    // Override the job constructor maxRetries config so it fails on first try for this specific test
    const originalAddPdfJob = pdfScheduler.addPdfJob;
    pdfScheduler.addPdfJob = async (id) => {
      await Course.findByIdAndUpdate(id, { pdfStatus: 'queued' });
      const job = new PdfJob({ id: `pdf-${id}`, courseId: id, maxRetries: 1 });
      pdfScheduler.queue.push(job);
      pdfScheduler.tick();
    };

    await pdfScheduler.addPdfJob(courseId);

    // Wait for the background worker tick to finish and fail
    await waitForQueueDrain(pdfScheduler);

    // Assert DB reflects failed status and queue was cleared
    assert.strictEqual(pdfScheduler.queue.length, 0);
    assert.strictEqual(mockDbUpdates[courseId].pdfStatus, 'failed');
    
    // Assert SSE update was emitted with error detail
    assert.ok(sseEventEmitted);
    assert.strictEqual(sseEventEmitted.data.status, 'failed');
    assert.strictEqual(sseEventEmitted.data.error, 'Chromium crash or format error');

    // Restore original addPdfJob
    pdfScheduler.addPdfJob = originalAddPdfJob;
  } finally {
    LocalPuppeteerExporter.prototype.generatePdf = originalGeneratePdf;
    generationEvents.off(`course:${courseId}`, eventListener);
  }
});

test('PdfScheduler - Duplicate Job Suppression', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-duplicate-test';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  // Mock worker.generate to hang so we can test duplicate enqueues during processing
  const originalGenerate = pdfScheduler.worker.generate;
  let resolveGenerate;
  const generatePromise = new Promise((resolve) => {
    resolveGenerate = resolve;
  });
  pdfScheduler.worker.generate = async () => {
    await generatePromise;
  };

  try {
    // Enqueue the first job
    await pdfScheduler.addPdfJob(courseId);
    assert.strictEqual(pdfScheduler.queue.length, 1);

    // Attempt to enqueue a duplicate job for the same courseId
    await pdfScheduler.addPdfJob(courseId);

    // Queue length must still be 1 (duplicate skipped)
    assert.strictEqual(pdfScheduler.queue.length, 1);
  } finally {
    resolveGenerate();
    pdfScheduler.worker.generate = originalGenerate;
  }
});

test('PdfScheduler - Max Retry Exhaustion', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-retry-exhaustion-test';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  // Force exporter to fail consistently
  const originalGeneratePdf = LocalPuppeteerExporter.prototype.generatePdf;
  LocalPuppeteerExporter.prototype.generatePdf = async () => {
    throw new Error('Transient Database Error');
  };

  try {
    // Enqueue job with maxRetries set to 3 (default)
    await pdfScheduler.addPdfJob(courseId);
    
    // 1st Attempt fails
    await waitForQueueDrain(pdfScheduler);
    assert.strictEqual(pdfScheduler.queue.length, 1); // Remains in queue
    assert.strictEqual(pdfScheduler.queue[0].retries, 1);
    assert.strictEqual(pdfScheduler.queue[0].status, 'pending');

    // 2nd Attempt
    await pdfScheduler.tick();
    await waitForQueueDrain(pdfScheduler);
    assert.strictEqual(pdfScheduler.queue.length, 1); // Remains in queue
    assert.strictEqual(pdfScheduler.queue[0].retries, 2);
    assert.strictEqual(pdfScheduler.queue[0].status, 'pending');

    // 3rd Attempt (Exhausts retries)
    await pdfScheduler.tick();
    await waitForQueueDrain(pdfScheduler);
    
    // Cleanup filters out the job completely now that status transitioned to 'failed'
    assert.strictEqual(pdfScheduler.queue.length, 0);
    assert.strictEqual(mockDbUpdates[courseId].pdfStatus, 'failed');
  } finally {
    LocalPuppeteerExporter.prototype.generatePdf = originalGeneratePdf;
  }
});

test('Exporter - Malformed / Sparse Course Compilation Fallbacks', async () => {
  const exporter = new LocalPuppeteerExporter();
  
  // Pass a completely malformed course document with empty modules and empty quizzes
  const malformedCourse = {
    title: 'Sparse Syllabus',
    description: 'Empty syllabus test',
    modules: [],
    quizzes: []
  };

  // Ensure compiling doesn't throw a TypeError/crash and successfully compiles skeleton HTML
  const compiledHtml = exporter.compileHtml(malformedCourse);
  
  assert.ok(compiledHtml);
  assert.match(compiledHtml, /Sparse Syllabus/);
  assert.match(compiledHtml, /Table of Contents/);
  assert.doesNotMatch(compiledHtml, /<div class="module-section"/);
  assert.doesNotMatch(compiledHtml, /<div class="quiz-card"/);
});

test('PdfScheduler - Exact SSE Event Payload Structure', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-sse-payload-test';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  const eventsEmitted = [];
  const eventListener = (data) => {
    eventsEmitted.push(data);
  };
  generationEvents.on(`course:${courseId}`, eventListener);

  try {
    await pdfScheduler.addPdfJob(courseId);
    await waitForQueueDrain(pdfScheduler);

    // Verify correct progression of SSE events
    assert.strictEqual(eventsEmitted.length, 3);
    
    // 1st: queued
    assert.deepStrictEqual(eventsEmitted[0], {
      event: 'pdf_status',
      data: { status: 'queued' }
    });

    // 2nd: generating
    assert.deepStrictEqual(eventsEmitted[1], {
      event: 'pdf_status',
      data: { status: 'generating' }
    });

    // 3rd: completed
    assert.deepStrictEqual(eventsEmitted[2], {
      event: 'pdf_status',
      data: {
        status: 'completed',
        url: `/api/courses/${courseId}/download-pdf`
      }
    });
  } finally {
    generationEvents.off(`course:${courseId}`, eventListener);
  }
});

test('PdfScheduler - File Cleanup / Storage Directory Verification', async () => {
  const pdfScheduler = new PdfScheduler();
  clearInterval(pdfScheduler.intervalId);

  const courseId = 'course-file-write-test';
  mockDbUpdates[courseId] = {};
  mockCourses[courseId] = {};

  const storagePath = path.join(__dirname, '../../../storage/pdfs');
  const expectedFilePath = path.join(storagePath, `${courseId}.pdf`);

  // Ensure any legacy leftover file is deleted
  try {
    await fs.unlink(expectedFilePath);
  } catch {
    // Ignore if file does not exist
  }

  try {
    await pdfScheduler.addPdfJob(courseId);
    await waitForQueueDrain(pdfScheduler);

    // Verify physical file was written to backend/storage/pdfs/
    const fileExists = await fs.access(expectedFilePath).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, true, 'PDF file was not created on disk.');

    // Verify content matches the mock buffer we compiled
    const fileContent = await fs.readFile(expectedFilePath);
    assert.strictEqual(fileContent.toString(), 'mock-pdf-binary-buffer');
  } finally {
    // Delete file to keep repository clean
    try {
      await fs.unlink(expectedFilePath);
    } catch {
      // Ignore if deletion fails
    }
  }
});

after(async () => {
  await mongoose.disconnect();
});
