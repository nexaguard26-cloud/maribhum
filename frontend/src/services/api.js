import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API calls

// Tasks
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  assign: (id, volunteerId) => api.post(`/tasks/${id}/assign`, { volunteer_id: volunteerId }),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Volunteers
export const volunteersApi = {
  getAll: (params) => api.get('/volunteers', { params }),
  getById: (id) => api.get(`/volunteers/${id}`),
  create: (data) => api.post('/volunteers', data),
  update: (id, data) => api.put(`/volunteers/${id}`, data),
  updateStatus: (id, status) => api.patch(`/volunteers/${id}/status`, { status }),
  verify: (id) => api.post(`/volunteers/${id}/verify`),
  getAvailable: (params) => api.get('/volunteers/available', { params }),
  getStats: (id) => api.get(`/volunteers/${id}/stats`),
};

// Reports
export const reportsApi = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  review: (id, data) => api.patch(`/reports/${id}/review`, data),
  getPending: () => api.get('/reports/status/pending'),
};

// Dashboard
export const dashboardApi = {
  getOverview: (params) => api.get('/dashboard/overview', { params }),
  getKpis: (params) => api.get('/dashboard/kpis', { params }),
  getMap: (params) => api.get('/dashboard/map', { params }),
  getTimeline: (params) => api.get('/dashboard/timeline', { params }),
};

// Organizations
export const organizationsApi = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  getStats: (id) => api.get(`/organizations/${id}/stats`),
};

// Notifications
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnread: () => api.get('/notifications', { params: { unread_only: true } }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
