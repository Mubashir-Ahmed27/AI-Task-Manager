/**
 * Wraps an async Express route handler or middleware so any rejected promise
 * is automatically forwarded to Express's centralized error middleware via next(err).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
