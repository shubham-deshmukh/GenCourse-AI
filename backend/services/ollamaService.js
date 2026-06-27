import axios from 'axios';

/**
 * Call local Ollama model to generate content
 * @param {object} params
 * @param {string} params.systemPrompt - System instructions
 * @param {string} params.userPrompt - User prompt / main query
 * @param {boolean} [params.jsonMode=false] - Whether to request JSON output format
 * @param {string} [params.model] - Specific model name, defaults to env.OLLAMA_MODEL
 * @param {number} [params.temperature=0.1] - Sampling temperature
 * @param {number} [params.maxTokens=2048] - Max generation tokens
 * @param {number} [params.timeout=30000] - Request timeout in milliseconds
 * @returns {Promise<string>} - Model text response
 */
export const callOllama = async ({
  systemPrompt,
  userPrompt,
  jsonMode = false,
  model,
  temperature = 0.1,
  maxTokens = 2048,
  timeout = 30000
}) => {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  const ollamaModel = model || process.env.OLLAMA_MODEL;

  if (!ollamaBaseUrl) {
    throw new Error('Ollama base URL is not configured (OLLAMA_BASE_URL).');
  }
  if (!ollamaModel) {
    throw new Error('Ollama model is not configured (OLLAMA_MODEL).');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  messages.push({
    role: 'user',
    content: userPrompt
  });

  const requestPayload = {
    model: ollamaModel,
    think: false,
    messages,
    options: {
      temperature,
      num_predict: maxTokens
    },
    keep_alive: '30m',
    stream: false
  };

  if (jsonMode) {
    requestPayload.format = 'json';
  }

  const response = await axios.post(`${ollamaBaseUrl}/api/chat`, requestPayload, {
    timeout
  });

  const contentText = response.data?.message?.content || response.data?.response;
  if (!contentText) {
    throw new Error('No content returned from local Ollama model');
  }

  return contentText;
};
