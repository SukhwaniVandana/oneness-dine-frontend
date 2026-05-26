import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTables } from '../hooks/useTables';
import TableCard from '../components/tables/TableCard';
import TableSkeleton from '../components/tables/TableSkeleton';
import TableSessionDialog from '../components/tables/TableSessionDialog';
import Spinner from '../components/common/Spinner';
import { mapApiError } from '../components/common/ErrorHandler';
import { useToast } from '../components/common/Toast';
import styles from './TablesDashboard.module.css';

const FILTERS = [
  { key: 'ALL',      label: 'All Tables' },
  { key: 'OCCUPIED', label: 'Occupied'   },
  { key: 'FREE',     label: 'Available'  },
  { key: 'RESERVED', label: 'Reserved'   },
];

const SECTION_ICONS = {
  'HALL': '🏛️', 'GROUND FLOOR': '🪑', 'FIRST FLOOR': '🏢',
  'THEATER ROOMS': '🎭', 'ROOFTOP': '🌙', 'OUTDOOR': '🌿', 'BAR': '🍸',
};
function getSectionIcon(name) {
  if (!name) return '🍽️';
  const upper = name.toUpperCase();
  for (const key of Object.keys(SECTION_ICONS)) {
    if (upper.includes(key)) return SECTION_ICONS[key];
  }
  return '🍽️';
}

/*
  TABLE COLOR LOGIC (from v3 document):
  ─────────────────────────────────────
  WHITE  = tableStatus AVAILABLE (no active orders)
  YELLOW = OCCUPIED + any order in eating statuses
           {KOT_SENT, IN_PROGRESS, READY, SERVED}
  GREEN  = OCCUPIED + ALL orders have orderStatus = BILLED
           (bill generated, new group can be seated)

  SESSION DIALOG shown when:
  - Any order has orderStatus = BILLED (bill done)
  - OR multiple active sessions

  DIRECT NAV when:
  - Exactly 1 active order in eating status → go straight to order screen
*/
const EATING_STATUSES = ['KOT_SENT', 'IN_PROGRESS', 'READY', 'SERVED'];
const BILLED_STATUS   = 'BILLED';

export default function TablesDashboard() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [filter,        setFilter]        = useState('ALL');
  const [sessionDialog, setSessionDialog] = useState(null);

  const { data: tables, isLoading, isError, error, isFetching } = useTables();

  const counts = useMemo(() => {
    if (!Array.isArray(tables)) return {};
    return tables.reduce((acc, t) => {
      const s = t.tableStatus || 'FREE';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [tables]);

  const groupedSections = useMemo(() => {
    if (!Array.isArray(tables)) return [];
    const filtered = tables.filter(t => {
      if (filter === 'ALL')      return true;
      if (filter === 'FREE')     return t.tableStatus === 'FREE';
      if (filter === 'OCCUPIED') return t.tableStatus === 'OCCUPIED';
      if (filter === 'RESERVED') return t.tableStatus === 'RESERVED';
      return true;
    });
    const map = new Map();
    filtered.forEach(t => {
      const sec = t.sectionName || 'Other';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec).push(t);
    });
    return Array.from(map.entries()).map(([name, tbls]) => ({
      name, tables: tbls, icon: getSectionIcon(name),
      counts: tbls.reduce((acc, t) => {
        acc[t.tableStatus] = (acc[t.tableStatus] || 0) + 1;
        return acc;
      }, {}),
    }));
  }, [tables, filter]);

  function handleTableClick(table) {
    const status = table.tableStatus;

    /* FREE / RESERVED → new session directly */
    if (status === 'FREE' || status === 'AVAILABLE' || status === 'RESERVED') {
      navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&newSession=1`);
      return;
    }

    if (status === 'OCCUPIED') {
      const unsettled     = (table.activeOrders || []).filter(o => !o.isSettled);
      const eatingOrders  = unsettled.filter(o => EATING_STATUSES.includes(o.orderStatus));
      const billedOrders  = unsettled.filter(o => o.orderStatus === BILLED_STATUS);

      /* No active orders → treat as free */
      if (unsettled.length === 0) {
        navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&newSession=1`);
        return;
      }

      /* Exactly 1 eating order, no billed orders → go directly (people still ordering) */
      if (eatingOrders.length === 1 && billedOrders.length === 0) {
        navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&orderId=${eatingOrders[0].orderId}`);
        return;
      }

      /* Any billed order OR multiple sessions → show dialog */
      setSessionDialog({ table, orders: unsettled });
    }
  }

  function handleAddToExisting(order) {
    const { table } = sessionDialog;
    setSessionDialog(null);
    navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&orderId=${order.orderId}`);
  }

  function handleNewSession() {
    const { table } = sessionDialog;
    setSessionDialog(null);
    navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&newSession=1`);
  }

  if (isError) {
    const { title, message } = mapApiError(error);
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>{title}</div>
        <div className={styles.errorMsg}>{message}</div>
        <button className="btn btn-ghost" onClick={() => window.location.reload()}>↺ Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className="badge badge-amber">{counts.OCCUPIED ?? 0} Occupied</span>
          <span className="badge badge-green">{counts.FREE ?? 0} Free</span>
          <span className="badge badge-purple">{counts.RESERVED ?? 0} Reserved</span>
          <span className="badge" style={{ background:'var(--badge-blue-bg)', color:'var(--accent3)' }}>
            {Array.isArray(tables) ? tables.length : 0} Total
          </span>
        </div>
        <div className={styles.controls}>
          {isFetching && !isLoading ? (
            <div className={styles.syncRow}><Spinner size="sm" variant="amber" /><span className={styles.syncLabel}>Syncing...</span></div>
          ) : (
            <div className={styles.syncRow}><span className={styles.liveDot} /><span className={styles.syncLabel}>Live</span></div>
          )}
        </div>
      </div>

      <div className={styles.filterRow}>
        {FILTERS.map(f => (
          <button key={f.key}
            className={`${styles.filterTab} ${filter === f.key ? styles.active : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key !== 'ALL' && (
              <span className={styles.filterCount}>
                {f.key === 'FREE' ? (counts.FREE ?? 0) : (counts[f.key] ?? 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? <TableSkeleton count={12} /> :
        groupedSections.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🍽️</div>
            <div className={styles.emptyTitle}>No tables found</div>
            <div className={styles.emptyMsg}>
              {filter === 'ALL' ? 'No tables set up yet.' : 'No tables with this status.'}
            </div>
          </div>
        ) : (
          <div className={styles.sectionsWrap}>
            {groupedSections.map(section => (
              <div key={section.name} className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionLeft}>
                    <span className={styles.sectionIcon}>{section.icon}</span>
                    <span className={styles.sectionName}>{section.name}</span>
                    <span className={styles.sectionCount}>
                      {section.tables.length} table{section.tables.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.sectionBadges}>
                    {section.counts.OCCUPIED > 0 && <span className="badge badge-amber">{section.counts.OCCUPIED} Occupied</span>}
                    {section.counts.FREE     > 0 && <span className="badge badge-green">{section.counts.FREE} Free</span>}
                    {section.counts.RESERVED > 0 && <span className="badge badge-purple">{section.counts.RESERVED} Reserved</span>}
                  </div>
                </div>
                <div className={styles.sectionGrid}>
                  {section.tables.map(table => (
                    <TableCard key={table.id} table={table} onClick={() => handleTableClick(table)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {sessionDialog && (
        <TableSessionDialog
          table={sessionDialog.table}
          activeOrders={sessionDialog.orders}
          onAddToExisting={handleAddToExisting}
          onNewSession={handleNewSession}
          onClose={() => setSessionDialog(null)}
        />
      )}
    </div>
  );
}
