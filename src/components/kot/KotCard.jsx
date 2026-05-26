import { useState } from 'react';
import Spinner from '../common/Spinner';
import styles from './KotCard.module.css';

/*
  Status config — matching HTML prototype design:
  PENDING   → red header   → button "Start Preparing →"
  PREPARING → amber header → button "Mark Ready →"
  READY     → green header → button "Mark Served ✓"
  SERVED    → grey header  → no button
*/
const STATUS_CONFIG = {
  PENDING: {
    headerClass: styles.hdrPending,
    label:       'NEW ORDER',
    nextStatus:  'PREPARING',
    btnLabel:    'Start Preparing →',
    btnClass:    styles.btnPending,
  },
  PREPARING: {
    headerClass: styles.hdrPreparing,
    label:       'PREPARING',
    nextStatus:  'READY',
    btnLabel:    'Mark Ready →',
    btnClass:    styles.btnPreparing,
  },
  READY: {
    headerClass: styles.hdrReady,
    label:       'READY TO SERVE',
    nextStatus:  'SERVED',
    btnLabel:    'Mark Served ✓',
    btnClass:    styles.btnReady,
  },
  SERVED: {
    headerClass: styles.hdrServed,
    label:       'SERVED',
    nextStatus:  null,
    btnLabel:    null,
    btnClass:    null,
  },
};

export default function KotCard({ kot, onUpdateStatus, isUpdating }) {
  const [localLoading, setLocalLoading] = useState(false);

  const config     = STATUS_CONFIG[kot.displayStatus] || STATUS_CONFIG.PENDING;
  const hasBtn     = !!config.nextStatus;
  const elapsedMin = getElapsedMinutes(kot.createdAt);

  async function handleClick() {
    if (!config.nextStatus || localLoading) return;
    setLocalLoading(true);
    try {
      await onUpdateStatus(kot.id, config.nextStatus);
    } finally {
      setLocalLoading(false);
    }
  }

  return (
    <div className={styles.card}>

      {/* ── HEADER ── */}
      <div className={`${styles.header} ${config.headerClass}`}>
        <div>
          <div className={`${styles.tableNum} ${config.headerClass}`}>
            {kot.tableNumber || `Order #${kot.orderId}`}
          </div>
          <div className={styles.statusLabel}>{config.label}</div>
          <div className={styles.kotNum}>{kot.kotNumber}</div>
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.timer} ${config.headerClass}`}>
            ⏱ {elapsedMin}m
          </div>
          {kot.stationName && (
            <div className={styles.station}>{kot.stationName}</div>
          )}
        </div>
      </div>

      {/* ── ITEMS ── */}
      <div className={styles.items}>
        {(kot.items || []).map(item => (
          <div key={item.id} className={styles.item}>
            <span className={styles.qty}>{item.quantity}x</span>
            <span className={styles.itemName}>{item.itemName}</span>
            {item.specialInstruction && (
              <span className={styles.note} title={item.specialInstruction}>✏️</span>
            )}
          </div>
        ))}
      </div>

      {/* Special instructions summary */}
      {(kot.items || []).some(i => i.specialInstruction) && (
        <div className={styles.notes}>
          {(kot.items || [])
            .filter(i => i.specialInstruction)
            .map(i => (
              <div key={i.id} className={styles.noteRow}>
                <span className={styles.noteItem}>{i.itemName}:</span>
                <span className={styles.noteText}>{i.specialInstruction}</span>
              </div>
            ))}
        </div>
      )}

      {/* ── ACTION BUTTON ── */}
      {hasBtn && (
        <button
          className={`${styles.actionBtn} ${config.btnClass}`}
          onClick={handleClick}
          disabled={localLoading || isUpdating}
        >
          {localLoading
            ? <><Spinner size="sm" variant="dark" /> Updating...</>
            : config.btnLabel
          }
        </button>
      )}

      {/* SERVED — no button, just timestamp */}
      {!hasBtn && (
        <div className={styles.servedRow}>
          ✓ Served
        </div>
      )}
    </div>
  );
}

/* Helper: minutes elapsed since createdAt */
function getElapsedMinutes(createdAt) {
  if (!createdAt) return '—';
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diff < 60) return diff;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}
