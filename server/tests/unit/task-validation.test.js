import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskIdParam,
} from '../../src/modules/tasks/task.validation.js';
import { validateStartupEnv, getEnv } from '../../src/config/env.js';

describe('Unit: Task Validation', () => {
  it('validates and trims a valid task creation payload', () => {
    const req = {
      body: {
        title: '  Build REST API  ',
        description: '  Use Express and Mongoose  ',
        status: 'in-progress',
        dueDate: '2026-05-01T12:00:00.000Z',
      },
    };

    validateCreateTask(req);
    assert.equal(req.validatedBody.title, 'Build REST API');
    assert.equal(req.validatedBody.description, 'Use Express and Mongoose');
    assert.equal(req.validatedBody.status, 'in-progress');
    assert.ok(req.validatedBody.dueDate instanceof Date);
  });

  it('rejects missing or whitespace-only task title', () => {
    assert.throws(() => validateCreateTask({ body: {} }), /Task title is required/);
    assert.throws(
      () => validateCreateTask({ body: { title: '   ' } }),
      /Task title cannot be empty/
    );
  });

  it('rejects invalid status values', () => {
    assert.throws(
      () => validateCreateTask({ body: { title: 'Test', status: 'archived' } }),
      /Invalid status/
    );
  });

  it('rejects unexpected/unknown fields to prevent mass assignment', () => {
    assert.throws(
      () => validateCreateTask({ body: { title: 'Test', isAdmin: true } }),
      /Unknown or disallowed field/
    );
  });

  it('rejects empty update bodies and malformed ObjectIds', () => {
    assert.throws(
      () => validateTaskIdParam({ params: { id: 'not-a-valid-id' } }),
      /Invalid task ID format/
    );
    assert.throws(
      () => validateUpdateTask({ params: { id: '507f1f77bcf86cd799439011' }, body: {} }),
      /Update body cannot be empty/
    );
  });
});

describe('Unit: Environment Validation', () => {
  it('requires MONGODB_URI in production mode', () => {
    const prodEnv = getEnv({ NODE_ENV: 'production', MONGODB_URI: '' });
    assert.throws(() => validateStartupEnv(prodEnv), /MONGODB_URI/);
  });
});
