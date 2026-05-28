import { useEffect } from 'react';
import styles from './ConfirmDialog.module.css';

/*
 * ConfirmDialog — reusable styled confirm modal
 * Replaces window.confirm() everywhere in the app
 *
 * Props:
 *   isOpen       — bool
 *   title        — string
 *   message      — string
 *   confirmLabel — string (default: "Confirm")
 *   cancelLabel  — string (default: "Cancel")
 *   variant      — 'danger' | 'warning' | 'info' (default: 'warning')
 *   onConfirm    — () => void
 *   onCancel     — () => void
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'warning',
  onConfirm,
  onCancel,
}) {
  /* Close on Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = e => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const icons = { danger: '🚫', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.dialog} ${styles[variant]}`}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className={styles.icon}>{icons[variant]}</div>
        <div className={styles.body}>
          {title && <div className={styles.title}>{title}</div>}
          {message && <div className={styles.message}>{message}</div>}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${styles[`confirm_${variant}`]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
