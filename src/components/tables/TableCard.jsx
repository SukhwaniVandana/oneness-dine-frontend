import SessionTimer from '../common/SessionTimer';
import styles from './TableCard.module.css';

/*
  COLOR STATES — all via CSS variables (tokens.css):
  TEAL   = AVAILABLE  — "Green signal, seat new group"
  AMBER  = OCCUPIED   — "Busy, people eating/ordering"
  BLUE   = BILL READY — "Bill generated, collect payment"
  PURPLE = RESERVED

  kotStatus — computed by TablesDashboard from the KOT list:
    'READY'     — at least one KOT is READY (captain must serve)
    'PREPARING' — KOTs exist but none are READY yet
    null        — no active KOTs
*/
const EATING_STATUSES = ['KOT_SENT', 'IN_PROGRESS', 'READY', 'SERVED'];

export default function TableCard({ table, onClick, onPayNow, kotStatus }) {
  const status = (table.tableStatus || 'FREE').toUpperCase();
  const activeOrders = (table.activeOrders || []).filter(o => !o.isSettled);

  const eatingOrders = activeOrders.filter(o => EATING_STATUSES.includes(o.orderStatus));
  const allBilled = activeOrders.length > 0
    && eatingOrders.length === 0
    && activeOrders.every(o => o.orderStatus === 'BILLED');
  const sessionCount = activeOrders.length;

  const earliest = [...activeOrders]
    .sort((a, b) => new Date(a.sessionStartedAt) - new Date(b.sessionStartedAt))[0];

  const isBilled   = status === 'OCCUPIED' && allBilled;
  const isOccupied = status === 'OCCUPIED' && !allBilled;
  const isFree     = status === 'FREE' || status === 'AVAILABLE';
  const isReserved = status === 'RESERVED';

  /* CSS classes — use variables only, no hardcoded colors */
  const cardClass = isBilled   ? styles.billed   :
                    isOccupied ? styles.occupied  :
                    isReserved ? styles.reserved  :
                    isFree     ? styles.free      : styles.blocked;

  const dotClass  = isBilled   ? styles.dotBlue   :
                    isOccupied ? styles.dotAmber   :
                    isReserved ? styles.dotPurple  :
                    isFree     ? styles.dotTeal    : styles.dotGrey;

  /* Text colors — from CSS variables per state */
  const numColor   = isBilled   ? 'var(--tbl-bill-text)' :
                     isOccupied ? 'var(--tbl-occ-text)'  :
                     isReserved ? 'var(--tbl-res-text)'  :
                     isFree     ? 'var(--tbl-free-text)' : 'var(--text2)';

  const labelColor = 'var(--text3)';
  const timerColor = isBilled ? 'var(--tbl-bill-text)' : 'var(--tbl-occ-text)';
  const subColor   = isBilled   ? 'var(--tbl-bill-text)' :
                     isOccupied ? 'var(--tbl-occ-text)'  :
                     isReserved ? 'var(--tbl-res-text)'  :
                     isFree     ? 'var(--tbl-free-text)' : 'var(--text3)';

  const stateLabel = isBilled   ? 'Bill Ready' :
                     isOccupied ? 'Occupied'   :
                     isReserved ? 'Reserved'   :
                     isFree     ? 'Available'  : status;

  return (
    <div
      className={`${styles.card} ${cardClass}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`${table.tableNumber}, ${stateLabel}`}
    >
      <span className={`${styles.dot} ${dotClass}`} />

      {sessionCount > 1 && (
        <span className={styles.sessionBadge}>{sessionCount}</span>
      )}

      <div className={styles.tableNum} style={{ color: numColor }}>
        {table.tableNumber}
      </div>

      <div className={styles.tableLabel} style={{ color: labelColor }}>
        {stateLabel}
      </div>

      {(isOccupied || isBilled) && earliest?.sessionStartedAt && (
        <SessionTimer
          startedAt={earliest.sessionStartedAt}
          className={styles.timer}
          style={{ color: timerColor }}
        />
      )}

      <div className={styles.covers} style={{ color: subColor }}>
        👥 {table.capacity ?? '—'} covers
        {earliest?.paxCount ? ` · ${earliest.paxCount} seated` : ''}
      </div>

      {earliest?.itemCount > 0 && (
        <div className={styles.itemCount} style={{ color: subColor }}>
          🍽️ {earliest.itemCount} items
        </div>
      )}

      {isBilled && (
        <button
          className={styles.payBadge}
          onClick={e => { e.stopPropagation(); onPayNow?.(); }}
        >
          🧾 Pay now
        </button>
      )}

      {/* ── KOT STATUS BADGES (shown for occupied tables with active KOTs) ── */}
      {isOccupied && kotStatus && (
        <div className={styles.kotBadgeRow}>
          {kotStatus === 'READY' && (
            <span className={styles.kotBadgeReady}>🟢 Ready</span>
          )}
          {kotStatus === 'PREPARING' && (
            <span className={styles.kotBadgePreparing}>🟡 Preparing</span>
          )}
          {kotStatus === 'BOTH' && (
            <>
              <span className={styles.kotBadgePreparing}>🟡 Preparing</span>
              <span className={styles.kotBadgeReady}>🟢 Ready</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
