import express from 'express';
import { getCourses, createCourse, deleteCourse, streamCourse } from '../controllers/courseController.js';

const router = express.Router();

router.route('/')
  .get(getCourses)
  .post(createCourse);

router.route('/:id')
  .delete(deleteCourse);

router.route('/:id/stream')
  .get(streamCourse);

export default router;
