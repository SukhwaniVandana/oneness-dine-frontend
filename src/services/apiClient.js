import axios from 'axios';

/* ─────────────────────────────────────────────────────
   Central Axios instance for ONENESS Dine
   Base URL → Spring Boot at localhost:8080/api/v1
───────────────────────────────────────────────────── */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── REQUEST INTERCEPTOR — attach JWT from real login ── */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('od-token');
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
      /* Clear session and redirect to login */
      localStorage.removeItem('od-token');
      localStorage.removeItem('od-session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
