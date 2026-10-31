import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './KitchenLayout.module.css';

export default function KitchenLayout({ children }) {
  const { session, clearSession } = useAuth();
  const navigate = useNavigate();
  const [clock, setClock] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
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
      {/* ── SLIM HEADER ── */}
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.logo}>OD</div>
          <div className={styles.kitchenBadge}>KITCHEN</div>
          <span className={styles.branch}>{session?.branchName || ''}</span>
        </div>

        <div className={styles.spacer} />

        <span className={styles.clock}>{clock}</span>

        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          ⏻
        </button>
      </div>

      {/* ── FULLSCREEN CONTENT ── */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
