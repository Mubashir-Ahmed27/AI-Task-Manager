import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ApiError } from './apiClient.js';

describe('apiClient.request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on success and sends a JSON body', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true, task: { _id: '1', title: 'A' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await request('/api/tasks', { method: 'POST', body: { title: 'A' } });

    expect(result.task.title).toBe('A');
    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe(JSON.stringify({ title: 'A' }));
  });

  it('builds query strings and skips empty values', async () => {
    fetch.mockResolvedValue(new Response('{"success":true}', { status: 200 }));

    await request('/api/tasks', { query: { status: 'pending', search: '' } });

    expect(fetch.mock.calls[0][0]).toBe('/api/tasks?status=pending');
  });

  it('throws a typed ApiError using the server message for error responses', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Task not found.' }), {
        status: 404,
      })
    );

    await expect(request('/api/tasks/123')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Task not found.',
    });
  });

  it('reports a network failure in plain language', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/api/tasks')).rejects.toThrow(/Cannot reach the server/i);
  });

  it('rejects when the server returns a non-JSON body', async () => {
    fetch.mockResolvedValue(new Response('<html>oops</html>', { status: 200 }));

    await expect(request('/api/tasks')).rejects.toBeInstanceOf(ApiError);
  });

  it('explains a 405 from a static host (Vercel) instead of showing a raw error', async () => {
    fetch.mockResolvedValue(new Response('', { status: 405 }));

    await expect(request('/api/tasks', { method: 'POST', body: { title: 'A' } })).rejects.toMatchObject(
      {
        name: 'ApiError',
        status: 405,
        code: 'API_NOT_REACHABLE',
      }
    );
  });

  it('explains an HTML page returned from an API URL (SPA rewrite fallback)', async () => {
    fetch.mockResolvedValue(
      new Response('<!doctype html><html><body>app</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    await expect(request('/api/tasks')).rejects.toThrow(/VITE_API_URL/);
  });
});
