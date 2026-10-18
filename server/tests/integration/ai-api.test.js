import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import { setAiProvider, resetAiProvider } from '../../src/modules/ai/ai.service.js';
import { AppError } from '../../src/utils/AppError.js';

let mongoServer;

describe('Integration: AI Planner & Unknown Routes', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    resetAiProvider();
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(() => {
    resetAiProvider();
  });

  it('POST /api/ai/plan-task returns a validated structured task plan when the AI provider succeeds', async () => {
    setAiProvider({
      async generateTaskPlan() {
        return JSON.stringify({
          summary: 'Build and launch a personal portfolio website.',
          priority: 'high',
          estimatedHours: 12,
          steps: [
            'Plan the website structure',
            'Build the responsive layout',
            'Add projects and contact information',
            'Test and deploy the website',
          ],
        });
      },
    });

    const res = await request(app)
      .post('/api/ai/plan-task')
      .send({ description: 'I need to build a portfolio website within three days.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.plan, {
      summary: 'Build and launch a personal portfolio website.',
      priority: 'high',
      estimatedHours: 12,
      steps: [
        'Plan the website structure',
        'Build the responsive layout',
        'Add projects and contact information',
        'Test and deploy the website',
      ],
    });
  });

  it('POST /api/ai/plan-task rejects missing, empty, or overly long AI descriptions with 400', async () => {
    const missingRes = await request(app).post('/api/ai/plan-task').send({});
    assert.equal(missingRes.status, 400);
    assert.equal(missingRes.body.success, false);

    const emptyRes = await request(app).post('/api/ai/plan-task').send({ description: '   ' });
    assert.equal(emptyRes.status, 400);

    const longRes = await request(app)
      .post('/api/ai/plan-task')
      .send({ description: 'a'.repeat(2005) });
    assert.equal(longRes.status, 400);
  });

  it('POST /api/ai/plan-task returns 502 when AI provider returns malformed JSON or invalid schema structure', async () => {
    setAiProvider({
      async generateTaskPlan() {
        return JSON.stringify({
          summary: 'Incomplete plan',
          priority: 'high',
          estimatedHours: 10,
          steps: ['Only one step'],
        });
      },
    });

    const res = await request(app)
      .post('/api/ai/plan-task')
      .send({ description: 'Launch a marketing campaign next week.' });

    assert.equal(res.status, 502);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /steps/i);
  });

  it('POST /api/ai/plan-task handles AI provider rate limits (429) and service errors cleanly', async () => {
    setAiProvider({
      async generateTaskPlan() {
        throw new AppError(
          'AI provider rate limit reached. Please wait a moment before generating another plan.',
          429
        );
      },
    });

    const res = await request(app)
      .post('/api/ai/plan-task')
      .send({ description: 'Prepare quarterly financial review presentation.' });

    assert.equal(res.status, 429);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /rate limit/i);
  });

  it('Returns 404 JSON for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
