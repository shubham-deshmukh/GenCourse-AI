import { generateContent } from './llmService.js';

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
    "mr": "...",
    "hi": "..."
  }
}

Constraints & Formatting Rules:
1. **Objectives**: Replace "Objective 1..." and "Objective 2..." with exactly 2-3 specific learning objectives for this lesson inside the "objectives" array.
2. **Content Generation**: Write detailed textbook-style content for the "en" (English), "mr" (Marathi), and "hi" (Hindi) keys in the "content" object:
   - **English ("en")**: Write around 150-200 words of detailed technical explanation. Use markdown formatting (headers ###, lists, and bold text) for styling. Do NOT include any code blocks or code snippets unless the lesson topic is directly code/programming-related.
   - **Marathi ("mr")**: Write a detailed summary of the English content in Marathi (around 150-200 words).
   - **Hindi ("hi")**: Write a detailed summary of the English content in Hindi (around 150-200 words).
3. **No Code Blocks for Non-Programming Topics**: If the course is about a non-programming topic (e.g., Cardiology, Law, History, Music, Medicine, etc.), you must NEVER include code blocks or code snippets (do not use \`\`\` language blocks) and you must NEVER write code-related headings (like "Code Block" or similar). Only include code blocks if the topic is directly about writing software/programming.
4. **Flow**: Ensure the content flows naturally from the previous lessons in the module list and does not repeat basic introductory material if this is a later lesson (e.g., Lesson 1.2 or 2.1).
5. All translations must maintain exact content parity and structure.`;

/**
 * Generate a course outline syllabus
 * @param {string} topic
 * @returns {Promise<object>} - Parsed course outline
 */
export const generateCourseOutline = async (topic) => {
  const prompt = getCourseOutlinePrompt(topic);
  const systemPrompt = 'You are an expert curriculum designer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be concise.';

  const responseText = await generateContent({
    systemPrompt,
    userPrompt: prompt,
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 2048,
    timeout: 120000, // 120-second timeout for local outline generation
    geminiModel: 'gemini-3.1-flash-lite'
  });

  return parseJSONSafely(responseText);
};

/**
 * Generate detailed content for a single lesson
 * @param {object} course
 * @param {object} module
 * @param {string} targetLessonTitle
 * @returns {Promise<object>} - Parsed lesson details
 */
export const generateLessonDetails = async (course, module, targetLessonTitle) => {
  const prompt = getLessonDetailsPrompt(course, module, targetLessonTitle);
  const systemPrompt = 'You are an expert technical writer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be highly concise and clear.';

  const responseText = await generateContent({
    systemPrompt,
    userPrompt: prompt,
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 2048,
    timeout: 180000, // 180-second timeout for local detailed lesson generation
    geminiModel: 'gemini-3.1-flash-lite'
  });

  return parseJSONSafely(responseText);
};
