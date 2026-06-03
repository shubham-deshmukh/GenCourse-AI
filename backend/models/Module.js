import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      }
    ]
  },
  {
    timestamps: true
  }
);

const Module = mongoose.model('Module', moduleSchema);
export default Module;
