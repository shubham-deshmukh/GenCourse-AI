import PdfWorker from './workers/PdfWorker.js';
import PdfJob from './PdfJob.js';
import Course from '../../../models/Course.js';
import generationEvents from '../eventEmitter.js';

/**
 * Standalone queue coordinator for background PDF generation jobs.
 * Runs an in-memory queue to process requests sequentially.
 * Decoupled from lesson generation queue templates.
 */
export class PdfScheduler {
  constructor() {
    this.queue = []; // Array of PdfJob instances
    this.worker = new PdfWorker();
    this.isProcessing = false;

    // Tick the scheduler loop every 1 second to process pending tasks
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  /**
   * Enqueues a PDF generation job for a course
   * @param {string} courseId 
   */
  async addPdfJob(courseId) {
    console.log(`[PdfScheduler] Enqueuing PDF generation task for course: ${courseId}`);

    // Prevent duplicate processing if a job is already in progress or queued
    const existingJob = this.queue.find(
      j => j.courseId === courseId && (j.status === 'pending' || j.status === 'processing')
    );

    if (existingJob) {
      console.log(`[PdfScheduler] PDF job for course ${courseId} is already active. Skipping duplicate enqueue.`);
      return;
    }

    // 1. Update database state
    await Course.findByIdAndUpdate(courseId, { pdfStatus: 'queued' });

    // 2. Queue the job metadata using the PdfJob class
    const job = new PdfJob({
      id: `pdf-${courseId}`,
      courseId
    });
    this.queue.push(job);

    // 3. Emit SSE update to client
    generationEvents.emit(`course:${courseId}`, {
      event: 'pdf_status',
      data: { status: 'queued' }
    });

    // 4. Trigger immediate queue tick
    this.tick();
  }

  /**
   * Scheduler tick loop: dispatches pending jobs sequentially.
   */
  async tick() {
    // 1. If currently processing a PDF, wait
    if (this.isProcessing) {
      return;
    }

    // 2. Grab the oldest pending job
    const job = this.queue.find(j => j.status === 'pending');
    if (!job) {
      return;
    }

    // 3. Set flags and run execution workflow
    job.start();
    this.isProcessing = true;

    try {
      await this.worker.generate(job.courseId);
      job.complete();
      
      // Clean up completed job from memory
      this.queue = this.queue.filter(j => j.courseId !== job.courseId);
    } catch (err) {
      console.error(`[PdfScheduler] PDF generation failed for course ${job.courseId}:`, err);
      job.fail(err);
      
      // Clean up failed job from memory queue only when retries are exhausted
      if (job.status === 'failed') {
        this.queue = this.queue.filter(j => j.courseId !== job.courseId);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Shutdown helper to clear interval (primarily for test environments)
   */
  shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

const pdfScheduler = new PdfScheduler();
export default pdfScheduler;
