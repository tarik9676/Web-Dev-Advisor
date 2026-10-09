import { api } from './client.js';

// Interface choices that follow the account, not the browser.
export const preferencesApi = {
  get: () => api.get('/preferences/'),
  update: (data) => api.patch('/preferences/', data),
};
