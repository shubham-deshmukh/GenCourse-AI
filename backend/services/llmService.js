import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

let aiInstance;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Helper to mathematically repair truncated JSON structures (e.g. unclosed strings, braces, or brackets)
const repairTruncatedJSON = (jsonString) => {
  if (!jsonString) return '';
  let str = jsonString.trim();
  if (!str.startsWith('{') && !str.startsWith('[')) return str;

  let stack = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  // Handle trailing escape char
  if (escaped) {
    str = str.slice(0, -1);
  }

  // Close open string
  if (inString) {
    str += '"';
  }

  // Close open brackets/braces in reverse order
  while (stack.length > 0) {
    const last = stack.pop();
    str = str.trim();
    // Remove trailing commas or colons
    str = str.replace(/,$/, '').replace(/:$/, ': null');
    if (last === '{') {
      str += '}';
    } else if (last === '[') {
      str += ']';
    }
  }

  return str;
};

// Safe JSON parser that strips markdown wrappers, extracts JSON blocks, and attempts repair on truncated inputs
const parseJSONSafely = (text) => {
  if (!text) return null;
  let cleanText = text.trim();

  // Remove markdown code block wrappers if they exist
  cleanText = cleanText.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();

  // Find first { to extract JSON block
  const startIdx = cleanText.indexOf('{');
  if (startIdx !== -1) {
    const endIdx = cleanText.lastIndexOf('}');
    if (endIdx !== -1 && endIdx > startIdx) {
      try {
        const potentialJSON = cleanText.substring(startIdx, endIdx + 1);
        return JSON.parse(potentialJSON);
      } catch (err) {
        // Substring parse failed (e.g. the last } found wasn't matching the outer structure or it was truncated later)
        try {
          const truncatedPart = cleanText.substring(startIdx);
          const repaired = repairTruncatedJSON(truncatedPart);
          return JSON.parse(repaired);
        } catch (repairErr) {
          console.error('Failed parsing repaired JSON:', repairErr.message);
        }
      }
    } else {
      // Missing final brace (definitely truncated)
      try {
        const truncatedPart = cleanText.substring(startIdx);
        const repaired = repairTruncatedJSON(truncatedPart);
        return JSON.parse(repaired);
      } catch (repairErr) {
        console.error('Failed parsing repaired JSON:', repairErr.message);
      }
    }
  }

  return JSON.parse(cleanText);
};

// Course outline prompt template
const getCourseOutlinePrompt = (topic) => `You are an expert curriculum designer and educator.
Your task is to design a comprehensive introductory course syllabus on the topic: "${topic}".

Generate the output in strict JSON format matching the schema below.
Output ONLY the raw JSON object. Do not wrap it in markdown code blocks.

Target JSON Schema:
{
  "title": "Exact course title (e.g. Intro to React Hooks)",
  "description": "A compelling 1-2 sentence description of the course and its goals.",
  "quizzes": [
    {
      "id": "A unique lowercase quiz ID string (e.g. rh-q1)",
      "question": "A multiple-choice question testing core concepts of the course.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why the correct option is right."
    }
  ],
  "modules": [
    {
      "title": "Module 1: [Module Name]",
      "lessonTitles": [
        "1.1 [First Lesson Name]",
        "1.2 [Second Lesson Name]"
      ]
    }
  ]
}

Constraints:
1. Design exactly 3 logical modules.
2. Each module must contain exactly 2 lessons.
3. Provide exactly 3 multiple-choice quiz questions covering the entire syllabus.
4. All JSON keys and strings must be enclosed in double quotes. Ensure valid JSON format.`;

// Lesson details prompt template
const getLessonDetailsPrompt = (course, module, targetLessonTitle) => `You are an expert technical writer and online instructor.
Your task is to write detailed educational content for a specific lesson within an existing course.

Context of the Course:
- Course Title: "${course.title}"
- Course Description: "${course.description}"

Context of the Current Module:
- Module Title: "${module.title}"
- All Lesson Titles in this Module: ${JSON.stringify(module.lessonTitles)}

Target Lesson to Write:
- Write content for the lesson: "${targetLessonTitle}"

Generate the output in strict JSON format matching the schema below.
Output ONLY raw JSON. Do not wrap it in markdown code blocks.

Target JSON Schema:
{
  "title": "${targetLessonTitle}",
  "objectives": [
    "Objective 1...",
    "Objective 2..."
  ],
  "content": {
    "en": "...",
    "es": "...",
    "fr": "..."
  }
}

Constraints & Formatting Rules:
1. **Objectives**: Replace "Objective 1..." and "Objective 2..." with exactly 2-3 specific learning objectives for this lesson inside the "objectives" array.
2. **Content Generation**: Write detailed textbook-style content for the "en" (English), "es" (Spanish), and "fr" (French) keys in the "content" object:
   - **English ("en")**: Write around 150-200 words of detailed technical explanation. Use markdown formatting (headers ###, lists, and bold text) for styling. Incorporate a code block (using \`\`\`language) ONLY if the lesson topic is directly code/programming-related.
   - **Spanish ("es")**: Write a brief translated summary of the English content (50-80 words).
   - **French ("fr")**: Write a brief translated summary of the English content (50-80 words).
3. **Optional Code Blocks**: Include code blocks in the "content" fields *only* if it is relevant to the topic (e.g., React Hooks or TypeScript). If the lesson is about a non-programming topic (e.g., Copyright Law or Guitar Tuning), do not include code blocks.
4. **Flow**: Ensure the content flows naturally from the previous lessons in the module list and does not repeat basic introductory material if this is a later lesson (e.g., Lesson 1.2 or 2.1).
5. All translations must maintain exact content parity and structure.`;

/**
 * Generate a course outline syllabus
 * Try Ollama first, fall back to Gemini
 */
export const generateCourseOutline = async (topic) => {
  const prompt = getCourseOutlinePrompt(topic);

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct';

  try {
    console.log(`🦙 Attempting local Ollama generation using model: "${ollamaModel}" at "${ollamaBaseUrl}"...`);
    const response = await axios.post(`${ollamaBaseUrl}/api/chat`, {
      model: ollamaModel,
      think: false,
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be concise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      options: {
        temperature: 0.1,
        num_predict: 2048
      },
      keep_alive: '30m',
      stream: false,
      format: 'json'
    }, {
      timeout: 120000 // 120-second timeout for local generation
    });

    const contentText = response.data?.message?.content || response.data?.response;
    if (!contentText) {
      throw new Error('No content returned from local Ollama model');
    }

    console.log('✅ Local Ollama generation succeeded.');
    return parseJSONSafely(contentText);
  } catch (ollamaError) {
    console.warn(`⚠️ Local Ollama generation failed/unavailable: ${ollamaError.message}`);

    // Check if Gemini fallback is configured
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Falling back to secondary provider (Google Gemini)...');
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        console.log('✅ Gemini fallback generation succeeded.');
        return parseJSONSafely(text);
      } catch (geminiError) {
        console.error('❌ Gemini fallback also failed:', geminiError.message);
        throw geminiError;
      }
    } else {
      console.error('❌ Gemini API key is not configured. No fallback available.');
      throw ollamaError;
    }
  }
};

/**
 * Generate detailed content for a single lesson
 * Try Ollama first, fall back to Gemini
 */
export const generateLessonDetails = async (course, module, targetLessonTitle) => {
  const prompt = getLessonDetailsPrompt(course, module, targetLessonTitle);

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct';

  try {
    console.log(`🦙 Attempting local Ollama lesson generation using model: "${ollamaModel}" at "${ollamaBaseUrl}"...`);
    const response = await axios.post(`${ollamaBaseUrl}/api/chat`, {
      model: ollamaModel,
      think: false,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical writer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be highly concise and clear.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      options: {
        temperature: 0.1,
        num_predict: 2048
      },
      keep_alive: '30m',
      stream: false,
      format: 'json'
    }, {
      timeout: 180000 // 180-second timeout for local detailed generation
    });

    const contentText = response.data?.message?.content || response.data?.response;
    if (!contentText) {
      throw new Error('No content returned from local Ollama model');
    }

    console.log(`✅ Local Ollama lesson generation succeeded for: "${targetLessonTitle}".`);
    return parseJSONSafely(contentText);
  } catch (ollamaError) {
    console.warn(`⚠️ Local Ollama lesson generation failed/unavailable: ${ollamaError.message}`);

    // Check if Gemini fallback is configured
    if (process.env.GEMINI_API_KEY) {
      console.log(`🤖 Falling back to secondary provider (Google Gemini) for: "${targetLessonTitle}"...`);
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        console.log(`✅ Gemini fallback generation succeeded for: "${targetLessonTitle}".`);
        return parseJSONSafely(text);
      } catch (geminiError) {
        console.error(`❌ Gemini fallback also failed for: "${targetLessonTitle}":`, geminiError.message);
        throw geminiError;
      }
    } else {
      console.error('❌ Gemini API key is not configured. No fallback available.');
      throw ollamaError;
    }
  }
};
