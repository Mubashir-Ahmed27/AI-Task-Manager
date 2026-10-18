import mongoose from 'mongoose';
import {
  TASK_STATUSES,
  DEFAULT_TASK_STATUS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from './task.constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      minlength: [1, 'Task title cannot be empty.'],
      maxlength: [MAX_TITLE_LENGTH, `Task title cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [
        MAX_DESCRIPTION_LENGTH,
        `Task description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      ],
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: `Status must be one of: ${TASK_STATUSES.join(', ')}.`,
      },
      default: DEFAULT_TASK_STATUS,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Useful compound and single-field indexes for common filtering & sorting operations
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
