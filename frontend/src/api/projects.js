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

export const projectsApi = {
  getAll: (params = {}) => api.get(withQuery('/projects/', params)).then(res => res.results || res),

  getById: (id) => api.get(`/projects/${id}/`),

  create: (data) => api.post('/projects/', data),

  update: (id, data) => api.patch(`/projects/${id}/`, data),

  delete: (id) => api.delete(`/projects/${id}/`),

  getMembers: (id) => api.get(`/projects/${id}/members/`),

  addMember: (id, data) => api.post(`/projects/${id}/members/`, data),

  removeMember: (id, data) => api.delete(`/projects/${id}/members/`, data),

  getTeamMembers: (id) => api.get(`/projects/${id}/team-members/`).then(res => res.results || res),

  createTeamMember: (id, data) => api.post(`/projects/${id}/team-members/`, data),

  deleteTeamMember: (id, memberId) => api.delete(`/projects/${id}/team-members/${memberId}/`),
};