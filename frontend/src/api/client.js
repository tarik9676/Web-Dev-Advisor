const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const UNAUTHORIZED_EVENT = 'wda:unauthorized';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || flattenError(body) || `API request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

export function flattenError(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  const error = body.error ?? body;
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) return error.map((item) => flattenError(item)).filter(Boolean).join(' ');
  if (error && typeof error === 'object') {
    return Object.entries(error)
      .map(([field, messages]) => {
        const text = flattenError(messages);
        return field === 'non_field_errors' || field === 'credentials' || field === 'detail'
          ? text
          : `${field}: ${text}`;
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;
  const url = `${BASE}${normalizedPath}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (!SAFE_METHODS.has(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    let body;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function apiFetchWithFallback(path, options, seedData) {
  try {
    return await apiFetch(path, options);
  } catch (error) {
    if (error.status === 401 || error.status === 403) throw error;
    return seedData;
  }
}

const del = (path, data) => apiFetch(path, {
  method: 'DELETE',
  ...(data ? { body: JSON.stringify(data) } : {}),
});

export const api = {
  get: (path, options) => {
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const query = searchParams.toString();
      if (query) path = `${path}?${query}`;
    }
    return apiFetch(path, options);
  },
  post: (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => apiFetch(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: del,
  del,
};
