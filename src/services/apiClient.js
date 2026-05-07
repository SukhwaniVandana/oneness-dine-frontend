import axios from 'axios';

/* ─────────────────────────────────────────
   Central Axios instance for ONENESS Dine
   Base URL → Spring Boot at localhost:8080
   All requests auto-attach JWT from storage
───────────────────────────────────────── */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── REQUEST INTERCEPTOR — attach JWT ── */
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('od-token') ||          // real token after login
      process.env.REACT_APP_DEV_TOKEN ||            // temp token from .env during dev
      null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── RESPONSE INTERCEPTOR — handle 401 ── */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('od-token');
      localStorage.removeItem('od-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;