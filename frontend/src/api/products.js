import { api } from './client.js';

export const productsApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    return api.get(`/products/${query ? `?${query}` : ''}`).then(res => res.results || res);
  },

  getFeatured: () => api.get('/products/featured/').then(res => res.results || res),

  getByCategory: (categorySlug) => api.get(`/products/by_category/?category=${categorySlug}`).then(res => res.results || res),

  getById: (id) => api.get(`/products/${id}/`),

  getCategories: () => api.get('/product-categories/').then(res => res.results || res),

  getCategoryById: (id) => api.get(`/product-categories/${id}/`),

  create: (data) => api.post('/products/', data),

  update: (id, data) => api.patch(`/products/${id}/`, data),

  delete: (id) => api.delete(`/products/${id}/`),

  checkout: (data) => api.post('/checkout/', data),
};

export const licensesApi = {
  getByEmail: (email) => api.get(`/licenses/?email=${encodeURIComponent(email)}`),

  verify: (licenseKey) => api.post('/licenses/verify/', { license_key: licenseKey }),

  activateSite: (licenseId, siteUrl) => api.post(`/licenses/${licenseId}/activate_site/`, { site_url: siteUrl }),
};

export const downloadsApi = {
  getByLicense: (licenseKey) => api.get(`/downloads/?license_key=${encodeURIComponent(licenseKey)}`),

  create: (data) => api.post('/downloads/', data),
};

export const servicesApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    return api.get(`/services/${query ? `?${query}` : ''}`).then(res => res.results || res);
  },

  getFeatured: () => api.get('/services/featured/').then(res => res.results || res),

  getById: (id) => api.get(`/services/${id}/`),

  create: (data) => api.post('/services/', data),

  update: (id, data) => api.patch(`/services/${id}/`, data),

  delete: (id) => api.delete(`/services/${id}/`),
};