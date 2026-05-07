import { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext();

let toastId = 0;

/* ── ICONS ── */
const icons = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

/* ─────────────────────────────────────────────
   Single Toast item
───────────────────────────────────────────── */
function ToastItem({ toast, onRemove }) {
  return (
    <div className={`${styles.toast} ${styles[toast.type]} ${styles.enter}`}>
      <span className={styles.icon}>{icons[toast.type]}</span>
      <div className={styles.body}>
        {toast.title && <div className={styles.title}>{toast.title}</div>}
        <div className={styles.message}>{toast.message}</div>
      </div>
      <button className={styles.close} onClick={() => onRemove(toast.id)}>✕</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ToastProvider — wrap around <App />
───────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  /* Convenience methods */
  const toast = {
    success: (message, title)  => add({ type: 'success', message, title }),
    error:   (message, title)  => add({ type: 'error',   message, title, duration: 6000 }),
    warning: (message, title)  => add({ type: 'warning', message, title }),
    info:    (message, title)  => add({ type: 'info',    message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
