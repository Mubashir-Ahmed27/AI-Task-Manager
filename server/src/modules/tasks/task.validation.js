import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import {
  ALLOWED_TASK_FIELDS,
  TASK_STATUSES,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from './task.constants.js';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAllowedFields(body) {
  const keys = Object.keys(body);
  const unknownKeys = keys.filter((key) => !ALLOWED_TASK_FIELDS.includes(key));
  if (unknownKeys.length > 0) {
    throw new AppError(
      `Unknown or disallowed field(s): ${unknownKeys.join(', ')}. Allowed fields are: ${ALLOWED_TASK_FIELDS.join(', ')}.`,
      400
    );
  }
}

function validateTitle(title, { required = false } = {}) {
  if (title === undefined) {
    if (required) {
      throw new AppError('Task title is required.', 400);
    }
    return undefined;
  }

  if (typeof title !== 'string') {
    throw new AppError('Task title must be a string.', 400);
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new AppError('Task title cannot be empty.', 400);
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new AppError(`Task title cannot exceed ${MAX_TITLE_LENGTH} characters.`, 400);
  }

  return trimmed;
}

function validateDescription(description) {
  if (description === undefined) {
    return undefined;
  }
  if (description === null) {
    return '';
  }
  if (typeof description !== 'string') {
    throw new AppError('Task description must be a string.', 400);
  }
  const trimmed = description.trim();
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new AppError(`Task description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`, 400);
  }
  return trimmed;
}

function validateStatus(status) {
  if (status === undefined) {
    return undefined;
  }
  if (typeof status !== 'string' || !TASK_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Status must be one of: ${TASK_STATUSES.join(', ')}.`, 400);
  }
  return status;
}

function validateDueDate(dueDate) {
  if (dueDate === undefined) {
    return undefined;
  }
  if (dueDate === null || dueDate === '') {
    return null;
  }
  if (typeof dueDate !== 'string' && typeof dueDate !== 'number' && !(dueDate instanceof Date)) {
    throw new AppError('Invalid dueDate format. Provide an ISO 8601 date string or null.', 400);
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid dueDate value. Must be a valid date.', 400);
  }

  return parsed;
}

/**
 * Validates `req.params.id` as a valid MongoDB ObjectId.
 */
export function validateTaskIdParam(req) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid task ID format.', 400);
  }
}

/**
 * Validates request body for `POST /api/tasks`.
 */
export function validateCreateTask(req) {
  if (!isPlainObject(req.body)) {
    throw new AppError('Request body must be a valid JSON object.', 400);
  }

  assertAllowedFields(req.body);

  const title = validateTitle(req.body.title, { required: true });
  const description = validateDescription(req.body.description);
  const status = validateStatus(req.body.status);
  const dueDate = validateDueDate(req.body.dueDate);

  const sanitized = { title };
  if (description !== undefined) sanitized.description = description;
  if (status !== undefined) sanitized.status = status;
  if (dueDate !== undefined) sanitized.dueDate = dueDate;

  req.validatedBody = sanitized;
}

/**
 * Validates request body and params for `PUT /api/tasks/:id`.
 */
export function validateUpdateTask(req) {
  validateTaskIdParam(req);

  if (!isPlainObject(req.body)) {
    throw new AppError('Request body must be a valid JSON object.', 400);
  }

  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    throw new AppError('Update body cannot be empty. Provide at least one field to update.', 400);
  }

  assertAllowedFields(req.body);

  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    sanitized.title = validateTitle(req.body.title, { required: true });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
    sanitized.description = validateDescription(req.body.description);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    sanitized.status = validateStatus(req.body.status);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
    sanitized.dueDate = validateDueDate(req.body.dueDate);
  }

  req.validatedBody = sanitized;
}
