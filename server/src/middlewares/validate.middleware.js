/**
 * Creates an Express middleware that runs a validator function against `req`.
 * The validator function may mutate normalized values (e.g., `req.validatedBody`) or throw an AppError.
 */
export function validateRequest(validatorFn) {
  return (req, _res, next) => {
    try {
      validatorFn(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}
