/**
 * Base abstract class for an execution worker in the lesson generation workflow.
 */
export default class Worker {
  constructor({ name, provider, maxConcurrency = 1 }) {
    if (this.constructor === Worker) {
      throw new Error('Abstract class Worker cannot be instantiated directly.');
    }
    this.name = name;
    this.provider = provider; // 'gemini' | 'ollama' etc.
    this.maxConcurrency = maxConcurrency;
    this.activeJobsCount = 0;
    this.coolDownUntil = null;
  }

  /**
   * Checks if this worker is capable of accepting a job right now
   * @returns {boolean}
   */
  isAvailable() {
    if (this.coolDownUntil && new Date() < this.coolDownUntil) {
      return false;
    }
    return this.activeJobsCount < this.maxConcurrency;
  }

  /**
   * Temporarily disables the worker (e.g., if we hit a 429 rate limit)
   * @param {number} durationMs 
   */
  coolDown(durationMs) {
    console.warn(`[Worker:${this.name}] Entering cooldown for ${durationMs}ms`);
    this.coolDownUntil = new Date(Date.now() + durationMs);
  }

  /**
   * Runs the job workflow, tracking active job count, execution timing, and failures
   * @param {LessonJob} job 
   * @returns {Promise<any>}
   */
  async execute(job) {
    if (!this.isAvailable()) {
      throw new Error(`Worker ${this.name} is not available.`);
    }

    this.activeJobsCount++;
    job.start();
    
    try {
      const result = await this.performWork(job);
      job.complete(result);
      return result;
    } catch (error) {
      job.fail(error);
      this.handleError(error);
      throw error;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  /**
   * Core logic to generate text/data (to be implemented by subclasses)
   * @param {LessonJob} job 
   * @returns {Promise<any>}
   */
  async performWork(job) {
    throw new Error('performWork() must be implemented by concrete worker subclass');
  }

  /**
   * Post-execution error hooks to check for rate-limiting status codes (to be overridden if needed)
   * @param {Error} error 
   */
  handleError(error) {
    // Placeholder to allow subclass custom cooldown triggers
  }
}
