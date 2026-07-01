/**
 * Represents a single task in the course generation workflow (e.g. outline or lesson generation).
 */
export default class Job {
  constructor({ id, courseId, type, priority = 2, payload = {}, maxRetries = 3 }) {
    this.id = id;
    this.courseId = courseId;
    this.type = type; // 'outline' | 'lesson'
    this.priority = priority; // 1 (High) for outlines, 2 (Normal) for lessons
    this.status = 'pending'; // 'pending' | 'processing' | 'completed' | 'failed'
    this.payload = payload; // data needed by the worker (e.g., targetLessonTitle, modules, etc.)
    this.result = null; // result returned by LLM once completed
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
      this.status = 'pending'; // Reset to pending to allow retry scheduler to pick it up again
    }
  }
}
