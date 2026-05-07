import apiClient from './apiClient';

/* ─────────────────────────────────────────────────────
   Auth Service
   Maps to: /api/v1/auth  (AuthController.java)
───────────────────────────────────────────────────── */
const AuthService = {

  /* POST /api/v1/auth/login */
  login: (credentials) =>
    apiClient.post('/auth/login', credentials),

  /* POST /api/v1/auth/logout */
  logout: () =>
    apiClient.post('/auth/logout'),
};

export default AuthService;
