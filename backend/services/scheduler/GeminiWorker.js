import { GoogleGenAI } from '@google/genai';
import Worker from './Worker.js';

/**
 * Concrete Worker implementation for Google Gemini LLM API.
 */
export default class GeminiWorker extends Worker {
  constructor({ name = 'GeminiDefaultWorker', maxConcurrency = 2, apiKey, model } = {}) {
    super({ name, provider: 'gemini', maxConcurrency });
    this.apiKey = apiKey;
    this.model = model;

    this.ai = new GoogleGenAI({
      apiKey: this.apiKey,
      httpOptions: {
        timeout: 300000 // 5 minutes in milliseconds
      }
    });
  }

  /**
   * Performs the LLM generation via Gemini SDK
   * @param {Job} job 
   * @returns {Promise<string>}
   */
  async performWork(job) {
    const { type, payload } = job;
    const { systemPrompt, userPrompt, jsonMode, temperature } = payload;
    
    const resolvedModel = this.model || 'gemini-1.5-flash';
    
    console.log(`[Worker:${this.name}] Generating ${type} for course: ${job.courseId} using Gemini model: "${resolvedModel}"...`);
    
    const config = {};
    if (jsonMode) {
      config.responseMimeType = 'application/json';
    }
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }
    if (typeof temperature === 'number') {
      config.temperature = temperature;
    }

    const response = await this.ai.models.generateContent({
      model: resolvedModel,
      contents: userPrompt,
      config
    });
    
    return response.text;
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
