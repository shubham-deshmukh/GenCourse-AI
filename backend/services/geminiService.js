import { GoogleGenAI } from '@google/genai';
import { getEnvJSON } from '../config/env.js';

let aiInstance;
const getAI = () => {
  if (!aiInstance) {
    let apiKey = '';
    try {
      const configs = getEnvJSON('LLM_WORKERS_CONFIG');
      const geminiConfig = configs.find(c => c.provider === 'gemini');
      if (geminiConfig) {
        apiKey = geminiConfig.apiKey;
      }
    } catch (err) {
      console.error('[geminiService] Failed to parse LLM_WORKERS_CONFIG:', err.message);
    }

    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || '';
    }

    aiInstance = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        timeout: 300000 // 5 minutes in milliseconds
      }
    });
  }
  return aiInstance;
};


/**
 * Call Gemini model to generate content
 * @param {object} params
 * @param {string} params.systemPrompt - System instructions
 * @param {string} params.userPrompt - User prompt / main query
 * @param {boolean} [params.jsonMode=false] - Whether to request JSON output format
 * @param {string} [params.model='gemini-1.5-flash'] - Specific Gemini model
 * @param {number} [params.temperature] - Sampling temperature
 * @returns {Promise<string>} - Model text response
 */
export const callGemini = async ({
  systemPrompt,
  userPrompt,
  jsonMode = false,
  model = 'gemini-1.5-flash',
  temperature
}) => {
  const ai = getAI();
  
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

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config
  });

  return response.text;
};
