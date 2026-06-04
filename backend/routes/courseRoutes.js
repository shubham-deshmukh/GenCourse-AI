import express from 'express';
import { getCourses, createCourse, deleteCourse, streamCourse } from '../controllers/courseController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

router.route('/:id')
  .delete(protect, requireRole(['instructor', 'admin']), deleteCourse);

router.route('/:id/stream')
  .get(protect, streamCourse);

export default router;
