const mongoose = require('mongoose');

const attemptQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    questionText: {
      type: String,
      default: '',
    },
    options: {
      type: [String],
      default: [],
    },
    marks: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required'],
    },
    questions: [attemptQuestionSchema],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'expired'],
      default: 'in-progress',
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
