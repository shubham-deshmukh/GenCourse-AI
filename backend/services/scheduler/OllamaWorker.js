import Worker from './Worker.js';
import { callOllama } from '../ollamaService.js';
import { getEnv } from '../../config/env.js';

/**
 * Concrete Worker implementation for local Ollama LLM execution.
 */
export default class OllamaWorker extends Worker {
  constructor({ name = 'OllamaDefaultWorker', maxConcurrency = 1 } = {}) {
    // Default concurrency is 1 to prevent local models from running concurrently, which crashes most consumer GPUs/CPUs
    super({ name, provider: 'ollama', maxConcurrency });
  }

  /**
   * Performs the LLM generation via Ollama local API client
   * @param {Job} job 
   * @returns {Promise<string>}
   */
  async performWork(job) {
    const { type, payload } = job;
    const { systemPrompt, userPrompt, jsonMode, temperature, timeout } = payload;
    
    // Resolve local model name from env
    const model = getEnv('OLLAMA_MODEL', 'qwen2.5:1.5b-instruct');
    
    console.log(`[Worker:${this.name}] Generating ${type} for course: ${job.courseId} using Ollama model: "${model}"...`);
    
    const responseText = await callOllama({
      systemPrompt,
      userPrompt,
      jsonMode: !!jsonMode,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.1,
      timeout: timeout || 180000 // Local model generation can be slow, default to 180 seconds
    });
    
    return responseText;
  }

  /**
   * If local Ollama isn't running or times out, trigger worker cooldown
   * @param {Error} error 
   */
  handleError(error) {
    const errorMessage = String(error).toLowerCase();
    
    if (
      errorMessage.includes('econnrefused') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('network error')
    ) {
      // Ollama service is unreachable or overloaded. Trigger a 60-second cooldown so scheduler routes elsewhere.
      this.coolDown(60000);
    }
  }
}
