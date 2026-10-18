/**
 * Centralized HTTP layer.
 *
 * Why: every feature must share the same base URL, timeout behaviour, response
 * parsing, and error shape. Components never call `fetch` directly.
 *
 * VITE_API_URL is optional:
 *  - Empty (default in dev): requests go to `/api/...` and Vite's dev proxy
 *    forwards them to http://localhost:3000 (no CORS setup needed).
 *  - Set to e.g. https://my-api.onrender.com in production.
 *
 * SECURITY: everything in `import.meta.env.VITE_*` is bundled into the browser
 * and is therefore public. Never put secrets here (e.g. GROQ_API_KEY).
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [], cause = null, code = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.cause = cause;
    this.code = code;
  }
}

/**
 * A 405, or an HTML page returned from an `/api` URL, means the request reached a
 * static host (Vercel/Netlify/GitHub Pages) instead of the Express API.
 * This is the most common deployment mistake, so it gets a dedicated message.
 */
const API_NOT_REACHABLE_MESSAGE =
  'The request reached the static site host instead of the API (HTTP 405 / HTML response). ' +
  'Deploy the Express backend (for example on Render) and set VITE_API_URL to that URL, ' +
  'then redeploy the frontend so the new value is baked into the build.';

function isHtmlResponse(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  return contentType.includes('text/html');
}

function buildUrl(path, query) {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      params.set(key, value);
    }
  });

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * Performs a JSON request and normalizes every failure into an ApiError.
 */
export async function request(path, { method = 'GET', body, query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    let response;
    try {
      response = await fetch(buildUrl(path, query), {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new ApiError('The request took too long. Please try again.', { cause: error });
      }
      throw new ApiError(
        'Cannot reach the server. Check that the backend is running and try again.',
        { cause: error }
      );
    }

    const rawText = await response.text();
    const looksLikeHtml = isHtmlResponse(response) || /^\s*<!doctype html/i.test(rawText);
    let payload = null;

    if (rawText && !looksLikeHtml) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (response.status === 405 || looksLikeHtml) {
      throw new ApiError(API_NOT_REACHABLE_MESSAGE, {
        status: response.status,
        code: 'API_NOT_REACHABLE',
      });
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        (response.status === 404
          ? 'The requested resource was not found.'
          : `Request failed with status ${response.status}.`);
      throw new ApiError(message, {
        status: response.status,
        errors: Array.isArray(payload?.errors) ? payload.errors : [],
      });
    }

    if (payload === null) {
      throw new ApiError('The server returned an unexpected response format.');
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export const apiConfig = { API_BASE_URL, DEFAULT_TIMEOUT_MS };
