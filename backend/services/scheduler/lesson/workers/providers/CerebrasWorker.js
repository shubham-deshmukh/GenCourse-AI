import Worker from '../Worker.js';
import axios from 'axios';

/**
 * Concrete Worker implementation for Cerebras Cloud LLM API.
 */
export default class CerebrasWorker extends Worker {
  constructor({ name = 'CerebrasDefaultWorker', maxConcurrency = 2, apiKey, model } = {}) {
    super({ name, provider: 'cerebras', maxConcurrency });
    this.apiKey = apiKey;
    this.model = model || 'gpt-oss-120b';
  }

  /**
   * Performs LLM generation via Cerebras API
   * @param {LessonJob} job 
   * @returns {Promise<string>}
   */
  async performWork(job) {
    const { type, payload } = job;
    const { systemPrompt, userPrompt, jsonMode, temperature, timeout } = payload;

    console.log(`[Worker:${this.name}] Generating ${type} for course: ${job.courseId} using Cerebras model "${this.model}"...`);

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const requestPayload = {
      model: this.model,
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.1,
      stream: false
    };

    if (jsonMode) {
      requestPayload.response_format = { type: 'json_object' };
    }

    try {
      const response = await axios.post(
        'https://api.cerebras.ai/v1/chat/completions',
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: timeout || 120000
        }
      );

      const contentText = response.data?.choices?.[0]?.message?.content;
      if (!contentText) {
        throw new Error('No content returned from Cerebras API');
      }

      return contentText;
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Cerebras API error: ${errorMsg}`, { cause: error });
    }
  }

  /**
   * Handle rate limiting or server overload for Cerebras
   * @param {Error} error 
   */
  handleError(error) {
    const errorMessage = String(error).toLowerCase();
    if (
      errorMessage.includes('429') || 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')
    ) {
      this.coolDown(30000); // 30 seconds cooldown
    }
  }
}
