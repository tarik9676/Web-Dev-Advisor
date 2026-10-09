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

export const clientsApi = {
  getAll: (params = {}) => api.get(withQuery('/clients/', params)).then(res => res.results || res),

  getById: (id) => api.get(`/clients/${id}/`),

  create: (data) => api.post('/clients/', data),

  update: (id, data) => api.patch(`/clients/${id}/`, data),

  delete: (id) => api.delete(`/clients/${id}/`),
};
