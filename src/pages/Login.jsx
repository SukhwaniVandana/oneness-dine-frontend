import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthService from '../services/authService';
import { mapApiError } from '../components/common/ErrorHandler';
import { getRoleHome } from '../config/roles';
import styles from './Login.module.css';

/* ── Terminal options for Diet Delight ── */
const TERMINALS = ['TERMINAL-1', 'TERMINAL-2', 'TERMINAL-3'];

export default function Login() {
  const navigate     = useNavigate();
  const { saveSession } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* Form state */
  const [form, setForm] = useState({
    username:     '',
    password:     '',
    terminalId:   'TERMINAL-1',
    deviceType:   'DESKTOP',
    screenNumber: 1,
  });

  /* UI state */
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [showPass,  setShowPass]  = useState(false);

  /* Field change */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // clear error on type
  }

  /* Validation */
  function validate() {
    if (!form.username.trim()) return 'Username is required.';
    if (!form.password.trim()) return 'Password is required.';
    if (form.password.length < 4) return 'Password is too short.';
    return null;
  }

  /* Submit */
  async function handleLogin(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    try {
      const res = await AuthService.login({
        username:     form.username.trim(),
        password:     form.password,
        terminalId:   form.terminalId,
        deviceType:   form.deviceType,
        screenNumber: Number(form.screenNumber),
      });

      /* Unwrap — backend: { success, message, data: { accessToken, ... } } */
      const data = res.data?.data || res.data;

      if (!data?.accessToken) {
        setError('Login failed. Please check your credentials.');
        return;
      }

      /* Save session — token goes to localStorage for apiClient */
      saveSession(data);

      /* Role-based redirect */
      navigate(getRoleHome(data.roleName), { replace: true });

    } catch (err) {
      const { message } = mapApiError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── THEME TOGGLE ── */}
      <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── LOGIN CARD ── */}
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logo}>OD</div>
          <div>
            <div className={styles.appName}>ONENESS Dine</div>
            <div className={styles.branchName}>Diet Delight · Kolhapur</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.welcomeText}>Welcome back</div>
        <div className={styles.subText}>Sign in to continue to your POS</div>

        {/* ── FORM ── */}
        <form onSubmit={handleLogin} className={styles.form} noValidate>

          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                className={styles.input}
                type="text"
                name="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Device Type */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Device Type</label>
            <select
              className={styles.select}
              name="deviceType"
              value={form.deviceType}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="DESKTOP">🖥 Desktop / Laptop</option>
              <option value="CAPTAIN_APP">📱 Mobile (Captain)</option>
              <option value="KITCHEN_TABLET">📟 Tablet (Kitchen)</option>
            </select>
          </div>

          {/* Terminal + Screen row */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Terminal</label>
              <select
                className={styles.select}
                name="terminalId"
                value={form.terminalId}
                onChange={handleChange}
                disabled={isLoading}
              >
                {TERMINALS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Screen #</label>
              <select
                className={styles.select}
                name="screenNumber"
                value={form.screenNumber}
                onChange={handleChange}
                disabled={isLoading}
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>Screen {n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={styles.loginBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Signing in...
              </>
            ) : (
              'Sign In →'
            )}
          </button>

        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <span>ONENESS-ERP</span>
          <span className={styles.dot}>·</span>
          <span>v1.0.0</span>
          <span className={styles.dot}>·</span>
          <span>JWT Secured</span>
        </div>

      </div>
    </div>
  );
}
