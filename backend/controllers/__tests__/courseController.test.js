import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import scheduler from '../../services/scheduler/lesson/LessonScheduler.js';

// Mock DB operations to avoid hitting MongoDB
const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalFindById = User.findById;
const originalCourseSave = Course.prototype.save;
const originalUserSave = User.prototype.save;
const originalAddCourse = scheduler.addCourse;

beforeEach(() => {
  // Clear/reset mocks before each test runs
  User.findOne = async () => ({
    _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0de'),
    name: 'Mock Developer',
    email: 'developer@example.com',
    picture: 'picture_url',
    auth0Sub: 'mock-auth-sub-id',
    role: 'admin',
    enrolledCourses: {
      push: () => {}
    },
    save: async () => {}
  });

  User.create = async () => ({
    _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0de'),
    name: 'Mock Developer',
    email: 'developer@example.com',
    picture: 'picture_url',
    auth0Sub: 'mock-auth-sub-id',
    role: 'admin',
    enrolledCourses: {
      push: () => {}
    },
    save: async () => {}
  });

  User.findById = async () => ({
    _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0de'),
    name: 'Mock Developer',
    email: 'developer@example.com',
    picture: 'picture_url',
    auth0Sub: 'mock-auth-sub-id',
    role: 'admin',
    enrolledCourses: {
      push: () => {}
    },
    save: async () => {}
  });

  Course.prototype.save = async function() {
    this._id = this._id || new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0df');
    return this;
  };

  User.prototype.save = async function() {
    return this;
  };

  scheduler.addCourse = () => {};
  scheduler.queue = [];
});

after(() => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
  User.findById = originalFindById;
  Course.prototype.save = originalCourseSave;
  User.prototype.save = originalUserSave;
  scheduler.addCourse = originalAddCourse;
});

test('POST /api/courses - Successful Response', async () => {
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: 'Introduction to Node.js' });

  assert.strictEqual(res.statusCode, 202);
  assert.ok(res.body.courseId);
  assert.strictEqual(res.body.title, 'Introduction to Node.js');
  assert.strictEqual(res.body.message, 'Course creation initiated');
});

test('POST /api/courses - Empty Body (Missing Title)', async () => {
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({});

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('Course title is required'));
});

test('POST /api/courses - Empty Body (Whitespace Title)', async () => {
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: '   ' });

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('Course title cannot be empty'));
});

test('POST /api/courses - Invalid Topic Type', async () => {
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: 12345 });

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('must be a string'));
});

test('POST /api/courses - Large Topic (> 100 characters)', async () => {
  const longTitle = 'a'.repeat(101);
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: longTitle });

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('cannot exceed 100 characters'));
});

test('POST /api/courses - Special Characters / Safe Filtering', async () => {
  const badTitle = 'Learn JavaScript <script>alert("xss")</script>';
  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: badTitle });

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('contains invalid or unsafe characters'));
});

test('POST /api/courses - Queue Full', async () => {
  // Mock scheduler queue to be full
  scheduler.queue = new Array(20).fill({});

  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: 'React Hooks Deep Dive' });

  assert.strictEqual(res.statusCode, 429);
  assert.ok(res.body.message.includes('queue is full'));
});

test('POST /api/courses - Timeout handling (DB slow write)', async () => {
  // Mock DB save to throw a timeout error
  Course.prototype.save = async function() {
    const err = new Error('Database query timeout');
    err.name = 'MongooseError';
    throw err;
  };

  const res = await supertest(app)
    .post('/api/courses')
    .set('x-mock-user', 'true')
    .send({ title: 'Async Patterns' });

  // When database timeout occurs, server propagates error
  assert.strictEqual(res.statusCode, 500);
  assert.ok(res.body.message.includes('Database query timeout'));
});
