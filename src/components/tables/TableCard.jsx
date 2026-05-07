import SessionTimer from '../common/SessionTimer';
import styles from './TableCard.module.css';

/**
 * TableCard
 *
 * Real API fields (from backend response):
 *   table.id
 *   table.tableNumber     — e.g. "Table-1"
 *   table.tableStatus     — "FREE" | "OCCUPIED" | "RESERVED" | "BILLING"
 *                           (normalized from "AVAILABLE" by useTables hook)
 *   table.capacity        — number of covers
 *   table.sectionName     — e.g. "Hall"
 *   table.sessionStartedAt — ISO string, present when OCCUPIED/BILLING
 *   table.runningAmount   — number, present when OCCUPIED/BILLING
 *   table.waiterName      — assigned waiter, nullable
 */
export default function TableCard({ table, onClick }) {
  const status = (table.tableStatus || 'FREE').toUpperCase();

  const statusLabel = {
    OCCUPIED: 'Occupied',
    FREE:     'Available',
    RESERVED: 'Reserved',
    BILLING:  'Billing',
  }[status] || status;

  const dotClass = {
    OCCUPIED: styles.dotAmber,
    FREE:     styles.dotGreen,
    RESERVED: styles.dotPurple,
    BILLING:  styles.dotRed,
  }[status] || styles.dotGreen;

  const numClass = {
    OCCUPIED: styles.numOccupied,
    FREE:     styles.numFree,
    RESERVED: styles.numReserved,
    BILLING:  styles.numBilling,
  }[status] || styles.numFree;

  const timerClass = status === 'BILLING' ? styles.timerRed : styles.timerAmber;

  return (
    <div
      className={`${styles.card} ${styles[status.toLowerCase()]}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`${table.tableNumber}, ${statusLabel}`}
    >
      {/* Status dot */}
      <span className={`${styles.dot} ${dotClass}`} />

      {/* Table number */}
      <div className={`${styles.tableNum} ${numClass}`}>
        {table.tableNumber}
      </div>

      {/* Section name */}
      <div className={styles.tableLabel}>
        {table.sectionName || statusLabel}
      </div>

      {/* Live session timer — OCCUPIED or BILLING */}
      {(status === 'OCCUPIED' || status === 'BILLING') && table.sessionStartedAt && (
        <SessionTimer
          startedAt={table.sessionStartedAt}
          className={`${styles.timer} ${timerClass}`}
        />
      )}

      {/* Static status label when no timer */}
      {(status === 'OCCUPIED' || status === 'BILLING') && !table.sessionStartedAt && (
        <div className={`${styles.timer} ${timerClass}`}>{statusLabel}</div>
      )}

      {/* Reserved time */}
      {status === 'RESERVED' && table.reservedAt && (
        <div className={styles.timerPurple}>📅 {table.reservedAt}</div>
      )}

      {/* Capacity */}
      <div className={styles.covers}>
        👥 {table.capacity ?? '—'} covers
      </div>

      {/* Waiter name if assigned */}
      {table.waiterName && (
        <div className={styles.waiter}>👤 {table.waiterName}</div>
      )}

      {/* Running amount */}
      {table.runningAmount != null && table.runningAmount > 0 && (
        <div className={styles.amount}>
          ₹ {Number(table.runningAmount).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
}
