import Groq from 'groq-sdk';
import { getEnv } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';

const SYSTEM_PROMPT = `You are an expert technical project planner and productivity assistant.
Given a user's task description or goal, break it down into a clear, actionable execution plan.

Respond ONLY with a valid JSON object matching this exact structure (no markdown fences, no extra keys):
{
  "summary": "A concise 1-sentence summary of the task objective",
  "priority": "low" | "medium" | "high",
  "estimatedHours": 8,
  "steps": [
    "Step 1 description",
    "Step 2 description",
    "Step 3 description"
  ]
}

Strict requirements:
1. "summary" must be a non-empty string (10 to 160 characters).
2. "priority" must be strictly one of: "low", "medium", or "high".
3. "estimatedHours" must be a realistic positive number greater than 0.
4. "steps" must be an array containing between 3 and 7 concise, actionable, non-empty strings.`;

/**
 * Determines whether an error from the Groq API is transient and safe for a bounded retry.
 */
function isRetryableProviderError(error) {
  if (!error) return false;
  if (error.name === 'APIConnectionTimeoutError' || error.code === 'ETIMEDOUT') return true;
  if (error.name === 'APIConnectionError') return true;
  const status = Number(error.status || error.statusCode);
  return status >= 500 && status < 600;
}

/**
 * Translates Groq SDK / network exceptions into safe, descriptive AppErrors without leaking credentials.
 */
export function normalizeGroqError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const status = Number(error?.status || error?.statusCode);
  const rawMessage = String(error?.message || '');

  if (error?.name === 'APIConnectionTimeoutError' || error?.code === 'ETIMEDOUT' || /timed?\s*out/i.test(rawMessage)) {
    return new AppError('AI planning request timed out. Please try again shortly.', 504);
  }

  if (status === 401 || status === 403 || /invalid api key|authentication/i.test(rawMessage)) {
    return new AppError(
      'AI provider authentication failed. Please verify GROQ_API_KEY in the server configuration.',
      502
    );
  }

  if (status === 429 || /rate limit/i.test(rawMessage)) {
    return new AppError(
      'AI provider rate limit reached. Please wait a moment before generating another plan.',
      429
    );
  }

  if (status === 400 || status === 404 || /model.*not found|decommissioned|unsupported/i.test(rawMessage)) {
    return new AppError(
      'Configured AI model is unavailable or unsupported. Please check GROQ_MODEL in the server configuration.',
      502
    );
  }

  if (error?.name === 'APIConnectionError' || /fetch failed|network|enotfound|econnrefused/i.test(rawMessage)) {
    return new AppError('Unable to reach the AI provider due to a network error.', 502);
  }

  return new AppError('Failed to generate task plan from AI provider.', 502);
}

/**
 * Creates a Groq provider instance. Accepts optional custom client/config for unit testing.
 */
export function createGroqProvider(options = {}) {
  return {
    async generateTaskPlan(description) {
      const currentEnv = getEnv(options.envOverrides);
      const apiKey = options.apiKey ?? currentEnv.GROQ_API_KEY;
      const model = options.model ?? currentEnv.GROQ_MODEL;
      const timeoutMs = options.timeoutMs ?? currentEnv.AI_TIMEOUT_MS;
      const maxRetries = options.maxRetries ?? 1;

      if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new AppError(
          'AI planner is not configured. Missing GROQ_API_KEY on the server.',
          503
        );
      }

      if (!model) {
        throw new AppError(
          'AI planner model is not configured. Missing GROQ_MODEL on the server.',
          503
        );
      }

      const client =
        options.client ||
        new Groq({
          apiKey,
          timeout: timeoutMs,
          maxRetries: 0, // We manage bounded retry explicitly below
        });

      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Create a structured JSON task plan for the following goal:\n\n${description}`,
              },
            ],
            temperature: 0.3,
            max_completion_tokens: 800,
            response_format: { type: 'json_object' },
          });

          const content = completion?.choices?.[0]?.message?.content;
          if (!content || typeof content !== 'string' || !content.trim()) {
            throw new AppError('AI provider returned an empty response.', 502);
          }

          return content;
        } catch (error) {
          if (attempt < maxRetries && isRetryableProviderError(error)) {
            attempt += 1;
            continue;
          }
          throw normalizeGroqError(error);
        }
      }

      throw new AppError('Failed to generate task plan from AI provider.', 502);
    },
  };
}

export const defaultGroqProvider = createGroqProvider();
