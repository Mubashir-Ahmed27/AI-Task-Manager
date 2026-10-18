import { AppError } from '../utils/AppError.js';

/**
 * Handles requests to unknown API routes with a consistent 404 JSON response.
 */
export function notFoundMiddleware(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
