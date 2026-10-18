import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import { Task } from '../../src/modules/tasks/task.model.js';
import { setAiProvider, resetAiProvider } from '../../src/modules/ai/ai.service.js';
import { AppError } from '../../src/utils/AppError.js';

let mongoServer;

describe('Integration: Full-Stack AI Task Manager API', () => {
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

  beforeEach(async () => {
    await Task.deleteMany({});
    resetAiProvider();
  });

  describe('GET /api/health', () => {
    it('returns health status without exposing sensitive credentials', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.services.database, 'connected');
      assert.equal(typeof res.body.services.aiPlanner, 'string');
      assert.equal(res.body.GROQ_API_KEY, undefined);
      assert.equal(res.body.MONGODB_URI, undefined);
    });
  });

  describe('Task CRUD Endpoints (/api/tasks)', () => {
    it('POST /api/tasks creates a valid task with default status and timestamps', async () => {
      const payload = {
        title: 'Complete system architecture diagram',
        description: 'Document client, server, and database layers',
        dueDate: '2026-06-15T00:00:00.000Z',
      };

      const res = await request(app).post('/api/tasks').send(payload);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.task.title, payload.title);
      assert.equal(res.body.task.description, payload.description);
      assert.equal(res.body.task.status, 'pending');
      assert.ok(res.body.task._id);
      assert.ok(res.body.task.createdAt);
      assert.ok(res.body.task.updatedAt);
    });

    it('POST /api/tasks rejects missing or empty title with 400', async () => {
      const resMissing = await request(app).post('/api/tasks').send({ description: 'No title' });
      assert.equal(resMissing.status, 400);
      assert.equal(resMissing.body.success, false);

      const resEmpty = await request(app).post('/api/tasks').send({ title: '   ' });
      assert.equal(resEmpty.status, 400);
      assert.equal(resEmpty.body.success, false);
    });

    it('POST /api/tasks rejects invalid status and unexpected fields with 400', async () => {
      const resInvalidStatus = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task A', status: 'done' });
      assert.equal(resInvalidStatus.status, 400);
      assert.equal(resInvalidStatus.body.success, false);

      const resUnknownField = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task B', role: 'superuser' });
      assert.equal(resUnknownField.status, 400);
      assert.equal(resUnknownField.body.success, false);
    });

    it('GET /api/tasks lists tasks and supports status and search filtering', async () => {
      await Task.create([
        { title: 'Write unit tests', description: 'Node test runner', status: 'completed' },
        { title: 'Design dashboard UI', description: 'Tailwind dark theme', status: 'in-progress' },
        { title: 'Configure MongoDB Atlas', description: 'Database setup', status: 'pending' },
      ]);

      const allRes = await request(app).get('/api/tasks');
      assert.equal(allRes.status, 200);
      assert.equal(allRes.body.success, true);
      assert.equal(allRes.body.count, 3);
      assert.equal(allRes.body.tasks.length, 3);

      const filteredStatus = await request(app).get('/api/tasks?status=in-progress');
      assert.equal(filteredStatus.status, 200);
      assert.equal(filteredStatus.body.count, 1);
      assert.equal(filteredStatus.body.tasks[0].title, 'Design dashboard UI');

      const searchRes = await request(app).get('/api/tasks?search=MongoDB');
      assert.equal(searchRes.status, 200);
      assert.equal(searchRes.body.count, 1);
      assert.equal(searchRes.body.tasks[0].title, 'Configure MongoDB Atlas');
    });


    it('GET /api/tasks/:id retrieves a task by ID and handles malformed or nonexistent IDs', async () => {
      const created = await Task.create({ title: 'Verify GET by ID' });

      const validRes = await request(app).get(`/api/tasks/${created._id}`);
      assert.equal(validRes.status, 200);
      assert.equal(validRes.body.success, true);
      assert.equal(validRes.body.task.title, 'Verify GET by ID');

      const malformedRes = await request(app).get('/api/tasks/invalid-id-123');
      assert.equal(malformedRes.status, 400);
      assert.equal(malformedRes.body.success, false);

      const nonExistentId = new mongoose.Types.ObjectId();
      const notFoundRes = await request(app).get(`/api/tasks/${nonExistentId}`);
      assert.equal(notFoundRes.status, 404);
      assert.equal(notFoundRes.body.success, false);
    });

    it('PUT /api/tasks/:id updates task fields and rejects invalid updates', async () => {
      const created = await Task.create({
        title: 'Initial Title',
        description: 'Initial Desc',
        status: 'pending',
      });

      const updateRes = await request(app)
        .put(`/api/tasks/${created._id}`)
        .send({ title: 'Updated Title', status: 'completed' });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.success, true);
      assert.equal(updateRes.body.task.title, 'Updated Title');
      assert.equal(updateRes.body.task.status, 'completed');

      const emptyUpdate = await request(app).put(`/api/tasks/${created._id}`).send({});
      assert.equal(emptyUpdate.status, 400);

      const badStatusUpdate = await request(app)
        .put(`/api/tasks/${created._id}`)
        .send({ status: 'invalid-status' });
      assert.equal(badStatusUpdate.status, 400);

      const unknownFieldUpdate = await request(app)
        .put(`/api/tasks/${created._id}`)
        .send({ _id: '507f1f77bcf86cd799439011' });
      assert.equal(unknownFieldUpdate.status, 400);

      const missingId = new mongoose.Types.ObjectId();
      const missingUpdate = await request(app)
        .put(`/api/tasks/${missingId}`)
        .send({ title: 'Still missing' });
      assert.equal(missingUpdate.status, 404);
    });

    it('DELETE /api/tasks/:id deletes a task and returns 404 on subsequent lookup', async () => {
      const created = await Task.create({ title: 'Task to delete' });

      const delRes = await request(app).delete(`/api/tasks/${created._id}`);
      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.success, true);

      const getAfterDel = await request(app).get(`/api/tasks/${created._id}`);
      assert.equal(getAfterDel.status, 404);

      const delAgain = await request(app).delete(`/api/tasks/${created._id}`);
      assert.equal(delAgain.status, 404);
    });

    it('Handles malformed JSON request bodies with a clean 400 error', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": "Broken JSON"');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Invalid JSON/i);
    });
  });
});
