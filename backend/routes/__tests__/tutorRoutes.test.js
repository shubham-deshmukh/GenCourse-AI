import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';

describe('AI Tutor Chat Tests', () => {
  const originalFetch = globalThis.fetch;
  const originalCourseFindById = Course.findById;
  const originalLessonFindById = Lesson.findById;

  let mockedLlmPrompt = '';
  let mockedLlmMessage = '';

  beforeEach(() => {
    mockedLlmPrompt = '';
    mockedLlmMessage = '';

    // Mock global fetch to intercept Gemini API calls and verify prompts
    globalThis.fetch = async (url, options) => {
      if (url.includes('googleapis.com') || url.includes('generativelanguage')) {
        const body = JSON.parse(options.body);
        // Capture system prompt and user message for assertions
        mockedLlmPrompt = body.systemInstruction?.parts?.[0]?.text || body.systemInstruction || '';
        mockedLlmMessage = body.contents?.[0]?.parts?.[0]?.text || body.contents || '';

        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'Mocked AI Tutor response content' }
                  ]
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
    // Restore global fetch and database model mocks
    globalThis.fetch = originalFetch;
    Course.findById = originalCourseFindById;
    Lesson.findById = originalLessonFindById;
  });

  test('POST /api/tutor/chat - Authentication Rejection', async () => {
    const res = await supertest(app)
      .post('/api/tutor/chat')
      .send({ message: 'Hello AI Tutor' });

    assert.strictEqual(res.statusCode, 401);
    assert.ok(res.body.message.includes('authorization token is missing') || res.body.message.includes('Not authorized'));
  });

  test('POST /api/tutor/chat - Missing Message Validation', async () => {
    const res = await supertest(app)
      .post('/api/tutor/chat')
      .set('x-mock-user', 'true')
      .send({});

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.message.includes('Message content is required'));
  });

  test('POST /api/tutor/chat - Scenario C: General Dashboard Advisor Context', async () => {
    const res = await supertest(app)
      .post('/api/tutor/chat')
      .set('x-mock-user', 'true')
      .send({ message: 'Give me some study tips' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.response, 'Mocked AI Tutor response content');
    
    // Assert system prompt compiled general dashboard context
    assert.ok(mockedLlmPrompt.includes('expert AI Learning Tutor'), 'Expected general tutor system prompt');
    assert.ok(mockedLlmPrompt.includes('brainstorming custom outline topics'));
  });

  test('POST /api/tutor/chat - Scenario A: Active Lesson Context', async () => {
    const mockLessonId = new mongoose.Types.ObjectId();

    // Mock Lesson.findById to return a mock lesson document
    Lesson.findById = async (id) => {
      if (id.toString() === mockLessonId.toString()) {
        return {
          _id: id,
          title: 'Mock Hook Basics',
          objectives: ['Understand useState', 'Build click counters'],
          content: {
            en: ' useState hook manages reactive functional state.'
          }
        };
      }
      return null;
    };

    const res = await supertest(app)
      .post('/api/tutor/chat')
      .set('x-mock-user', 'true')
      .send({
        message: 'How does count work here?',
        lessonId: mockLessonId.toString()
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.response, 'Mocked AI Tutor response content');

    // Assert system prompt compiled lesson objectives and content
    assert.ok(mockedLlmPrompt.includes('Mock Hook Basics'), 'Expected lesson title in system prompt');
    assert.ok(mockedLlmPrompt.includes('Understand useState'), 'Expected objectives in system prompt');
    assert.ok(mockedLlmPrompt.includes('useState hook manages reactive functional state'), 'Expected content in system prompt');
  });

  test('POST /api/tutor/chat - Scenario B: Course Syllabus/Outline Context', async () => {
    const mockCourseId = new mongoose.Types.ObjectId();

    // Mock Course.findById to support chainable populate mapping
    Course.findById = (id) => {
      const mockDoc = {
        _id: id,
        title: 'Mock Advanced React Course',
        description: 'Deep dive into performance optimizations and custom hooks.',
        modules: [
          {
            title: 'Module 1: Performance Tuning',
            lessons: [
              { title: '1.1 memo and useMemo' },
              { title: '1.2 useCallback optimization' }
            ]
          }
        ],
        toObject: function() { return this; }
      };

      const queryChain = {
        populate: () => queryChain,
        then: (resolve) => resolve(mockDoc)
      };

      return queryChain;
    };

    const res = await supertest(app)
      .post('/api/tutor/chat')
      .set('x-mock-user', 'true')
      .send({
        message: 'What will I learn in this course?',
        courseId: mockCourseId.toString()
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.response, 'Mocked AI Tutor response content');

    // Assert system prompt compiled course title and syllabus
    assert.ok(mockedLlmPrompt.includes('Mock Advanced React Course'), 'Expected course title in system prompt');
    assert.ok(mockedLlmPrompt.includes('Performance Tuning'), 'Expected module headers in system prompt');
    assert.ok(mockedLlmPrompt.includes('1.1 memo and useMemo'), 'Expected lesson outlines in system prompt');
  });
});
