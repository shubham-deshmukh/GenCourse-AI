import { callOllama } from './ollamaService.js';
import { callGemini } from './geminiService.js';

/**
 * General LLM content generation helper with fallback from Ollama to Gemini.
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {boolean} [params.jsonMode=false]
 * @param {number} [params.temperature=0.1]
 * @param {number} [params.maxTokens=2048]
 * @param {number} [params.timeout=30000]
 * @param {string} [params.geminiModel='gemini-1.5-flash']
 * @param {string} [params.ollamaModel]
 * @returns {Promise<string>}
 */
export const generateContent = async ({
  systemPrompt,
  userPrompt,
  jsonMode = false,
  temperature = 0.1,
  maxTokens = 2048,
  timeout = 30000,
  geminiModel = 'gemini-1.5-flash',
  ollamaModel = process.env.OLLAMA_MODEL
}) => {
  const hasOllama = !!process.env.OLLAMA_BASE_URL;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (!hasOllama && !hasGemini) {
    throw new Error('Neither Ollama nor Gemini is configured. Please configure at least one provider.');
  }

  // 1. Try Ollama first if configured
  if (hasOllama) {
    try {
      console.log(`🦙 Attempting local Ollama generation using model: "${ollamaModel}" at "${process.env.OLLAMA_BASE_URL}"...`);
      const responseText = await callOllama({
        systemPrompt,
        userPrompt,
        jsonMode,
        model: ollamaModel,
        temperature,
        maxTokens,
        timeout
      });
      console.log('✅ Local Ollama generation succeeded.');
      return responseText;
    } catch (ollamaError) {
      console.warn(`⚠️ Local Ollama generation failed/unavailable: ${ollamaError.message}`);
      if (!hasGemini) {
        throw ollamaError;
      }
    }
  }

  // 2. Fall back to Gemini if configured
  if (hasGemini) {
    console.log(`🤖 Falling back to secondary provider (Google Gemini) using model: "${geminiModel}"...`);
    try {
      const responseText = await callGemini({
        systemPrompt,
        userPrompt,
        jsonMode,
        model: geminiModel,
        temperature
      });
      console.log('✅ Gemini fallback generation succeeded.');
      return responseText;
    } catch (geminiError) {
      console.error('❌ Gemini fallback also failed:', geminiError.message);
      throw geminiError;
    }
  }
};

/**
 * Generate AI Tutor response based on active context and student query.
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export const generateTutorChatResponse = async (systemPrompt, userMessage) => {
  return generateContent({
    systemPrompt,
    userPrompt: userMessage,
    temperature: 0.7,
    maxTokens: 512,
    timeout: 30000,
    geminiModel: 'gemini-1.5-flash',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct'
  });
};
