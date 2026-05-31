import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';

const NAV = [
  { to: '/tables',  icon: '🍽️', label: 'Tables',  alwaysShow: true  },
  { to: '/order',   icon: '📋', label: 'Order',   alwaysShow: false }, // hidden — access via table tap only
  { to: '/kot',     icon: '👨‍🍳', label: 'KOT',     alwaysShow: true  },
  { to: '/bill', icon: '💳', label: 'Bill',    alwaysShow: true  },
  { to: '/reports', icon: '📊', label: 'Reports', alwaysShow: true  },
  { to: '/admin',   icon: '⚙️', label: 'Admin',   alwaysShow: true  },
];

const SCREEN_TITLES = {
  '/tables':  'Table Dashboard',
  '/order':   'New Order',
  '/kot':     'Kitchen Display (KOT)',
  '/billing': 'Billing',
  '/bill':    'Bills',
  '/reports': 'Reports Dashboard',
  '/admin':   'Admin Panel',
  '/login':   'Login',
};

export default function AppLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { session, clearSession } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [time, setTime] = useState('');

  const title = SCREEN_TITLES[location.pathname] || 'ONENESS Dine';

  /* Clock */
  useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* On Order screen, show table number in title */
  const isOrderScreen = location.pathname === '/order';
  const tableNumber   = isOrderScreen
    ? decodeURIComponent(new URLSearchParams(location.search).get('tableNumber') || '')
    : '';
  const displayTitle  = isOrderScreen && tableNumber
    ? `Order — ${tableNumber}`
    : title;

  return (
    <div className={styles.app}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>OD</div>

        {NAV
          /* POINT 2: Hide Order link from sidebar — accessible only via table tap */
          .filter(item => item.alwaysShow)
          .map(item => (
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout button at bottom */}
        <button
          className={styles.navBtn}
          onClick={() => { clearSession(); navigate('/login'); }}
          title="Logout"
        >
          <span className={styles.navIcon}>🚪</span>
          <span className={styles.navLabel}>Logout</span>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>{displayTitle}</span>
          <span className={styles.topbarSub}>
            {session?.branchName || 'Diet Delight, Kolhapur'}
          </span>
          <div className={styles.spacer} />
          <span className="badge badge-green">● Live</span>
          <span className={styles.clock}>{time}</span>

          {/* Theme toggle */}
          <button className={styles.modeToggle} onClick={toggleTheme}>
            <div className={styles.toggleTrack}>
              <div className={styles.toggleThumb} />
            </div>
            <span className={styles.modeLabel}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </header>

        {/* CONTENT */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
