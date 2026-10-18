import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePlanTaskRequest,
  validateGeneratedPlan,
} from '../../src/modules/ai/ai.validation.js';
import {
  createGroqProvider,
  normalizeGroqError,
} from '../../src/modules/ai/providers/groq.provider.js';

describe('Unit: AI Output & Request Validation', () => {
  it('validates a well-formed AI task plan JSON string', () => {
    const raw = JSON.stringify({
      summary: 'Build and launch a personal portfolio website.',
      priority: 'HIGH',
      estimatedHours: 12,
      steps: [
        'Plan the website structure',
        'Build the responsive layout',
        'Add projects and contact information',
        'Test and deploy the website',
      ],
    });

    const result = validateGeneratedPlan(raw);
    assert.equal(result.summary, 'Build and launch a personal portfolio website.');
    assert.equal(result.priority, 'high');
    assert.equal(result.estimatedHours, 12);
    assert.equal(result.steps.length, 4);
  });

  it('rejects invalid JSON or empty AI outputs', () => {
    assert.throws(() => validateGeneratedPlan(''), /empty response/);
    assert.throws(() => validateGeneratedPlan('{bad json'), /invalid JSON/);
  });

  it('rejects plans with out-of-range steps count or invalid priority', () => {
    assert.throws(
      () =>
        validateGeneratedPlan({
          summary: 'Valid summary',
          priority: 'urgent',
          estimatedHours: 5,
          steps: ['One', 'Two', 'Three'],
        }),
      /priority/
    );

    assert.throws(
      () =>
        validateGeneratedPlan({
          summary: 'Valid summary',
          priority: 'medium',
          estimatedHours: 5,
          steps: ['Only one step', 'Only two steps'],
        }),
      /steps/
    );

    assert.throws(
      () =>
        validateGeneratedPlan({
          summary: 'Valid summary',
          priority: 'medium',
          estimatedHours: -3,
          steps: ['Step 1', 'Step 2', 'Step 3'],
        }),
      /estimatedHours/
    );
  });

  it('validates AI request description boundaries', () => {
    assert.throws(
      () => validatePlanTaskRequest({ body: {} }),
      /Task description is required/
    );
    assert.throws(
      () => validatePlanTaskRequest({ body: { description: '   ' } }),
      /cannot be empty/
    );
    assert.throws(
      () => validatePlanTaskRequest({ body: { description: 'hi' } }),
      /at least 5 characters/
    );
  });
});

describe('Unit: Groq Provider Error Normalization & Retry Behavior', () => {
  it('fails clearly when GROQ_API_KEY is missing', async () => {
    const provider = createGroqProvider({ apiKey: '' });
    await assert.rejects(
      () => provider.generateTaskPlan('Build a portfolio website in three days'),
      (err) => err.statusCode === 503 && /Missing GROQ_API_KEY/.test(err.message)
    );
  });

  it('normalizes rate limit (429), timeout (504), and auth (401) errors', () => {
    const rateErr = normalizeGroqError({ status: 429, message: 'Rate limit reached' });
    assert.equal(rateErr.statusCode, 429);

    const timeoutErr = normalizeGroqError({
      name: 'APIConnectionTimeoutError',
      message: 'Request timed out',
    });
    assert.equal(timeoutErr.statusCode, 504);

    const authErr = normalizeGroqError({ status: 401, message: 'Invalid API Key' });
    assert.equal(authErr.statusCode, 502);
  });

  it('performs bounded retry on transient 5xx error and succeeds if second attempt succeeds', async () => {
    let calls = 0;
    const mockClient = {
      chat: {
        completions: {
          async create() {
            calls += 1;
            if (calls === 1) {
              const err = new Error('Internal server error');
              err.status = 503;
              throw err;
            }
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      summary: 'Recovered plan',
                      priority: 'medium',
                      estimatedHours: 4,
                      steps: ['Step A', 'Step B', 'Step C'],
                    }),
                  },
                },
              ],
            };
          },
        },
      },
    };

    const provider = createGroqProvider({
      apiKey: 'test-key',
      model: 'llama-3.3-70b-versatile',
      client: mockClient,
      maxRetries: 1,
    });

    const raw = await provider.generateTaskPlan('Test retry logic');
    assert.equal(calls, 2);
    assert.ok(raw.includes('Recovered plan'));
  });
});
