import { request } from '../../../services/apiClient.js';

/**
 * Task API endpoints. One place for every task-related HTTP call.
 */
export const tasksApi = {
  async list({ status, search, sort } = {}, signal) {
    const data = await request('/api/tasks', {
      query: { status, search, sort },
      signal,
    });
    return Array.isArray(data.tasks) ? data.tasks : [];
  },

  async getById(id, signal) {
    const data = await request(`/api/tasks/${id}`, { signal });
    return data.task;
  },

  async create(payload) {
    const data = await request('/api/tasks', { method: 'POST', body: payload });
    return data.task;
  },

  async update(id, payload) {
    const data = await request(`/api/tasks/${id}`, { method: 'PUT', body: payload });
    return data.task;
  },

  async remove(id) {
    await request(`/api/tasks/${id}`, { method: 'DELETE' });
    return id;
  },
};
