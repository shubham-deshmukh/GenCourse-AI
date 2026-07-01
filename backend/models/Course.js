import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  url: {
    type: String
  }
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [
    {
      type: String,
      required: true
    }
  ],
  correctIndex: {
    type: Number,
    required: true
  },
  explanation: {
    type: String
  }
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
      }
    ],
    resources: [resourceSchema],
    quizzes: [quizQuestionSchema],
    status: {
      type: String,
      enum: ['outline_generating', 'lessons_generating', 'completed', 'failed'],
      default: 'outline_generating'
    },
    progress: {
      totalLessons: {
        type: Number,
        default: 0
      },
      completedLessons: {
        type: Number,
        default: 0
      },
      currentStatusMessage: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
