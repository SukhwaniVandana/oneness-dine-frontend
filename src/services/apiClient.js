import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach JWT */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('od-token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* P1 FIX: On 401 → clear ALL keys and redirect to login */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('od-token');
      localStorage.removeItem('od-session');   // AuthContext session key
      localStorage.removeItem('od-theme');     // optional, keep theme
      window.location.replace('/login');        // replace so back button doesn't return
    }
    return Promise.reject(error);
  }
);

export default apiClient;
