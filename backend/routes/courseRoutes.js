import express from 'express';
import { getCourses, createCourse, deleteCourse } from '../controllers/courseController.js';

const router = express.Router();

router.route('/')
  .get(getCourses)
  .post(createCourse);

router.route('/:id')
  .delete(deleteCourse);

export default router;
