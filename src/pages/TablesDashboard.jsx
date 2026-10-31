import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTables } from '../hooks/useTables';
import { useKots, useUpdateKotStatus } from '../hooks/useKot';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TableCard from '../components/tables/TableCard';
import TableSkeleton from '../components/tables/TableSkeleton';
import TableSessionDialog from '../components/tables/TableSessionDialog';
import ReadyKotsModal from '../components/tables/ReadyKotsModal';
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

const EATING_STATUSES = ['KOT_SENT', 'IN_PROGRESS', 'READY', 'SERVED'];
const BILLED_STATUS   = 'BILLED';

function getTableKotStatus(tableNumber, kots) {
  if (!tableNumber || !kots?.length) return null;
  const tableKots = kots.filter(
    k => k.tableNumber === tableNumber && k.displayStatus !== 'SERVED'
  );
  if (!tableKots.length) return null;
  const hasReady     = tableKots.some(k => k.displayStatus === 'READY');
  const hasPreparing = tableKots.some(
    k => k.displayStatus === 'PENDING' || k.displayStatus === 'PREPARING'
  );
  if (hasReady && hasPreparing) return 'BOTH';
  if (hasReady)                  return 'READY';
  if (hasPreparing)              return 'PREPARING';
  return null;
}

export default function TablesDashboard() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  useWebSocket(session?.branchId);
  const isCaptain = session?.roleName === 'CAPTAIN';

  const [filter,        setFilter]        = useState('ALL');
  const [sessionDialog, setSessionDialog] = useState(null);
  const [readyModal,    setReadyModal]    = useState(null);

  const { data: tables, isLoading, isError, error, isFetching } = useTables();
  const { data: kots = [] } = useKots();
  const updateStatus = useUpdateKotStatus();

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

    if (status === 'FREE' || status === 'AVAILABLE' || status === 'RESERVED') {
      navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&newSession=1`);
      return;
    }

    if (status === 'OCCUPIED') {
      const unsettled    = (table.activeOrders || []).filter(o => !o.isSettled);
      const eatingOrders = unsettled.filter(o => EATING_STATUSES.includes(o.orderStatus));
      const billedOrders = unsettled.filter(o => o.orderStatus === BILLED_STATUS);

      if (unsettled.length === 0) {
        navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&newSession=1`);
        return;
      }

      if (isCaptain) {
        const tableKots = kots.filter(k => k.tableNumber === table.tableNumber);
        const readyKots = tableKots.filter(k => k.displayStatus === 'READY');
        if (readyKots.length > 0) {
          setReadyModal({ table, kots: tableKots });
          return;
        }
        if (eatingOrders.length === 1 && billedOrders.length === 0) {
          navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&orderId=${eatingOrders[0].orderId}`);
          return;
        }
        setSessionDialog({ table, orders: unsettled });
        return;
      }

      if (eatingOrders.length === 1 && billedOrders.length === 0) {
        navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&orderId=${eatingOrders[0].orderId}`);
        return;
      }

      setSessionDialog({ table, orders: unsettled });
    }
  }

  async function handleMarkServed(kotId) {
    try {
      await updateStatus.mutateAsync({ kotId, displayStatus: 'SERVED' });
      const kot = kots.find(k => k.id === kotId);
      if (kot?.orderId) {
        try {
          await import('../services/apiClient')
            .then(m => m.default.patch(`/orders/${kot.orderId}/status`, {
              orderStatus: 'SERVED',
            }));
        } catch (_) { /* non-blocking */ }
      }
      toast.success('KOT marked served');

      if (readyModal) {
        const remaining = kots.filter(
          k => k.tableNumber === readyModal.table.tableNumber
            && k.displayStatus === 'READY'
            && k.id !== kotId
        );
        if (remaining.length === 0) setReadyModal(null);
      }
    } catch (err) {
      toast.error(mapApiError(err).message, 'Could not update KOT');
    }
  }

  function handlePayNow(table) {
    const billedOrder = (table.activeOrders || [])
      .find(o => o.orderStatus === 'BILLED' && !o.isSettled);
    if (!billedOrder) return;
    navigate(`/billing?orderId=${billedOrder.orderId}&tableNumber=${encodeURIComponent(table.tableNumber)}&tableId=${table.id}`);
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
          <span className="badge" style={{ background: 'var(--badge-blue-bg)', color: 'var(--accent3)' }}>
            {Array.isArray(tables) ? tables.length : 0} Total
          </span>
        </div>
        <div className={styles.controls}>
          {isFetching && !isLoading ? (
            <div className={styles.syncRow}><Spinner size="sm" variant="amber" /><span className={styles.syncLabel}>Syncing...</span></div>
          ) : (
            <div className={styles.syncRow}><span className={styles.liveDot} /><span className={styles.syncLabel}>Live</span></div>
          )}

          {/* Theme toggle — visible on all devices */}
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
                    {section.counts.FREE      > 0 && <span className="badge badge-green">{section.counts.FREE} Free</span>}
                    {section.counts.RESERVED  > 0 && <span className="badge badge-purple">{section.counts.RESERVED} Reserved</span>}
                  </div>
                </div>
                <div className={styles.sectionGrid}>
                  {section.tables.map(table => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onClick={() => handleTableClick(table)}
                      onPayNow={() => handlePayNow(table)}
                      kotStatus={getTableKotStatus(table.tableNumber, kots)}
                    />
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

      {readyModal && (
        <ReadyKotsModal
          tableNumber={readyModal.table.tableNumber}
          kots={readyModal.kots}
          onMarkServed={handleMarkServed}
          onAddItems={() => {
            const table = readyModal.table;
            const unsettled = (table.activeOrders || []).filter(o => !o.isSettled);
            const eatingOrders = unsettled.filter(o => EATING_STATUSES.includes(o.orderStatus));
            setReadyModal(null);
            if (eatingOrders.length === 1) {
              navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}&capacity=${table.capacity || 0}&orderId=${eatingOrders[0].orderId}`);
            } else {
              setSessionDialog({ table, orders: unsettled });
            }
          }}
          onClose={() => setReadyModal(null)}
          isUpdating={updateStatus.isPending}
        />
      )}
    </div>
  );
}
