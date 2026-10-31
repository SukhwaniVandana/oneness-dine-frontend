import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './CaptainLayout.module.css';

export default function CaptainLayout({ children }) {
  const { session, clearSession } = useAuth();
  const navigate = useNavigate();
  const [clock, setClock] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.app}>
      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div className={styles.logo}>OD</div>
        <div className={styles.info}>
          <span className={styles.name}>{session?.fullName || session?.username || 'Captain'}</span>
          <span className={styles.branch}>{session?.branchName || ''}</span>
        </div>

        <div className={styles.spacer} />

        {/* Nav tabs */}
        <nav className={styles.nav}>
          <NavLink
            to="/tables"
            className={({ isActive }) =>
              `${styles.navBtn} ${isActive ? styles.navActive : ''}`
            }>
            <span className={styles.navIcon}>🪑</span>
            <span className={styles.navLabel}>Tables</span>
          </NavLink>
        </nav>

        <span className={styles.clock}>{clock}</span>

        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <span>⏻</span>
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
