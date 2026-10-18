import { describe, it, expect } from 'vitest';
import {
  buildTaskDescription,
  formatPlanAsText,
  getPlanErrorMessage,
} from './planUtils.js';

const plan = {
  summary: 'Build and launch a personal portfolio website.',
  priority: 'high',
  estimatedHours: 12,
  steps: ['Plan the structure', 'Build the layout', 'Deploy the site'],
};

describe('planUtils.formatPlanAsText', () => {
  it('renders a readable multi-line plan', () => {
    const text = formatPlanAsText(plan);
    expect(text).toContain(plan.summary);
    expect(text).toContain('Priority: high');
    expect(text).toContain('~12 hours');
    expect(text).toContain('1. Plan the structure');
    expect(text).toContain('3. Deploy the site');
  });
});

describe('planUtils.buildTaskDescription', () => {
  it('includes the numbered steps and an AI-estimate disclaimer', () => {
    const description = buildTaskDescription(plan);
    expect(description).toContain('priority: high');
    expect(description).toContain('1. Plan the structure');
    expect(description.toLowerCase()).toContain('may be inaccurate');
  });
});

describe('planUtils.getPlanErrorMessage', () => {
  it('explains rate limits and missing configuration', () => {
    expect(getPlanErrorMessage(429, 'raw')).toMatch(/rate-limiting/i);
    expect(getPlanErrorMessage(503, 'raw')).toMatch(/GROQ_API_KEY/);
    expect(getPlanErrorMessage(504, 'raw')).toMatch(/timed out/i);
  });

  it('falls back to the server message', () => {
    expect(getPlanErrorMessage(500, 'Server exploded')).toBe('Server exploded');
    expect(getPlanErrorMessage(0, '')).toMatch(/could not be generated/i);
  });
});
