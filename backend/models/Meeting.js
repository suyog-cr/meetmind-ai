const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
  },
  priority: {
    type: String,
    enum: {
      values: ['LOW', 'MEDIUM', 'HIGH'],
      message: 'Priority must be LOW, MEDIUM, or HIGH',
    },
    default: 'MEDIUM',
  },
  deadline: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED',
    },
    default: 'PENDING',
  },
});

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    meetingDate: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    originalText: {
      type: String,
      required: [true, 'Original meeting text is required'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    actionItems: {
      type: [actionItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
meetingSchema.index({ title: 'text', summary: 'text', originalText: 'text' });

module.exports = mongoose.model('Meeting', meetingSchema);
