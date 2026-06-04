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

/**
 * Generate a course outline syllabus
 * @param {string} topic - The target course topic
 * @returns {Promise<object>} - Parsed syllabus JSON
 */
export const generateCourseOutline = async (topic) => {
  const ai = getAI();

  const prompt = `You are an expert curriculum designer and educator.
Your task is to design a comprehensive introductory course syllabus on the topic: "${topic}".

Generate the output in strict JSON format matching the schema below.
Do not include any markdown block wraps (like \`\`\`json) or extra explanation text. Output ONLY the raw JSON object.

Target JSON Schema:
{
  "title": "Exact course title (e.g. Intro to React Hooks)",
  "description": "A compelling 1-2 sentence description of the course and its goals.",
  "resources": [
    {
      "name": "Short file name for study helper (e.g. React_Hooks_Cheat_Sheet.pdf)",
      "size": "Estimated size (e.g. 2.4 MB)",
      "type": "PDF"
    }
  ],
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
1. Design exactly 2-3 logical modules.
2. Each module must contain exactly 2-3 lessons.
3. Provide 2-3 downloadable resources (combinations of PDFs and ZIPs) related to the topic.
4. Provide exactly 3 multiple-choice quiz questions covering the entire syllabus.
5. All JSON keys and strings must be enclosed in double quotes. Ensure valid JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error('❌ Error generating course outline from Gemini:', error.message);
    throw error;
  }
};

/**
 * Generate detailed content for a single lesson
 * @param {object} course - { title, description }
 * @param {object} module - { title, lessonTitles }
 * @param {string} targetLessonTitle - The specific lesson to write
 * @returns {Promise<object>} - Parsed lesson details JSON
 */
export const generateLessonDetails = async (course, module, targetLessonTitle) => {
  const ai = getAI();

  const prompt = `You are an expert technical writer and online instructor.
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
Do not include any markdown block wraps (like \`\`\`json) or extra text. Output ONLY raw JSON.

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
   - **English ("en")**: Write comprehensive (at least 300-500 words) detailed textbook-style content in English. Use markdown formatting (headers ###, lists, and bold text) for styling. Incorporate a code block (using \`\`\`language) ONLY if the lesson topic is directly code/programming-related.
   - **Spanish ("es")**: Write a detailed translation or adaptation of the English content into Spanish.
   - **French ("fr")**: Write a detailed translation or adaptation of the English content into French.
3. **Optional Code Blocks**: Include code blocks in the "content" fields *only* if it is relevant to the topic (e.g., React Hooks or TypeScript). If the lesson is about a non-programming topic (e.g., Copyright Law or Guitar Tuning), do not include code blocks.
4. **Flow**: Ensure the content flows naturally from the previous lessons in the module list and does not repeat basic introductory material if this is a later lesson (e.g., Lesson 1.2 or 2.1).
5. All translations must maintain exact content parity and structure.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error(`❌ Error generating lesson "${targetLessonTitle}" from Gemini:`, error.message);
    throw error;
  }
};
