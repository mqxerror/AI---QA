import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
});

// Add request interceptor to include auth token
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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Websites
export const getWebsites = () => api.get('/websites');
export const getWebsite = (id) => api.get(`/websites/${id}`);
export const createWebsite = (data) => api.post('/websites', data);
export const updateWebsite = (id, data) => api.put(`/websites/${id}`, data);
export const deleteWebsite = (id) => api.delete(`/websites/${id}`);

// Test Runs
export const getTestRuns = (params) => api.get('/test-runs', { params });
export const getTestRun = (id) => api.get(`/test-runs/${id}`);
export const runSmokeTest = (websiteId) => api.post(`/run-test/smoke/${websiteId}`);
export const runPerformanceTest = (websiteId, device = 'desktop') =>
  api.post(`/run-test/performance/${websiteId}`, { device });
export const runPixelAudit = (websiteId) => api.post(`/run-test/pixel-audit/${websiteId}`);
export const runLoadTest = (websiteId, virtual_users = 10, duration_seconds = 30) =>
  api.post(`/run-test/load/${websiteId}`, { virtual_users, duration_seconds });
export const runAccessibilityTest = (websiteId) => api.post(`/run-test/accessibility/${websiteId}`);
export const runSecurityScan = (websiteId) => api.post(`/run-test/security/${websiteId}`);
export const runSEOAudit = (websiteId) => api.post(`/run-test/seo/${websiteId}`);
export const runVisualRegression = (websiteId, createBaseline = false) =>
  api.post(`/run-test/visual/${websiteId}`, { createBaseline });

// Reports
export const generateReport = (testRunId) =>
  api.get(`/test-runs/${testRunId}/report`, { responseType: 'blob' });

// Stats
export const getStats = () => api.get('/stats');
export const getHealth = () => api.get('/health');

export default api;
