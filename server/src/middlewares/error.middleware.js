import { AppError } from '../utils/AppError.js';

/**
 * Centralized error-handling middleware.
 * Normalizes operational errors, Mongoose validation/cast errors, and malformed JSON bodies
 * without leaking stack traces, database internals, or API secrets.
 */
export function errorMiddleware(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.details || undefined;

  // Handle malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload in request body.';
  }
  // Handle payload too large from express.json()
  else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload exceeds the maximum allowed size.';
  }
  // Handle Mongoose CastError (e.g., invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'} format.`;
  }
  // Handle Mongoose ValidationError
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const fieldMessages = Object.values(err.errors).map((val) => val.message);
    message = fieldMessages[0] || 'Validation failed.';
    errors = fieldMessages;
  }
  // Hide non-operational unexpected internal error details
  else if (!(err instanceof AppError) && !err.isOperational && statusCode === 500) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[Server Error]', err.name, err.message);
    }
    message = 'An unexpected server error occurred.';
  }

  const payload = {
    success: false,
    message,
  };

  if (errors && Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
}
