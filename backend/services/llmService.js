import { callOllama } from './ollamaService.js';
import { callGemini } from './geminiService.js';

const providerMap = {
  ollama: {
    call: callOllama,
    hasConfig: () => !!process.env.OLLAMA_BASE_URL,
    modelEnv: () => process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct',
    label: '🦙 Local Ollama'
  },
  gemini: {
    call: callGemini,
    hasConfig: () => !!process.env.GEMINI_API_KEY,
    modelEnv: () => process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    label: '🤖 Google Gemini'
  }
};

/**
 * Resolve provider execution order based on purpose override and global default
 * @param {string} purpose - 'outline' | 'lesson' | 'chat'
 * @returns {string[]} - Ordered list of configured providers to attempt
 */
const resolveProvidersOrder = (purpose) => {
  // Only allow Google Gemini for all executions
  const candidates = ['gemini'];

  return candidates.filter(providerName => {
    const config = providerMap[providerName];
    return config && config.hasConfig();
  });
};

/**
 * Resolve model identifier based on explicit code overrides, purpose overrides, or provider defaults
 * @param {string} providerName - 'gemini' | 'ollama'
 * @param {string} purpose - 'outline' | 'lesson' | 'chat'
 * @param {string} [geminiModel] - Code-level override for Gemini
 * @param {string} [ollamaModel] - Code-level override for Ollama
 * @returns {string} - Model name
 */
const resolveModel = (providerName, purpose, geminiModel, ollamaModel) => {
  // 1. Code-level override parameter gets first priority
  if (providerName === 'gemini' && geminiModel) return geminiModel;
  if (providerName === 'ollama' && ollamaModel) return ollamaModel;

  // 2. Purpose-specific environment overrides get second priority (e.g. LESSON_LLM_MODEL)
  const purposeModelEnvKey = `${purpose.toUpperCase()}_LLM_MODEL`;
  if (process.env[purposeModelEnvKey]) {
    return process.env[purposeModelEnvKey];
  }

  // 3. Fall back to provider default configuration
  return providerMap[providerName].modelEnv();
};

/**
 * General LLM content generation helper with dynamic routing and fallback chain.
 * @param {object} params
 * @param {string} [params.purpose='chat'] - 'outline' | 'lesson' | 'chat'
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {boolean} [params.jsonMode=false]
 * @param {number} [params.temperature=0.1]
 * @param {number} [params.maxTokens=2048]
 * @param {number} [params.timeout=30000]
 * @param {string} [params.geminiModel]
 * @param {string} [params.ollamaModel]
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
  geminiModel,
  ollamaModel,
  reasoningEffort
}) => {
  const providersOrder = resolveProvidersOrder(purpose);

  if (providersOrder.length === 0) {
    throw new Error(`No LLM providers are configured for purpose "${purpose}". Please check your environment configuration.`);
  }

  let lastError = null;

  for (let i = 0; i < providersOrder.length; i++) {
    const providerName = providersOrder[i];
    const providerInfo = providerMap[providerName];
    const resolvedModel = resolveModel(providerName, purpose, geminiModel, ollamaModel);

    const isFallback = i > 0;
    const logPrefix = isFallback ? '🔄 Falling back to' : 'Attempting';
    console.log(`${logPrefix} ${providerInfo.label} using model: "${resolvedModel}" for purpose: "${purpose}"...`);

    try {
      const responseText = await providerInfo.call({
        systemPrompt,
        userPrompt,
        jsonMode,
        model: resolvedModel,
        temperature,
        maxTokens,
        timeout,
        reasoningEffort
      });

      console.log(`✅ ${providerInfo.label} generation succeeded.`);
      return responseText;
    } catch (err) {
      console.warn(`⚠️ ${providerInfo.label} generation failed: ${err.message}`);
      lastError = err;
    }
  }

  console.error(`❌ All configured LLM providers failed for purpose "${purpose}".`);
  throw lastError || new Error(`Failed to generate content for purpose "${purpose}" using any configured provider.`);
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
