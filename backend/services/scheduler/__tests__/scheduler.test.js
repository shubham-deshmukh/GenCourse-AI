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

// We create a global memory store for Mock Lessons to support the Catch-Up Sync Mapper test
let mockLessonStore = [];

Lesson.find = async (query) => {
  if (query && query.moduleId) {
    const moduleIdStr = query.moduleId.$in 
      ? query.moduleId.$in.map(id => id.toString()) 
      : [query.moduleId.toString()];
    
    const results = mockLessonStore.filter(l => moduleIdStr.includes(l.moduleId.toString()));
    return {
      sort: () => results.sort((a, b) => a.order - b.order)
    };
  }
  return { sort: () => [] };
};

Course.findById = async (id) => {
  return {
    _id: id,
    title: 'Mock Course',
    description: 'A mock course description',
    status: 'outline_generating',
    progress: { completedLessons: 0, totalLessons: 0 },
    modules: [{ _id: 'mod-1', title: 'Mock Module 1' }],
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
  constructor({ name, provider, maxConcurrency = 1, delay = 10, executionLog, shouldFail = false }) {
    this.name = name;
    this.provider = provider;
    this.maxConcurrency = maxConcurrency;
    this.activeJobsCount = 0;
    this.coolDownUntil = null;
    this.delay = delay;
    this.executionLog = executionLog;
    this.shouldFail = shouldFail;
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
    this.executionLog.push(`${this.name}:${job.id}`);

    if (this.shouldFail) {
      this.activeJobsCount--;
      job.fail(new Error('Rate limit exceeded'));
      this.coolDown(10000); // 10 seconds cooldown
      throw new Error('Rate limit exceeded');
    }

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
  assert.strictEqual(executionLog[0], 'TestWorker:outline-C');
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
  assert.deepStrictEqual(executionLog, [
    'ParallelWorker:A1', 
    'ParallelWorker:B1', 
    'ParallelWorker:A2', 
    'ParallelWorker:B2', 
    'ParallelWorker:A3'
  ]);

  // Wait for completion to clean queue
  await new Promise(r => setTimeout(r, 15));
  scheduler.queue = [];
});

test('LessonScheduler - Global Concurrency Limits', async () => {
  const executionLog = [];
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

test('LessonScheduler - Worker Cooldown and Provider Failover', async () => {
  const executionLog = [];
  
  // Primary worker shouldFail = true, triggering cooldown
  const primaryWorker = new MockWorker({ name: 'GeminiWorker', provider: 'gemini', maxConcurrency: 1, executionLog, shouldFail: true });
  // Fallback worker shouldFail = false, will succeed
  const fallbackWorker = new MockWorker({ name: 'OllamaWorker', provider: 'ollama', maxConcurrency: 1, executionLog, shouldFail: false });
  
  scheduler.queue = [];
  scheduler.workers = [primaryWorker, fallbackWorker];

  // Enqueue a job and keep a direct reference in our test scope to assert status
  const job = new Job({ id: 'failover-job', courseId: 'c1', type: 'lesson', priority: 2 });
  scheduler.queue.push(job);

  // Run tick
  scheduler.tick();

  // Wait for both sequential dispatch pipelines to fully execute (approx 15ms)
  await new Promise(r => setTimeout(r, 15));

  // Assert that GeminiWorker was targeted first and entered cooldown
  assert.strictEqual(executionLog[0], 'GeminiWorker:failover-job');
  assert.notStrictEqual(primaryWorker.coolDownUntil, null);

  // Assert that OllamaWorker was targeted second and completed the job
  assert.strictEqual(executionLog[1], 'OllamaWorker:failover-job');
  
  // Assert the final status of our job reference shows successful completion with exactly 1 retry
  assert.strictEqual(job.status, 'completed');
  assert.strictEqual(job.retries, 1);
  
  // Clean queue
  scheduler.queue = [];
});

test('LessonScheduler - Max Retries Exhaustion and Queue Pruning', async () => {
  const executionLog = [];
  const failingWorker = new MockWorker({ name: 'FailedWorker', provider: 'gemini', maxConcurrency: 1, executionLog, shouldFail: true });
  
  scheduler.queue = [];
  scheduler.workers = [failingWorker];

  // Enqueue 2 jobs for the same course to test pruning of remaining course tasks upon fatal failure
  scheduler.queue.push(new Job({ id: 'fatal-job', courseId: 'c-failed', type: 'lesson', priority: 2, maxRetries: 3 }));
  scheduler.queue.push(new Job({ id: 'pruned-job', courseId: 'c-failed', type: 'lesson', priority: 2 }));

  // Trigger tick 1 -> Fail (Retry 1)
  scheduler.tick();
  await new Promise(r => setTimeout(r, 5));
  primaryWorkerCooldownPruningHelper(failingWorker);

  // Trigger tick 2 -> Fail (Retry 2)
  scheduler.tick();
  await new Promise(r => setTimeout(r, 5));
  primaryWorkerCooldownPruningHelper(failingWorker);

  // Trigger tick 3 -> Fail (Retry 3 -> Fatal failure)
  scheduler.tick();
  await new Promise(r => setTimeout(r, 5));

  // Assert that all jobs for this course were pruned from the queue
  assert.strictEqual(scheduler.queue.length, 0);

  // Assert the job failed 3 times
  assert.deepStrictEqual(executionLog, [
    'FailedWorker:fatal-job',
    'FailedWorker:fatal-job',
    'FailedWorker:fatal-job'
  ]);
});

test('SSE Catch-Up Sync Mapper (Reconnection mapping logic)', async () => {
  // Populate mock database lessons
  mockLessonStore = [
    { moduleId: 'mod-1', title: 'Lesson 1', order: 0, toObject: function() { return this; } }
  ];

  scheduler.queue = [];
  
  // Enqueue a pending job in scheduler queue to act as a placeholder
  scheduler.queue.push(new Job({
    id: 'lesson-c1-mod-1-1',
    courseId: 'c1',
    type: 'lesson',
    priority: 2,
    payload: { moduleId: 'mod-1', targetLessonTitle: 'Lesson 2', lIdx: 1 }
  }));

  // Replicate course catch-up mapping logic
  const modules = [{ _id: 'mod-1', title: 'Mock Module 1' }];
  const populatedModules = [];

  for (const mod of modules) {
    const completedLessons = await Lesson.find({ moduleId: mod._id });
    const pendingJobs = scheduler.queue.filter(
      j => j.courseId === 'c1' &&
           j.type === 'lesson' &&
           j.payload.moduleId.toString() === mod._id.toString()
    );

    const lessonsList = [];
    for (const l of completedLessons.sort()) { // completing lessons
      lessonsList.push({ ...l, isPlaceholder: false });
    }
    for (const job of pendingJobs) {
      lessonsList.push({
        title: job.payload.targetLessonTitle,
        order: job.payload.lIdx,
        isPlaceholder: true
      });
    }

    lessonsList.sort((a, b) => a.order - b.order);
    populatedModules.push({
      _id: mod._id,
      title: mod.title,
      lessons: lessonsList
    });
  }

  // Assertions
  const moduleResult = populatedModules[0];
  assert.strictEqual(moduleResult.lessons.length, 2);
  
  // Assert completed lesson is not a placeholder
  assert.strictEqual(moduleResult.lessons[0].title, 'Lesson 1');
  assert.strictEqual(moduleResult.lessons[0].isPlaceholder, false);
  
  // Assert pending job is represented as a placeholder in correct sequential order
  assert.strictEqual(moduleResult.lessons[1].title, 'Lesson 2');
  assert.strictEqual(moduleResult.lessons[1].isPlaceholder, true);

  // Clean queue and mock DB
  scheduler.queue = [];
  mockLessonStore = [];
});

test('LessonScheduler - DB Persistence Failure & Concurrency Safety (No Leak)', async () => {
  const executionLog = [];
  const worker = new MockWorker({ name: 'SafeWorker', provider: 'gemini', maxConcurrency: 1, executionLog, delay: 10 });
  
  scheduler.queue = [];
  scheduler.workers = [worker];

  // Enqueue a lesson job (maxRetries = 3)
  const job = new Job({ id: 'leak-test-job', courseId: 'c1', type: 'lesson', priority: 2, maxRetries: 3 });
  scheduler.queue.push(job);

  // Mock Lesson.save to throw a database connection error
  const originalLessonSave = Lesson.prototype.save;
  Lesson.prototype.save = async function() {
    throw new Error('Database Write Failure (ECONNRESET)');
  };

  // Trigger tick - starts job execution
  scheduler.tick();

  // Wait for all retries and fatal pruning to complete (approx 50ms)
  await new Promise(r => setTimeout(r, 50));

  // Assert that SafeWorker attempted to run the job 3 times
  assert.deepStrictEqual(executionLog, [
    'SafeWorker:leak-test-job',
    'SafeWorker:leak-test-job',
    'SafeWorker:leak-test-job'
  ]);

  // Assert that the worker slot was successfully freed on each failure and is now idle (no leaks!)
  assert.strictEqual(worker.activeJobsCount, 0);

  // Assert that the job failed permanently after 3 retries
  assert.strictEqual(job.status, 'failed');
  assert.strictEqual(job.retries, 3);
  assert.strictEqual(job.error, 'Database Write Failure (ECONNRESET)');

  // Restore original mock save method
  Lesson.prototype.save = originalLessonSave;
  scheduler.queue = [];
});

test('LessonScheduler - Worker Cool-Down Expiry and Recovery', async () => {
  const executionLog = [];
  
  const primaryWorker = new MockWorker({ name: 'GeminiWorker', provider: 'gemini', maxConcurrency: 1, executionLog, delay: 10 });
  const fallbackWorker = new MockWorker({ name: 'OllamaWorker', provider: 'ollama', maxConcurrency: 1, executionLog, delay: 10 });
  
  scheduler.queue = [];
  scheduler.workers = [primaryWorker, fallbackWorker];

  // Custom execution override for primaryWorker to fail on first attempt and set 15ms cooldown
  let primaryAttempts = 0;
  primaryWorker.execute = async (job) => {
    primaryAttempts++;
    primaryWorker.activeJobsCount++;
    job.start();
    executionLog.push(`GeminiWorker:${job.id}`);
    
    if (primaryAttempts === 1) {
      primaryWorker.activeJobsCount--;
      job.fail(new Error('Temporary Rate Limit'));
      primaryWorker.coolDown(15); // 15ms cooldown
      throw new Error('Temporary Rate Limit');
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        job.complete(`{"mockResult": "success"}`);
        primaryWorker.activeJobsCount--;
        resolve(`{"mockResult": "success"}`);
      }, 10);
    });
  };

  // Enqueue job-1
  scheduler.queue.push(new Job({ id: 'job-1', courseId: 'c1', type: 'lesson', priority: 2 }));

  // Run tick -> primary worker fails, triggers 15ms cooldown, job falls back to OllamaWorker (10ms delay)
  scheduler.tick();

  // Wait 25ms so job-1 completes on Ollama and Gemini cooldown (15ms) expires
  await new Promise(r => setTimeout(r, 25));

  // Assert job-1 executed on both workers (failover check)
  assert.strictEqual(executionLog[0], 'GeminiWorker:job-1');
  assert.strictEqual(executionLog[1], 'OllamaWorker:job-1');

  // Cooldown is expired now. Enqueue job-2
  scheduler.queue.push(new Job({ id: 'job-2', courseId: 'c1', type: 'lesson', priority: 2 }));

  // Run tick again -> GeminiWorker is recovered, so it must pick up job-2 as the primary provider
  scheduler.tick();

  // Wait 15ms for job-2 to complete
  await new Promise(r => setTimeout(r, 15));

  // Assert that GeminiWorker executed job-2 (automatic recovery back to primary provider!)
  assert.strictEqual(executionLog[2], 'GeminiWorker:job-2');

  // Clean queue
  scheduler.queue = [];
});

// Helper function to reset worker cooldown inside max-retries test so we don't have to wait 10 seconds per tick
function primaryWorkerCooldownPruningHelper(worker) {
  worker.coolDownUntil = null;
}
