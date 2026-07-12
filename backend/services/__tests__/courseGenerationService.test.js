import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import {
  getCourseOutlinePrompt,
  getLessonDetailsPrompt,
  generateCourseOutline,
  generateLessonDetails
} from '../courseGenerationService.js';

describe('Course Generation Service Tests', () => {
  const originalFetch = globalThis.fetch;
  let capturedFetchBody = null;
  let mockFetchResponseText = '';

  beforeEach(() => {
    capturedFetchBody = null;
    mockFetchResponseText = '';

    globalThis.fetch = async (url, options) => {
      if (url.includes('googleapis.com')) {
        capturedFetchBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: mockFetchResponseText }]
                }
              }
            ]
          })
        };
      }
      return originalFetch(url, options);
    };
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Prompt Construction Utilities', () => {
    test('getCourseOutlinePrompt correctly constructs outline template with target topic', () => {
      const topic = 'Introduction to Kubernetes';
      const prompt = getCourseOutlinePrompt(topic);

      assert.ok(prompt.includes(topic), 'Prompt should include the custom topic');
      assert.ok(prompt.includes('Design exactly 3 logical modules'), 'Prompt should include modules constraint');
      assert.ok(prompt.includes('strict JSON format'), 'Prompt should specify strict JSON requirements');
    });

    test('getLessonDetailsPrompt correctly compiles outline context and sibling lessons', () => {
      const course = {
        title: 'React Fundamentals',
        description: 'Learn components and hooks.'
      };
      const module = {
        title: 'Module 1: Getting Started',
        lessonTitles: ['1.1 JSX Basics', '1.2 Components']
      };
      const targetLessonTitle = '1.2 Components';

      const prompt = getLessonDetailsPrompt(course, module, targetLessonTitle);

      assert.ok(prompt.includes('React Fundamentals'));
      assert.ok(prompt.includes('Learn components and hooks.'));
      assert.ok(prompt.includes('Module 1: Getting Started'));
      assert.ok(prompt.includes('1.1 JSX Basics'));
      assert.ok(prompt.includes('1.2 Components'));
    });
  });

  describe('Outline and Lesson Content Generation & Parsing', () => {
    test('generateCourseOutline successfully generates and parses clean outline content', async () => {
      const mockOutline = {
        title: 'Clean Kubernetes Course',
        description: 'Study container orchestration.',
        quizzes: [
          {
            id: 'k8s-q1',
            question: 'What is a Pod?',
            options: ['Option A', 'Option B'],
            correctIndex: 0,
            explanation: 'Detailed text'
          }
        ],
        modules: [
          {
            title: 'Module 1: Intro',
            lessonTitles: ['1.1 Intro']
          }
        ]
      };

      mockFetchResponseText = JSON.stringify(mockOutline);

      const result = await generateCourseOutline('Kubernetes');

      assert.strictEqual(result.title, 'Clean Kubernetes Course');
      assert.strictEqual(result.modules[0].title, 'Module 1: Intro');
      assert.strictEqual(capturedFetchBody.contents[0].parts[0].text.includes('Kubernetes'), true);
    });

    test('generateCourseOutline successfully sanitizes and repairs code-fenced markdown JSON responses', async () => {
      const mockOutline = {
        title: 'Fenced Outline',
        description: 'Syllabus testing',
        quizzes: [],
        modules: []
      };

      // Wrap the response in markdown code blocks to simulate typical LLM formatting artifacts
      mockFetchResponseText = `\`\`\`json\n${JSON.stringify(mockOutline)}\n\`\`\``;

      const result = await generateCourseOutline('Kubernetes');

      assert.strictEqual(result.title, 'Fenced Outline');
      assert.ok(result.description);
    });

    test('generateLessonDetails successfully parses detailed lesson textbook responses', async () => {
      const mockLessonDetails = {
        title: '1.2 Components',
        objectives: ['Learn components', 'Learn props'],
        content: {
          en: 'Components are reusable UI units.',
          hi: 'घटक पुन: प्रयोज्य यूआई इकाइयां हैं।'
        },
        videoSearchQuery: 'react components props tutorial'
      };

      mockFetchResponseText = JSON.stringify(mockLessonDetails);

      const course = { title: 'React' };
      const module = { title: 'Module 1', lessonTitles: ['1.1', '1.2'] };
      const result = await generateLessonDetails(course, module, '1.2 Components');

      assert.strictEqual(result.title, '1.2 Components');
      assert.strictEqual(result.content.en, 'Components are reusable UI units.');
      assert.strictEqual(result.videoSearchQuery, 'react components props tutorial');
    });
  });
});
