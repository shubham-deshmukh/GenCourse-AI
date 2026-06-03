import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true
    },
    content: {
      type: Map,
      of: String,
      required: [true, 'Lesson content map is required']
    },
    objectives: [
      {
        type: String,
        trim: true
      }
    ],
    videoSearchQuery: {
      type: String,
      trim: true
    },
    script: {
      type: String,
      trim: true
    },
    videoSlide: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
