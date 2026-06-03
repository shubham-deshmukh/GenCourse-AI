import express from 'express';
import { getCourses, createCourse } from '../controllers/courseController.js';

const router = express.Router();

router.route('/')
  .get(getCourses)
  .post(createCourse);

export default router;
