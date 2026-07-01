import Worker from './Worker.js';
import { callGemini } from '../geminiService.js';
import { getEnv } from '../../config/env.js';

/**
 * Concrete Worker implementation for Google Gemini LLM API.
 */
export default class GeminiWorker extends Worker {
  constructor({ name = 'GeminiDefaultWorker', maxConcurrency = 2 } = {}) {
    super({ name, provider: 'gemini', maxConcurrency });
  }

  /**
   * Performs the LLM generation via Gemini SDK
   * @param {Job} job 
   * @returns {Promise<string>}
   */
  async performWork(job) {
    const { type, payload } = job;
    const { systemPrompt, userPrompt, jsonMode, temperature, timeout } = payload;
    
    // Resolve model dynamically based on job type or general env variables
    const purposeModelEnvKey = `${type.toUpperCase()}_LLM_MODEL`;
    const model = getEnv(purposeModelEnvKey, getEnv('GEMINI_MODEL', 'gemini-1.5-flash'));
    
    console.log(`[Worker:${this.name}] Generating ${type} for course: ${job.courseId} using Gemini model: "${model}"...`);
    
    const responseText = await callGemini({
      systemPrompt,
      userPrompt,
      jsonMode: !!jsonMode,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.1,
      timeout: timeout || 120000
    });
    
    return responseText;
  }

  /**
   * If Gemini returns a 429 rate limit or quota exceeded error, cool down the worker
   * @param {Error} error 
   */
  handleError(error) {
    const errorMessage = String(error).toLowerCase();
    
    if (
      errorMessage.includes('429') || 
      errorMessage.includes('quota exceeded') || 
      errorMessage.includes('rate limit')
    ) {
      // Cool down this specific worker for 30 seconds to allow the rate limit bucket to reset
      this.coolDown(30000);
    }
  }
}
