import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';
import LessonProgress from '../../models/LessonProgress.js';
import { streamCourse } from '../../controllers/courseController.js';
import generationEvents from '../../services/scheduler/eventEmitter.js';

describe('Course SSE Streaming Integration Tests', () => {
  const originalCourseFindById = Course.findById;
  const originalLessonFind = Lesson.find;
  const originalLessonProgressFind = LessonProgress.find;

  const mockModuleId = new mongoose.Types.ObjectId();
  const mockLessonId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  after(() => {
    Course.findById = originalCourseFindById;
    Lesson.find = originalLessonFind;
    LessonProgress.find = originalLessonProgressFind;
  });

  test('GET /api/courses/:id/stream - Streams syllabus outline, completed lessons, and real-time progress updates', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();

    // 1. Mock Course.findById to return modules structure
    Course.findById = (id) => {
      const mockCourse = {
        _id: id,
        title: 'Mock Streaming Course',
        status: 'lessons_generating',
        modules: [
          {
            _id: mockModuleId,
            title: 'Module 1: Foundations',
            toObject: function() { return this; }
          }
        ],
        toObject: function() { return this; }
      };

      const queryChain = {
        populate: () => queryChain,
        then: (resolve) => resolve(mockCourse)
      };

      return queryChain;
    };

    // 2. Mock Lesson.find to return an already completed lesson
    Lesson.find = (query) => {
      const mockLessons = [
        {
          _id: mockLessonId,
          moduleId: query.moduleId,
          title: 'Sync Completed Lesson',
          content: new Map([['en', 'Content content']]),
          order: 0,
          toObject: function() { return this; }
        }
      ];

      const queryChain = {
        sort: () => queryChain,
        then: (resolve) => resolve(mockLessons)
      };

      return queryChain;
    };

    // 3. Mock LessonProgress.find to return empty progress
    LessonProgress.find = async () => [];

    const listenerName = `course:${courseId}`;
    const initialListenerCount = generationEvents.listenerCount(listenerName);

    // 4. Create mock req and res interfaces
    const reqListeners = {};
    const req = {
      params: { id: courseId },
      user: { _id: new mongoose.Types.ObjectId(), role: 'student' },
      on: (event, cb) => {
        reqListeners[event] = cb;
      },
      emitClose: () => {
        if (reqListeners['close']) reqListeners['close']();
      }
    };

    const writtenChunks = [];
    const res = {
      headersSent: false,
      setHeader: () => {},
      flushHeaders: () => {},
      write: (chunk) => {
        writtenChunks.push(chunk.toString());
      },
      end: () => {}
    };

    // 5. Invoke streamCourse directly
    await streamCourse(req, res, () => {});

    // Assert that the stream registered a listener on the event emitter
    const listenerCountDuring = generationEvents.listenerCount(listenerName);
    assert.strictEqual(listenerCountDuring - initialListenerCount, 1, 'Expected one active listener on the emitter');

    // 6. Emit a mock progress update event in the background
    generationEvents.emit(listenerName, {
      type: 'progress',
      data: { message: 'Generating lesson 1.2...' }
    });

    // 7. Disconnect mock connection client
    req.emitClose();

    // Verify listener count returned to normal
    const listenerCountAfter = generationEvents.listenerCount(listenerName);
    assert.strictEqual(listenerCountAfter, initialListenerCount, 'Expected listener to be cleanly unsubscribed');

    // 8. Assert on stream data packets
    const fullStreamText = writtenChunks.join('');
    
    // Assert syllabus outline event was streamed
    assert.ok(fullStreamText.includes('event: outline'), 'Expected outline event in stream');
    assert.ok(fullStreamText.includes('Mock Streaming Course'), 'Expected outline data in stream');

    // Assert sync completed lesson event was streamed
    assert.ok(fullStreamText.includes('event: lesson'), 'Expected completed lesson event in stream');
    assert.ok(fullStreamText.includes('Sync Completed Lesson'), 'Expected completed lesson title in stream');

    // Assert real-time progress update event was streamed
    assert.ok(fullStreamText.includes('event: progress'), 'Expected progress update in stream');
    assert.ok(fullStreamText.includes('Generating lesson 1.2...'), 'Expected progress message in stream');
  });
});
