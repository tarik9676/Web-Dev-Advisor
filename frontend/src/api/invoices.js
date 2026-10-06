import { api } from './client.js';

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const invoicesApi = {
  getAll: (projectId, params = {}) =>
    api.get(withQuery(`/projects/${projectId}/invoices/`, params)).then(res => res.results || res),

  create: (projectId, data) => api.post(`/projects/${projectId}/invoices/`, data),

  update: (projectId, id, data) => api.patch(`/projects/${projectId}/invoices/${id}/`, data),

  remove: (projectId, id) => api.del(`/projects/${projectId}/invoices/${id}/`),

  // Creates the Stripe Checkout link and moves the invoice to "sent".
  // Returns { invoice, checkout_url, session_id }.
  send: (projectId, id) => api.post(`/projects/${projectId}/invoices/${id}/send/`, {}),

  void: (projectId, id) => api.post(`/projects/${projectId}/invoices/${id}/void/`, {}),

  getBillingSummary: (projectId) => api.get(`/projects/${projectId}/billing_summary/`),
};