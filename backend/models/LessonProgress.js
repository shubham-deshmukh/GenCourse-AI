import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      required: true
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee uniqueness of progress per user-course-lesson tuple
lessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);
export default LessonProgress;
