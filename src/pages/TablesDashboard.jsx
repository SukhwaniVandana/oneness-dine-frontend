import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTables } from '../hooks/useTables';
import TableCard from '../components/tables/TableCard';
import TableSkeleton from '../components/tables/TableSkeleton';
import Spinner from '../components/common/Spinner';
import { mapApiError } from '../components/common/ErrorHandler';
import styles from './TablesDashboard.module.css';

const FILTERS = [
  { key: 'ALL',      label: 'All Tables' },
  { key: 'OCCUPIED', label: 'Occupied'   },
  { key: 'FREE',     label: 'Available'  },
  { key: 'RESERVED', label: 'Reserved'   },
  { key: 'BILLING',  label: 'Billing'    },
];

export default function TablesDashboard() {
  const navigate = useNavigate();
  const [filter,  setFilter]  = useState('ALL');
  const [section, setSection] = useState('All Sections');

  /* ── Data fetching ── */
  const { data: tables, isLoading, isError, error, isFetching } = useTables();

  /* ── Derive summary counts from actual data ── */
  const counts = useMemo(() => {
    if (!Array.isArray(tables)) return {};
    return tables.reduce((acc, t) => {
      const s = t.tableStatus || 'FREE';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [tables]);

  /* ── Derive unique sections from actual data ── */
  const sections = useMemo(() => {
    if (!Array.isArray(tables)) return ['All Sections'];
    const unique = [...new Set(tables.map(t => t.sectionName).filter(Boolean))];
    return ['All Sections', ...unique.sort()];
  }, [tables]);

  /* ── Filter tables ── */
  const filtered = useMemo(() => {
    if (!Array.isArray(tables)) return [];
    return tables.filter(t => {
      const statusMatch  = filter === 'ALL' || t.tableStatus === filter;
      const sectionMatch = section === 'All Sections' || t.sectionName === section;
      return statusMatch && sectionMatch;
    });
  }, [tables, filter, section]);

  /* ── Error state ── */
  if (isError) {
    const { title, message } = mapApiError(error);
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>{title}</div>
        <div className={styles.errorMsg}>{message}</div>
        <button className="btn btn-ghost" onClick={() => window.location.reload()}>
          ↺ Retry
        </button>
      </div>
    );
  }

  /* ── Handle table tap ── */
  function handleTableClick(table) {
    if (table.tableStatus === 'BILLING') {
      navigate(`/billing?tableId=${table.id}`);
    } else {
      navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}`);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── HEADER ROW ── */}
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className="badge badge-amber">
            {counts.OCCUPIED ?? 0} Occupied
          </span>
          <span className="badge badge-green">
            {counts.FREE ?? 0} Free
          </span>
          <span className="badge badge-purple">
            {counts.RESERVED ?? 0} Reserved
          </span>
          <span className="badge badge-red">
            {counts.BILLING ?? 0} Billing
          </span>
          <span className="badge" style={{ background: 'var(--badge-blue-bg)', color: 'var(--accent3)' }}>
            {Array.isArray(tables) ? tables.length : 0} Total
          </span>
        </div>

        <div className={styles.controls}>
          {/* Dynamic section selector */}
          <select
            className={styles.sectionSelect}
            value={section}
            onChange={e => setSection(e.target.value)}
          >
            {sections.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Background sync indicator */}
          {isFetching && !isLoading && (
            <div className={styles.syncRow}>
              <Spinner size="sm" variant="amber" />
              <span className={styles.syncLabel}>Syncing...</span>
            </div>
          )}
          {!isFetching && (
            <div className={styles.syncRow}>
              <span className={styles.liveDot} />
              <span className={styles.syncLabel}>Live</span>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className={styles.filterRow}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`${styles.filterTab} ${filter === f.key ? styles.active : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span className={styles.filterCount}>{counts[f.key] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TABLE GRID ── */}
      {isLoading ? (
        <TableSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍽️</div>
          <div className={styles.emptyTitle}>No tables found</div>
          <div className={styles.emptyMsg}>
            {filter === 'ALL'
              ? 'No tables have been set up yet.'
              : `No ${filter.toLowerCase()} tables right now.`}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(table => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => handleTableClick(table)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
