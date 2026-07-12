import test, { describe } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import User from '../User.js';
import Course from '../Course.js';
import Lesson from '../Lesson.js';

describe('Mongoose Model Schema Validation Tests', () => {
  describe('User Model Schema', () => {
    test('Validates a clean user document successfully', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        auth0Sub: 'auth0|12345',
        role: 'student'
      });

      const err = user.validateSync();
      assert.strictEqual(err, undefined, 'Clean user document should not trigger validation errors');
    });

    test('Fails validation when required fields are missing', () => {
      const user = new User({});
      const err = user.validateSync();

      assert.ok(err, 'Validation should fail for empty user document');
      assert.strictEqual(err.errors['email'].message, 'Email is required');
      assert.strictEqual(err.errors['auth0Sub'].message, 'Auth0 Sub ID is required');
    });

    test('Fails validation if role is not in the allowed enum', () => {
      const user = new User({
        email: 'john@example.com',
        auth0Sub: 'auth0|12345',
        role: 'invalid-role'
      });
      const err = user.validateSync();

      assert.ok(err, 'Validation should fail for invalid role enum');
      assert.ok(err.errors['role'], 'Expected error on role property');
      assert.ok(err.errors['role'].message.includes('is not a valid enum value'));
    });

    test('Applies default role to student', () => {
      const user = new User({
        email: 'john@example.com',
        auth0Sub: 'auth0|12345'
      });

      assert.strictEqual(user.role, 'student', 'Role should default to student');
    });

    test('Normalizes email to lowercase and trims whitespace', () => {
      const user = new User({
        email: '  JOHN@EXAMPLE.COM  ',
        auth0Sub: 'auth0|12345'
      });

      // Mongoose applies setters on instantiation/assignment
      assert.strictEqual(user.email, 'john@example.com', 'Email should be lowercase and trimmed');
    });
  });

  describe('Course Model Schema', () => {
    test('Validates a clean course document successfully', () => {
      const course = new Course({
        title: 'Learn Mongoose Validation',
        description: 'Deep dive into validation logic',
        status: 'outline_generating',
        pdfStatus: 'idle'
      });

      const err = course.validateSync();
      assert.strictEqual(err, undefined, 'Clean course document should not trigger validation errors');
    });

    test('Fails validation when course title is missing', () => {
      const course = new Course({});
      const err = course.validateSync();

      assert.ok(err, 'Validation should fail for empty course document');
      assert.strictEqual(err.errors['title'].message, 'Course title is required');
    });

    test('Fails validation if status or pdfStatus is not in enum', () => {
      const course = new Course({
        title: 'Validation Failures',
        status: 'invalid-status',
        pdfStatus: 'invalid-pdf-status'
      });
      const err = course.validateSync();

      assert.ok(err, 'Validation should fail for invalid enums');
      assert.ok(err.errors['status']);
      assert.ok(err.errors['pdfStatus']);
    });

    test('Applies default course progress and pdfStatus parameters', () => {
      const course = new Course({
        title: 'Default Checking Course'
      });

      assert.strictEqual(course.status, 'outline_generating', 'Default status should be outline_generating');
      assert.strictEqual(course.pdfStatus, 'idle', 'Default pdfStatus should be idle');
      assert.strictEqual(course.progress.totalLessons, 0, 'Default totalLessons should be 0');
      assert.strictEqual(course.progress.completedLessons, 0, 'Default completedLessons should be 0');
      assert.strictEqual(course.pdfUrl, '', 'Default pdfUrl should be empty string');
    });
  });

  describe('Lesson Model Schema', () => {
    test('Validates a clean lesson document successfully', () => {
      const lesson = new Lesson({
        moduleId: new mongoose.Types.ObjectId(),
        title: 'Lesson 1',
        content: new Map([['en', 'Textbook Content']])
      });

      const err = lesson.validateSync();
      assert.strictEqual(err, undefined, 'Clean lesson document should not trigger validation errors');
    });

    test('Fails validation when required fields are missing', () => {
      const lesson = new Lesson({});
      const err = lesson.validateSync();

      assert.ok(err, 'Validation should fail for empty lesson document');
      assert.strictEqual(err.errors['moduleId'].message, 'Module ID is required');
      assert.strictEqual(err.errors['title'].message, 'Lesson title is required');
      assert.strictEqual(err.errors['content'].message, 'Lesson content map is required');
    });

    test('Applies default lesson order and video ID parameter', () => {
      const lesson = new Lesson({
        moduleId: new mongoose.Types.ObjectId(),
        title: 'Lesson Defaults Check',
        content: new Map([['en', 'Content']])
      });

      assert.strictEqual(lesson.order, 0, 'Default order should be 0');
      assert.strictEqual(lesson.youtubeVideoId, '', 'Default youtubeVideoId should be empty string');
    });
  });
});
