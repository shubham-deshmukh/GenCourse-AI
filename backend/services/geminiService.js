import { GoogleGenAI } from '@google/genai';
import { getEnv } from '../config/env.js';

let aiInstance;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = getEnv('GEMINI_API_KEY');
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
