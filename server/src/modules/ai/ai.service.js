import { defaultGroqProvider } from './providers/groq.provider.js';
import { validateGeneratedPlan } from './ai.validation.js';

let activeProvider = defaultGroqProvider;

/**
 * Allows injecting a mock or custom AI provider (used by automated tests or alternative providers).
 */
export function setAiProvider(provider) {
  activeProvider = provider || defaultGroqProvider;
}

export function resetAiProvider() {
  activeProvider = defaultGroqProvider;
}

/**
 * Generates and validates a structured task plan from a user's task description.
 */
export async function planTaskFromDescription(description, provider = activeProvider) {
  const rawOutput = await provider.generateTaskPlan(description);
  const validatedPlan = validateGeneratedPlan(rawOutput);
  return validatedPlan;
}
