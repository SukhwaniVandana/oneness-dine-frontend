import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './TitleBar.module.css';

const PAGE_NAMES = {
  '/tables':  'Table Dashboard',
  '/order':   'Order Taking',
  '/billing': 'Billing',
  '/bill':    'Bills',
  '/kot':     'Kitchen Display',
  '/reports': 'Reports',
  '/admin':   'Admin Panel',
};

export default function TitleBar() {
  const location  = useLocation();
  const { session } = useAuth();
  const [isMax, setIsMax] = useState(false);

  /* Only render in Electron */
  if (!window.electronAPI?.isElectron) return null;

  const pageName   = PAGE_NAMES[location.pathname] || 'ONENESS Dine';
  const branchName = session?.branchName || '';
  const branchCity = session?.branchCity || '';

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMax);
  }, []);

  async function handleMaximize() {
    await window.electronAPI.maximize();
    const max = await window.electronAPI.isMaximized();
    setIsMax(max);
  }

  return (
    <div className={styles.titleBar}>

      {/* Drag region — left side */}
      <div className={styles.dragLeft}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🍽️</span>
          <span className={styles.brandName}>ONENESS</span>
          <span className={styles.brandSub}>Dine</span>
        </div>

        {/* Separator */}
        <div className={styles.sep} />

        {/* Branch info */}
        {branchName && (
          <>
            <div className={styles.branch}>
              <span className={styles.branchName}>{branchName}</span>
              {branchCity && <span className={styles.branchCity}>{branchCity}</span>}
            </div>
            <div className={styles.sep} />
          </>
        )}

        {/* Current page */}
        <div className={styles.page}>{pageName}</div>
      </div>

      {/* Window controls — right side (not draggable) */}
      <div className={styles.controls}>
        <button
          className={`${styles.ctrl} ${styles.ctrlMin}`}
          onClick={window.electronAPI.minimize}
          title="Minimize">
          <span>─</span>
        </button>
        <button
          className={`${styles.ctrl} ${styles.ctrlMax}`}
          onClick={handleMaximize}
          title={isMax ? 'Restore' : 'Maximize'}>
          <span>{isMax ? '❐' : '□'}</span>
        </button>
        <button
          className={`${styles.ctrl} ${styles.ctrlClose}`}
          onClick={window.electronAPI.close}
          title="Close">
          <span>✕</span>
        </button>
      </div>
    </div>
  );
}
