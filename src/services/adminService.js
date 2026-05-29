import apiClient from './apiClient';

export const CategoryService = {
  getAll:  (branchId) => apiClient.get('/menu/categories', { params: { branchId } }),
  create:  (data)     => apiClient.post('/menu/categories', data),
  update:  (id, data) => apiClient.put(`/menu/categories/${id}`, data),
  delete:  (id)       => apiClient.delete(`/menu/categories/${id}`),
};

export const MenuAdminService = {
  getAll:             (branchId, categoryId) => apiClient.get('/menu/items', { params: { branchId, categoryId } }),
  create:             (data)     => apiClient.post('/menu/items', data),
  update:             (id, data) => apiClient.put(`/menu/items/${id}`, data),
  delete:             (id)       => apiClient.delete(`/menu/items/${id}`),
  toggleAvailability: (id, isAvailable) => apiClient.patch(`/menu/items/${id}/availability`, { isAvailable }),
};

export const TaxGroupService = {
  getAll:  (branchId) => apiClient.get('/menu/tax-groups', { params: { branchId } }),
  create:  (data)     => apiClient.post('/menu/tax-groups', data),
  delete:  (id)       => apiClient.delete(`/menu/tax-groups/${id}`),
};

export const SectionService = {
  getAll:  (branchId) => apiClient.get('/sections', { params: { branchId } }),
  create:  (data)     => apiClient.post('/sections', data),
  update:  (id, data) => apiClient.put(`/sections/${id}`, data),
  delete:  (id)       => apiClient.delete(`/sections/${id}`),
};

export const TableAdminService = {
  getAll:  (branchId) => apiClient.get('/tables', { params: { branchId } }),
  create:  (data)     => apiClient.post('/tables', data),
  update:  (id, data) => apiClient.put(`/tables/${id}`, data),
  delete:  (id)       => apiClient.delete(`/tables/${id}`),
};

export const SettingsService = {
  get:    (branchId)       => apiClient.get(`/branches/${branchId}/settings`),
  update: (branchId, data) => apiClient.put(`/branches/${branchId}/settings`, data),
};
