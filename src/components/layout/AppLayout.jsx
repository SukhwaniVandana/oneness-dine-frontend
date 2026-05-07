import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import styles from './AppLayout.module.css';

const NAV = [
  { to: '/tables',  icon: '🍽️', label: 'Tables'  },
  { to: '/order',   icon: '📋', label: 'Order'   },
  { to: '/kot',     icon: '👨‍🍳', label: 'KOT'     },
  { to: '/billing', icon: '💳', label: 'Bill'    },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/admin',   icon: '⚙️', label: 'Admin'   },
];

const SCREEN_TITLES = {
  '/tables':  'Table Dashboard',
  '/order':   'New Order',
  '/kot':     'Kitchen Display (KOT)',
  '/billing': 'Billing',
  '/reports': 'Reports Dashboard',
  '/admin':   'Admin Panel',
  '/login':   'Login',
};

export default function AppLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const title = SCREEN_TITLES[location.pathname] || 'ONENESS Dine';

  /* Live clock */
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.app}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>OD</div>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navBtn} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </aside>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>{title}</span>
          <span className={styles.topbarSub}>Diet Delight, Kolhapur</span>
          <div className={styles.spacer} />
          <span className="badge badge-green">● Live</span>
          <span className={styles.clock}>{time}</span>

          {/* Theme toggle */}
          <button className={styles.modeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            <div className={styles.toggleTrack}>
              <div className={styles.toggleThumb} />
            </div>
            <span className={styles.modeLabel}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </header>

        {/* SCREEN CONTENT */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* useState + useEffect imported at top — adding here for completeness */
import { useState, useEffect } from 'react';
