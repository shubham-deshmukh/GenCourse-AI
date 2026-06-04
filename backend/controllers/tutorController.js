import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import { generateTutorChatResponse } from '../services/llmService.js';
import mongoose from 'mongoose';

/**
 * Controller to handle AI Tutor chat requests.
 * Extracts active course or lesson context if provided, constructs an
 * adaptive system prompt, and dispatches the prompt to the active LLM.
 */
export const chatWithTutor = async (req, res, next) => {
  try {
    const { message, courseId, lessonId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let systemPrompt = '';

    // Scenario A: User is currently reading a specific lesson
    if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      const lesson = await Lesson.findById(lessonId);
      if (lesson) {
        systemPrompt = `You are an expert AI Tutor. The student is currently studying the lesson: "${lesson.title}".
        
Lesson Objectives:
${Array.isArray(lesson.objectives) ? lesson.objectives.map(o => `- ${o}`).join('\n') : '- No objectives listed'}

Lesson Textbook Content:
${lesson.content?.en || 'No content available for this lesson.'}

Provide a clear, detailed, and helpful response to the student's question in reference to the lesson content.
Use markdown formatting (headers, lists, bold text) for styling. Wrap code snippets in proper \`\`\`language blocks if applicable. Do not refer to the context itself (e.g., "According to the provided text"); speak as if you already know this content.`;
      }
    }

    // Scenario B: User is viewing a course player homepage (syllabus view)
    if (!systemPrompt && courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      const course = await Course.findById(courseId).populate({
        path: 'modules',
        populate: {
          path: 'lessons',
          select: 'title'
        }
      });
      if (course) {
        const syllabusText = (course.modules || []).map((m, mIdx) => {
          const lessonsList = (m.lessons || []).map((l, lIdx) => `    ${mIdx + 1}.${lIdx + 1} ${l.title}`).join('\n');
          return `Module: "${m.title}"\nLessons:\n${lessonsList}`;
        }).join('\n\n');

        systemPrompt = `You are an expert AI Tutor advising a student on the course syllabus of: "${course.title}".
        
Course Description:
${course.description || 'No description available.'}

Course Syllabus Outline:
${syllabusText}

Advise the student on what this course covers, prerequisite ideas, the target audience, study strategies, or answer questions about the course scope. Use markdown formatting.`;
      }
    }

    // Scenario C: User is in general dashboard areas (Library, Settings, Generator)
    if (!systemPrompt) {
      systemPrompt = `You are an expert AI Learning Tutor for the GenCourse AI platform.
      
Your role is to help students with general study strategies, course ideas, brainstorming custom outline topics, explaining general academic/technical concepts, or assisting with settings.
Be encouraging, clear, and structure your responses using markdown formatting. Wrap programming code in proper \`\`\` language blocks.`;
    }

    console.log(`🤖 Dispatching AI Tutor request with prompt length: ${systemPrompt.length} chars...`);
    const answer = await generateTutorChatResponse(systemPrompt, message.trim());
    
    res.json({ response: answer });
  } catch (error) {
    next(error);
  }
};
