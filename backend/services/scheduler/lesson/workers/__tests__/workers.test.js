import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import axios from 'axios';
import { createWorker } from '../WorkerFactory.js';
import GeminiWorker from '../providers/GeminiWorker.js';
import OllamaWorker from '../providers/OllamaWorker.js';
import CerebrasWorker from '../providers/CerebrasWorker.js';

describe('LLM Workers & Providers Unit Tests', () => {
  const originalAxiosPost = axios.post;
  const originalFetch = globalThis.fetch;

  let capturedFetchUrl = '';
  let capturedFetchBody = null;
  let capturedAxiosUrl = '';
  let capturedAxiosBody = null;
  let capturedAxiosHeaders = null;

  beforeEach(() => {
    capturedFetchUrl = '';
    capturedFetchBody = null;
    capturedAxiosUrl = '';
    capturedAxiosBody = null;
    capturedAxiosHeaders = null;

    // Mock global fetch for GeminiWorker
    globalThis.fetch = async (url, options) => {
      capturedFetchUrl = url;
      capturedFetchBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Mocked Gemini Outline Content' }]
              }
            }
          ]
        })
      };
    };

    // Mock axios.post for Ollama and Cerebras
    axios.post = async (url, body, options = {}) => {
      capturedAxiosUrl = url;
      capturedAxiosBody = body;
      capturedAxiosHeaders = options.headers || {};
      
      // Handle Cerebras API structure
      if (url.includes('cerebras.ai')) {
        return {
          data: {
            choices: [
              {
                message: { content: 'Mocked Cerebras Text Response' }
              }
            ]
          }
        };
      }
      
      // Handle Ollama API structure
      if (url.includes('localhost') || url.includes('/api/chat')) {
        return {
          data: {
            message: { content: 'Mocked Ollama Text Response' }
          }
        };
      }
      
      throw new Error(`Mock axios got unexpected URL: ${url}`);
    };
  });

  after(() => {
    // Restore mocks
    axios.post = originalAxiosPost;
    globalThis.fetch = originalFetch;
  });

  describe('WorkerFactory - createWorker', () => {
    test('Correctly instantiates each worker provider type', () => {
      const gemini = createWorker({ provider: 'gemini', apiKey: 'g-key', model: 'gemini-model' });
      assert.ok(gemini instanceof GeminiWorker);
      assert.strictEqual(gemini.apiKey, 'g-key');
      assert.strictEqual(gemini.model, 'gemini-model');

      const ollama = createWorker({ provider: 'ollama', baseUrl: 'http://ollama:11434', model: 'ollama-model' });
      assert.ok(ollama instanceof OllamaWorker);
      assert.strictEqual(ollama.baseUrl, 'http://ollama:11434');
      assert.strictEqual(ollama.model, 'ollama-model');

      const cerebras = createWorker({ provider: 'cerebras', apiKey: 'c-key', model: 'cerebras-model' });
      assert.ok(cerebras instanceof CerebrasWorker);
      assert.strictEqual(cerebras.apiKey, 'c-key');
      assert.strictEqual(cerebras.model, 'cerebras-model');
    });

    test('Throws error for missing or unsupported provider configurations', () => {
      assert.throws(() => createWorker(null), /must specify a provider/);
      assert.throws(() => createWorker({}), /must specify a provider/);
      assert.throws(() => createWorker({ provider: 'unsupported-llm' }), /Unsupported LLM provider/);
    });
  });

  describe('GeminiWorker', () => {
    test('Constructs API requests and maps payload fields correctly', async () => {
      const worker = new GeminiWorker({
        name: 'GeminiTest',
        apiKey: 'g-key-123',
        model: 'gemini-custom-model'
      });

      const job = {
        type: 'outline',
        courseId: 'course-123',
        payload: {
          systemPrompt: 'System instructions',
          userPrompt: 'Construct course outline',
          jsonMode: true,
          temperature: 0.2
        }
      };

      const result = await worker.performWork(job);
      assert.strictEqual(result, 'Mocked Gemini Outline Content');
      
      // Assert capture HTTP fetch values
      assert.ok(capturedFetchUrl.includes('googleapis.com'));
      assert.strictEqual(capturedFetchBody.systemInstruction.parts[0].text, 'System instructions');
      assert.strictEqual(capturedFetchBody.contents[0].parts[0].text, 'Construct course outline');
      assert.strictEqual(capturedFetchBody.generationConfig.temperature, 0.2);
      assert.strictEqual(capturedFetchBody.generationConfig.responseMimeType, 'application/json');
    });

    test('Triggers 30 second cooldown upon rate limiting errors (429 or quota exceeded)', () => {
      const worker = new GeminiWorker({ apiKey: 'g-key' });
      assert.strictEqual(worker.coolDownUntil, null);

      // Simulate a transient quota exception
      worker.handleError(new Error('ResourceExhausted: 429 quota exceeded for project'));
      assert.ok(worker.coolDownUntil && worker.coolDownUntil > new Date(), 'Worker should trigger rate limit cooldown');
      
      // Clear cooldown state for cleanup
      worker.coolDownUntil = null;
    });
  });

  describe('CerebrasWorker', () => {
    test('Constructs API requests and sets Bearer token headers correctly', async () => {
      const worker = new CerebrasWorker({
        name: 'CerebrasTest',
        apiKey: 'c-key-456',
        model: 'llama3.1-70b'
      });

      const job = {
        type: 'lesson',
        courseId: 'course-123',
        payload: {
          systemPrompt: 'Keep it academic',
          userPrompt: 'Write textbook for memoization',
          jsonMode: true,
          temperature: 0.1
        }
      };

      const result = await worker.performWork(job);
      assert.strictEqual(result, 'Mocked Cerebras Text Response');

      // Assert captured Axios requests
      assert.strictEqual(capturedAxiosUrl, 'https://api.cerebras.ai/v1/chat/completions');
      assert.strictEqual(capturedAxiosHeaders['Authorization'], 'Bearer c-key-456');
      assert.strictEqual(capturedAxiosBody.model, 'llama3.1-70b');
      assert.strictEqual(capturedAxiosBody.messages[0].content, 'Keep it academic');
      assert.strictEqual(capturedAxiosBody.messages[1].content, 'Write textbook for memoization');
      assert.strictEqual(capturedAxiosBody.response_format.type, 'json_object');
    });

    test('Triggers cooldown when Cerebras rate limit error occurs', () => {
      const worker = new CerebrasWorker({ apiKey: 'c-key' });
      assert.strictEqual(worker.coolDownUntil, null);

      worker.handleError(new Error('Cerebras error: 429 too many requests'));
      assert.ok(worker.coolDownUntil && worker.coolDownUntil > new Date());

      worker.coolDownUntil = null;
    });
  });

  describe('OllamaWorker', () => {
    test('Calls local chat endpoint with expected prompt templates', async () => {
      const worker = new OllamaWorker({
        name: 'OllamaTest',
        baseUrl: 'http://my-ollama:11434',
        model: 'qwen-deepseek'
      });

      const job = {
        type: 'lesson',
        courseId: 'course-123',
        payload: {
          systemPrompt: 'You are local Ollama',
          userPrompt: 'Construct simple loop explanation',
          jsonMode: false,
          temperature: 0.3
        }
      };

      const result = await worker.performWork(job);
      assert.strictEqual(result, 'Mocked Ollama Text Response');

      // Assert captured Axios requests
      assert.strictEqual(capturedAxiosUrl, 'http://my-ollama:11434/api/chat');
      assert.strictEqual(capturedAxiosBody.model, 'qwen-deepseek');
      assert.strictEqual(capturedAxiosBody.messages[0].content, 'You are local Ollama');
      assert.strictEqual(capturedAxiosBody.messages[1].content, 'Construct simple loop explanation');
      assert.strictEqual(capturedAxiosBody.options.temperature, 0.3);
      assert.strictEqual(capturedAxiosBody.format, undefined); // jsonMode false
    });

    test('Triggers a 60 second cooldown on connection refused or timeout errors', () => {
      const worker = new OllamaWorker();
      assert.strictEqual(worker.coolDownUntil, null);

      worker.handleError(new Error('axios error: ECONNREFUSED connect call'));
      assert.ok(worker.coolDownUntil && worker.coolDownUntil > new Date());

      worker.coolDownUntil = null;
    });
  });
});
