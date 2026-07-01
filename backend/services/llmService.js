import { callGemini } from './geminiService.js';
import { getEnv } from '../config/env.js';

/**
 * Resolve model identifier based on purpose overrides or provider default from .env
 * @param {string} purpose - 'outline' | 'lesson' | 'chat'
 * @returns {string} - Model name
 */
const resolveModel = (purpose) => {
  const purposeModelEnvKey = `${purpose.toUpperCase()}_LLM_MODEL`;

  let fallbackModel = 'gemini-1.5-flash';
  try {
    const configString = process.env.LLM_WORKERS_CONFIG || '[]';
    const configs = JSON.parse(configString);
    const geminiConfig = configs.find(c => c.provider === 'gemini');
    if (geminiConfig && geminiConfig.model) {
      fallbackModel = geminiConfig.model;
    }
  } catch {
    // Ignore parsing issues
  }

  return getEnv(purposeModelEnvKey, process.env.GEMINI_MODEL || fallbackModel);
};

/**
 * General LLM content generation helper using Google Gemini.
 * Model configuration is strictly loaded from the environment based on the purpose.
 * 
 * @param {object} params
 * @param {string} [params.purpose='chat'] - 'outline' | 'lesson' | 'chat'
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {boolean} [params.jsonMode=false]
 * @param {number} [params.temperature=0.1]
 * @param {number} [params.maxTokens=2048]
 * @param {number} [params.timeout=30000]
 * @param {string} [params.reasoningEffort]
 * @returns {Promise<string>}
 */
export const generateContent = async ({
  purpose = 'chat',
  systemPrompt,
  userPrompt,
  jsonMode = false,
  temperature = 0.1,
  maxTokens = 2048,
  timeout = 30000,
  reasoningEffort
}) => {
  const model = resolveModel(purpose);

  console.log(`Attempting Google Gemini using model: "${model}" for purpose: "${purpose}"...`);

  try {
    const responseText = await callGemini({
      systemPrompt,
      userPrompt,
      jsonMode,
      model,
      temperature,
      maxTokens,
      timeout,
      reasoningEffort
    });

    console.log(`✅ Google Gemini generation succeeded.`);
    return responseText;
  } catch (err) {
    console.error(`❌ Google Gemini generation failed: ${err.message}`);
    if (err.cause) {
      console.error(`🔍 Underlying cause:`, err.cause);
    }
    throw err;
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
    purpose: 'chat',
    systemPrompt,
    userPrompt: userMessage,
    temperature: 0.7,
    maxTokens: 512,
    timeout: 30000
  });
};
