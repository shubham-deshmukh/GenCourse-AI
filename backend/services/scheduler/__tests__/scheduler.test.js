import test from 'node:test';
import assert from 'node:assert';
import scheduler from '../LessonScheduler.js';
import Course from '../../../models/Course.js';
import Module from '../../../models/Module.js';
import Lesson from '../../../models/Lesson.js';
import Job from '../Job.js';

// Prevent actual scheduler interval from ticking during test imports
clearInterval(scheduler.intervalId);

// 1. Mock DB methods to avoid connection errors and keep tests fast
Course.findByIdAndUpdate = async (id, update) => {
  return {
    _id: id,
    status: 'lessons_generating',
    progress: { completedLessons: 1, totalLessons: 3, currentStatusMessage: 'Mocking...' },
    modules: ['mod-1'],
    save: async () => {}
  };
};

Course.findById = async (id) => {
  return {
    _id: id,
    title: 'Mock Course',
    description: 'A mock course description',
    status: 'outline_generating',
    progress: { completedLessons: 0, totalLessons: 0 },
    modules: [],
    toObject: function() { return this; },
    save: async () => {}
  };
};

// Mock model saves
Module.prototype.save = async function() {
  this._id = this._id || 'mock-module-id';
  return this;
};

Lesson.prototype.save = async function() {
  this._id = this._id || 'mock-lesson-id';
  return this;
};

// 2. Define Mock Worker class
class MockWorker {
  constructor({ name, provider, maxConcurrency = 1, delay = 10, executionLog }) {
    this.name = name;
    this.provider = provider;
    this.maxConcurrency = maxConcurrency;
    this.activeJobsCount = 0;
    this.coolDownUntil = null;
    this.delay = delay;
    this.executionLog = executionLog;
  }

  isAvailable() {
    if (this.coolDownUntil && new Date() < this.coolDownUntil) return false;
    return this.activeJobsCount < this.maxConcurrency;
  }

  coolDown(durationMs) {
    this.coolDownUntil = new Date(Date.now() + durationMs);
  }

  async execute(job) {
    this.activeJobsCount++;
    job.start();
    this.executionLog.push(job.id);

    return new Promise((resolve) => {
      setTimeout(() => {
        job.complete(`{"mockResult": "success for ${job.id}"}`);
        this.activeJobsCount--;
        resolve(`{"mockResult": "success for ${job.id}"}`);
      }, this.delay);
    });
  }
}

// 3. Test Cases
test('LessonScheduler - Priority Sorting (Outlines first)', async () => {
  const executionLog = [];
  // Use a longer delay of 50ms so the outline job doesn't finish and trigger next ticks before we assert
  const worker = new MockWorker({ name: 'TestWorker', provider: 'gemini', maxConcurrency: 1, executionLog, delay: 50 });
  
  // Reset scheduler state
  scheduler.queue = [];
  scheduler.workers = [worker];

  // Enqueue normal priority jobs (Priority 2) first
  scheduler.queue.push(new Job({ id: 'lesson-A', courseId: 'c1', type: 'lesson', priority: 2 }));
  scheduler.queue.push(new Job({ id: 'lesson-B', courseId: 'c1', type: 'lesson', priority: 2 }));

  // Enqueue a high priority job (Priority 1) last
  scheduler.queue.push(new Job({ id: 'outline-C', courseId: 'c2', type: 'outline', priority: 1 }));

  // Run a single tick - it should pick the high priority job first
  scheduler.tick();

  // Wait a tiny moment (5ms) for the asynchronous DB calls in dispatch to complete and invoke worker.execute
  await new Promise(r => setTimeout(r, 5));

  // Assert outline-C was run first
  assert.strictEqual(executionLog[0], 'outline-C');
  assert.strictEqual(executionLog.length, 1); // Only 1 job runs since worker concurrency is 1

  // Wait for the job to complete fully to avoid leaking state into next tests
  await new Promise(r => setTimeout(r, 60));
  scheduler.queue = [];
});

test('LessonScheduler - Round-Robin Fair-Share by Course', async () => {
  const executionLog = [];
  const worker = new MockWorker({ name: 'ParallelWorker', provider: 'gemini', maxConcurrency: 5, executionLog, delay: 10 });
  
  scheduler.queue = [];
  scheduler.workers = [worker];

  // Course A has 3 lessons
  scheduler.queue.push(new Job({ id: 'A1', courseId: 'course-A', type: 'lesson', priority: 2 }));
  scheduler.queue.push(new Job({ id: 'A2', courseId: 'course-A', type: 'lesson', priority: 2 }));
  scheduler.queue.push(new Job({ id: 'A3', courseId: 'course-A', type: 'lesson', priority: 2 }));

  // Course B has 2 lessons
  scheduler.queue.push(new Job({ id: 'B1', courseId: 'course-B', type: 'lesson', priority: 2 }));
  scheduler.queue.push(new Job({ id: 'B2', courseId: 'course-B', type: 'lesson', priority: 2 }));

  // Run tick to allocate available slots
  scheduler.tick();

  // Wait for dispatch tasks to reach worker.execute
  await new Promise(r => setTimeout(r, 5));

  // The order should alternate between Course A and Course B (A1 -> B1 -> A2 -> B2 -> A3)
  assert.deepStrictEqual(executionLog, ['A1', 'B1', 'A2', 'B2', 'A3']);

  // Wait for completion to clean queue
  await new Promise(r => setTimeout(r, 15));
  scheduler.queue = [];
});

test('LessonScheduler - Global Concurrency Limits', async () => {
  const executionLog = [];
  // Concurrency limit = 2
  const worker = new MockWorker({ name: 'ThrottledWorker', provider: 'gemini', maxConcurrency: 2, executionLog, delay: 50 });
  
  scheduler.queue = [];
  scheduler.workers = [worker];

  // Queue up 5 jobs
  for (let i = 1; i <= 5; i++) {
    scheduler.queue.push(new Job({ id: `job-${i}`, courseId: 'c1', type: 'lesson', priority: 2 }));
  }

  // Trigger tick - only 2 jobs should start
  scheduler.tick();

  // Wait for dispatch tasks to reach worker.execute
  await new Promise(r => setTimeout(r, 5));

  assert.strictEqual(worker.activeJobsCount, 2);
  assert.strictEqual(executionLog.length, 2);

  // Trigger tick again - active count remains 2 since worker is still busy
  scheduler.tick();
  assert.strictEqual(worker.activeJobsCount, 2);
  assert.strictEqual(executionLog.length, 2);

  // Wait for jobs to finish
  await new Promise(r => setTimeout(r, 60));

  // Trigger scheduler again - it should pick up next 2 jobs
  scheduler.tick();

  // Wait for dispatch tasks to reach worker.execute
  await new Promise(r => setTimeout(r, 5));

  assert.strictEqual(worker.activeJobsCount, 2);
  assert.strictEqual(executionLog.length, 4);

  // Clean queue
  scheduler.queue = [];
});
