import { AppError } from '../../utils/AppError.js';

export const MIN_DESCRIPTION_LENGTH = 5;
export const MAX_AI_DESCRIPTION_LENGTH = 2000;
export const VALID_PRIORITIES = Object.freeze(['low', 'medium', 'high']);

/**
 * Validates incoming request body for `POST /api/ai/plan-task`.
 */
export function validatePlanTaskRequest(req) {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    throw new AppError('Request body must be a valid JSON object.', 400);
  }

  const allowedKeys = ['description'];
  const unknownKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new AppError(
      `Unknown field(s) in request: ${unknownKeys.join(', ')}. Only "description" is allowed.`,
      400
    );
  }

  const { description } = req.body;
  if (description === undefined || description === null) {
    throw new AppError('Task description is required.', 400);
  }

  if (typeof description !== 'string') {
    throw new AppError('Task description must be a string.', 400);
  }

  const trimmed = description.trim();
  if (trimmed.length === 0) {
    throw new AppError('Task description cannot be empty.', 400);
  }

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    throw new AppError(
      `Task description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`,
      400
    );
  }

  if (trimmed.length > MAX_AI_DESCRIPTION_LENGTH) {
    throw new AppError(
      `Task description cannot exceed ${MAX_AI_DESCRIPTION_LENGTH} characters.`,
      400
    );
  }

  req.validatedBody = { description: trimmed };
}

/**
 * Parses and strictly validates the AI provider's raw response against the required contract:
 * - summary: non-empty string
 * - priority: "low" | "medium" | "high"
 * - estimatedHours: finite positive number
 * - steps: array of 3-7 non-empty strings
 */
export function validateGeneratedPlan(rawInput) {
  let parsed = rawInput;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      throw new AppError('AI provider returned an empty response.', 502);
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new AppError('AI provider returned invalid JSON.', 502);
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AppError('AI provider returned an unexpected response structure.', 502);
  }

  // Unwrap if model nested inside { plan: { ... } }
  const candidate = parsed.plan && typeof parsed.plan === 'object' ? parsed.plan : parsed;

  if (typeof candidate.summary !== 'string' || candidate.summary.trim().length === 0) {
    throw new AppError('AI response failed validation: "summary" must be a non-empty string.', 502);
  }

  const priority =
    typeof candidate.priority === 'string' ? candidate.priority.trim().toLowerCase() : '';
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new AppError(
      `AI response failed validation: "priority" must be one of ${VALID_PRIORITIES.join(', ')}.`,
      502
    );
  }

  const estimatedHours = Number(candidate.estimatedHours);
  if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) {
    throw new AppError(
      'AI response failed validation: "estimatedHours" must be a finite positive number.',
      502
    );
  }

  if (!Array.isArray(candidate.steps)) {
    throw new AppError('AI response failed validation: "steps" must be an array.', 502);
  }

  const cleanedSteps = candidate.steps
    .filter((step) => typeof step === 'string')
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  if (cleanedSteps.length < 3 || cleanedSteps.length > 7 || cleanedSteps.length !== candidate.steps.length) {
    throw new AppError(
      'AI response failed validation: "steps" must contain between 3 and 7 non-empty strings.',
      502
    );
  }

  return {
    summary: candidate.summary.trim(),
    priority,
    estimatedHours: Math.round(estimatedHours * 10) / 10,
    steps: cleanedSteps,
  };
}
