/**
 * Represents a single PDF generation task in the pdf compilation queue.
 */
export default class PdfJob {
  constructor({ id, courseId, maxRetries = 3 }) {
    this.id = id;
    this.courseId = courseId;
    this.status = 'pending'; // 'pending' | 'processing' | 'completed' | 'failed'
    this.result = null;
    this.retries = 0;
    this.maxRetries = maxRetries;
    this.error = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * Sets job state to processing
   */
  start() {
    this.status = 'processing';
    this.startedAt = new Date();
    this.error = null;
  }

  /**
   * Completes the job with a result
   * @param {*} result 
   */
  complete(result) {
    this.status = 'completed';
    this.result = result;
    this.completedAt = new Date();
  }

  /**
   * Registers a failure and schedules a retry or marks as failed
   * @param {Error|string} error 
   */
  fail(error) {
    this.error = error instanceof Error ? error.message : String(error);
    this.retries += 1;
    
    if (this.retries >= this.maxRetries) {
      this.status = 'failed';
    } else {
      this.status = 'pending'; // Reset to allow retry
    }
  }
}
