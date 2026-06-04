import express from 'express';
import { chatWithTutor } from '../controllers/tutorController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route to handle context-aware AI tutor chat
router.route('/chat')
  .post(protect, chatWithTutor);

export default router;
