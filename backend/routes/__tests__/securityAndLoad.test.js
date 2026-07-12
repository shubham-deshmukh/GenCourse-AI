import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';
import LessonProgress from '../../models/LessonProgress.js';
import { streamCourse } from '../../controllers/courseController.js';
import generationEvents from '../../services/scheduler/eventEmitter.js';

describe('Security and Load Tests', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalCourseFindById = Course.findById;
  const originalLessonProgressFind = LessonProgress.find;
  const originalLessonFind = Lesson.find;

  beforeEach(() => {
    // Reset NODE_ENV to development by default to allow mock auth headers
    process.env.NODE_ENV = 'development';
    LessonProgress.find = async () => [];
    Lesson.find = async () => [];
  });

  after(() => {
    // Restore environment and database mocks after test completion
    process.env.NODE_ENV = originalEnv;
    Course.findById = originalCourseFindById;
    LessonProgress.find = originalLessonProgressFind;
    Lesson.find = originalLessonFind;
  });

  test('Cookie Security - Production Mode HTTP Headers', async () => {
    process.env.NODE_ENV = 'production';

    const res = await supertest(app)
      .get('/auth/login')
      .expect(302);

    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.length >= 2, 'Expected state and verifier cookies to be set');

    for (const cookie of cookies) {
      assert.ok(cookie.toLowerCase().includes('httponly'), 'Expected HttpOnly flag to be present');
      assert.ok(cookie.toLowerCase().includes('samesite=lax'), 'Expected SameSite=Lax flag to be present');
      assert.ok(cookie.toLowerCase().includes('secure'), 'Expected Secure flag to be present in production');
    }
  });

  test('Cookie Security - Development Mode HTTP Headers', async () => {
    process.env.NODE_ENV = 'development';

    const res = await supertest(app)
      .get('/auth/login')
      .expect(302);

    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.length >= 2, 'Expected state and verifier cookies to be set');

    for (const cookie of cookies) {
      assert.ok(cookie.toLowerCase().includes('httponly'), 'Expected HttpOnly flag to be present');
      assert.ok(cookie.toLowerCase().includes('samesite=lax'), 'Expected SameSite=Lax flag to be present');
      assert.strictEqual(cookie.toLowerCase().includes('secure'), false, 'Expected Secure flag NOT to be present in development');
    }
  });

  test('SSE Stream Connection Concurrency & Listener Cleanup (Leak Test)', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const mockUserId = new mongoose.Types.ObjectId();

    // Mock Course.findById to return a chainable query helper that supports .populate()
    Course.findById = (id) => {
      const mockDoc = {
        _id: id,
        title: 'Load Test Course',
        status: 'lessons_generating',
        modules: [],
        toObject: function() { return this; }
      };

      const queryChain = {
        populate: () => queryChain,
        then: (resolve) => resolve(mockDoc)
      };

      return queryChain;
    };

    const listenerName = `course:${courseId}`;
    const initialListenerCount = generationEvents.listenerCount(listenerName);

    const mockReqs = [];
    const mockRess = [];

    // 1. Establish 5 concurrent mock stream connections
    for (let i = 0; i < 5; i++) {
      const reqListeners = {};
      const req = {
        params: { id: courseId },
        user: { _id: mockUserId, role: 'student' },
        on: (event, cb) => {
          reqListeners[event] = cb;
        },
        emitClose: () => {
          if (reqListeners['close']) reqListeners['close']();
        }
      };

      const res = {
        headersSent: false,
        setHeader: () => {},
        flushHeaders: () => {},
        write: () => {},
        end: () => {}
      };

      mockReqs.push(req);
      mockRess.push(res);

      // Invoke the controller route handler directly
      await streamCourse(req, res, () => {});
    }

    // Assert that listener count has increased by 5 on the shared event emitter
    const listenerCountDuring = generationEvents.listenerCount(listenerName);
    assert.strictEqual(listenerCountDuring - initialListenerCount, 5, 'Expected 5 active event listeners during active streaming');

    // 2. Trigger connection close/disconnect events on all mock requests
    mockReqs.forEach(req => req.emitClose());

    // Assert that listener count returned to original state (0 leaks)
    const listenerCountAfter = generationEvents.listenerCount(listenerName);
    assert.strictEqual(listenerCountAfter, initialListenerCount, 'Expected listeners to be cleanly unsubscribed after disconnects');
  });
});
