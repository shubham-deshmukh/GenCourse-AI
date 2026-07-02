import express from 'express';
import { getCourses, createCourse, deleteCourse, streamCourse, generateCoursePdf, downloadCoursePdf } from '../controllers/courseController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

router.route('/:id')
  .delete(protect, deleteCourse);

router.route('/:id/stream')
  .get(protect, streamCourse);

router.route('/:id/pdf')
  .post(protect, generateCoursePdf);

router.route('/:id/download-pdf')
  .get(protect, downloadCoursePdf);

export default router;
