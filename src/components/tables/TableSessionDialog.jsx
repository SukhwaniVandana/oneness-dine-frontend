import styles from './TableSessionDialog.module.css';

/*
  TableSessionDialog
  Shown when captain taps OCCUPIED table that has:
  - Any order with orderStatus = BILLED (bill generated)
  - OR multiple active sessions
*/
export default function TableSessionDialog({
  table,
  activeOrders = [],
  onAddToExisting,
  onNewSession,
  onClose,
}) {
  const STATUS_LABELS = {
    KOT_SENT:    { label: 'Ordering',  color: 'var(--accent)'  },
    IN_PROGRESS: { label: 'Preparing', color: 'var(--accent3)' },
    READY:       { label: 'Ready',     color: 'var(--accent2)' },
    SERVED:      { label: 'Served',    color: 'var(--text3)'   },
    BILLED:      { label: 'Bill Done', color: 'var(--accent2)' },
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <div className={styles.tableNum}>{table.tableNumber}</div>
          <div className={styles.subtitle}>
            {table.sectionName} · {table.capacity} covers
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {activeOrders.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Active Sessions</div>
            {activeOrders.map(order => {
              const meta = STATUS_LABELS[order.orderStatus] || { label: order.orderStatus, color: 'var(--text3)' };
              return (
                <button
                  key={order.orderId}
                  className={styles.sessionBtn}
                  onClick={() => onAddToExisting(order)}
                >
                  <div className={styles.sessionLeft}>
                    <div className={styles.sessionTag}>{order.orderSessionTag}</div>
                    <div className={styles.sessionMeta}>
                      {order.paxCount} covers
                      {order.waiterName && ` · ${order.waiterName}`}
                    </div>
                    <div className={styles.sessionStatus}>
                      <span style={{ color: meta.color, fontWeight: 600 }}>
                        ● {meta.label}
                      </span>
                      {order.itemCount > 0 && (
                        <span className={styles.itemCount}> · {order.itemCount} items</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.sessionRight}>
                    <SessionTimer startedAt={order.sessionStartedAt} className={styles.timer} />
                    <div className={styles.addLabel}>
                      {order.orderStatus === 'BILLED' ? 'Settle →' : 'Add items →'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.section}>
          <button className={styles.newSessionBtn} onClick={onNewSession}>
            <div className={styles.newIcon}>＋</div>
            <div>
              <div className={styles.newLabel}>New Session</div>
              <div className={styles.newMeta}>
                Start fresh order for new group on this table
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}

/* Inline timer for session dialog */
function SessionTimer({ startedAt, className }) {
  const { useState, useEffect } = require('react');
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startedAt) return;
    const compute = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      setElapsed(`⏱ ${h}:${m}`);
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className={className}>{elapsed}</span>;
}
