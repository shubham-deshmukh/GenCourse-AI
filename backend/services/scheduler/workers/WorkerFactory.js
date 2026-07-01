import GeminiWorker from './providers/GeminiWorker.js';
import OllamaWorker from './providers/OllamaWorker.js';

const WORKER_REGISTRY = {
  gemini: GeminiWorker,
  ollama: OllamaWorker
};

/**
 * Creates a concrete Worker instance based on its provider configuration.
 * @param {object} config - Configuration object for the worker
 * @returns {import('./Worker.js').default}
 */
export function createWorker(config) {
  if (!config || !config.provider) {
    throw new Error('Worker configuration must specify a provider type.');
  }

  const WorkerClass = WORKER_REGISTRY[config.provider.toLowerCase()];
  if (!WorkerClass) {
    throw new Error(`Unsupported LLM provider type: ${config.provider}`);
  }

  return new WorkerClass(config);
}
