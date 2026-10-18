import { request } from '../../../services/apiClient.js';

/**
 * AI planner endpoint. The Groq credential never leaves the backend —
 * the browser only sees the validated plan.
 */
export const aiApi = {
  async planTask(description, signal) {
    const data = await request('/api/ai/plan-task', {
      method: 'POST',
      body: { description },
      signal,
      timeoutMs: 35000, // AI generation is slower than CRUD; server also enforces its own timeout.
    });
    return data.plan;
  },
};
