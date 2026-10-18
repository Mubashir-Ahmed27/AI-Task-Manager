import { Task } from './task.model.js';
import { AppError } from '../../utils/AppError.js';
import { TASK_STATUSES } from './task.constants.js';

/**
 * Creates and persists a new task in MongoDB.
 */
export async function createTask(taskData) {
  const task = await Task.create(taskData);
  return task.toObject();
}

/**
 * Retrieves all tasks with optional query filtering and sorting.
 */
export async function listTasks(query = {}) {
  const filter = {};

  if (query.status && TASK_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  let sortOption = { createdAt: -1 };
  if (query.sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (query.sort === 'dueDateAsc') {
    sortOption = { dueDate: 1, createdAt: -1 };
  } else if (query.sort === 'dueDateDesc') {
    sortOption = { dueDate: -1, createdAt: -1 };
  } else if (query.sort === 'titleAsc') {
    sortOption = { title: 1 };
  }

  const tasks = await Task.find(filter).sort(sortOption).lean();
  return tasks;
}

/**
 * Retrieves a single task by ID or throws a 404 AppError.
 */
export async function getTaskById(taskId) {
  const task = await Task.findById(taskId).lean();
  if (!task) {
    throw new AppError('Task not found.', 404);
  }
  return task;
}

/**
 * Updates an existing task by ID using explicit $set and Mongoose update validators.
 */
export async function updateTaskById(taskId, updateData) {
  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updateData },
    { new: true, runValidators: true, context: 'query' }
  ).lean();

  if (!updatedTask) {
    throw new AppError('Task not found.', 404);
  }

  return updatedTask;
}

/**
 * Deletes an existing task by ID or throws a 404 AppError.
 */
export async function deleteTaskById(taskId) {
  const deletedTask = await Task.findByIdAndDelete(taskId).lean();
  if (!deletedTask) {
    throw new AppError('Task not found.', 404);
  }
  return deletedTask;
}
