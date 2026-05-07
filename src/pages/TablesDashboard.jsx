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

/* Section icon mapping */
const SECTION_ICONS = {
  'HALL':          '🏛️',
  'GROUND FLOOR':  '🪑',
  'FIRST FLOOR':   '🏢',
  'THEATER ROOMS': '🎭',
  'ROOFTOP':       '🌙',
  'OUTDOOR':       '🌿',
  'BAR':           '🍸',
};

function getSectionIcon(name) {
  if (!name) return '🍽️';
  const upper = name.toUpperCase();
  for (const key of Object.keys(SECTION_ICONS)) {
    if (upper.includes(key)) return SECTION_ICONS[key];
  }
  return '🍽️';
}

export default function TablesDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const { data: tables, isLoading, isError, error, isFetching } = useTables();

  /* Derive summary counts */
  const counts = useMemo(() => {
    if (!Array.isArray(tables)) return {};
    return tables.reduce((acc, t) => {
      const s = t.tableStatus || 'FREE';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [tables]);

  /* Group tables by section, respecting filter */
  const groupedSections = useMemo(() => {
    if (!Array.isArray(tables)) return [];

    const filtered = tables.filter(t =>
      filter === 'ALL' || t.tableStatus === filter
    );

    /* Collect unique sections preserving order */
    const sectionMap = new Map();
    filtered.forEach(t => {
      const sec = t.sectionName || 'Other';
      if (!sectionMap.has(sec)) sectionMap.set(sec, []);
      sectionMap.get(sec).push(t);
    });

    return Array.from(sectionMap.entries()).map(([name, tables]) => ({
      name,
      tables,
      icon: getSectionIcon(name),
      counts: tables.reduce((acc, t) => {
        acc[t.tableStatus] = (acc[t.tableStatus] || 0) + 1;
        return acc;
      }, {}),
    }));
  }, [tables, filter]);

  /* Error state */
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

  /* Handle table tap */
  function handleTableClick(table) {
    if (table.tableStatus === 'BILLING') {
      navigate(`/billing?tableId=${table.id}`);
    } else {
      navigate(`/order?tableId=${table.id}&tableNumber=${encodeURIComponent(table.tableNumber)}`);
    }
  }

  const totalTables = Array.isArray(tables) ? tables.length : 0;

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className="badge badge-amber">{counts.OCCUPIED ?? 0} Occupied</span>
          <span className="badge badge-green">{counts.FREE ?? 0} Free</span>
          <span className="badge badge-purple">{counts.RESERVED ?? 0} Reserved</span>
          <span className="badge badge-red">{counts.BILLING ?? 0} Billing</span>
          <span className="badge" style={{ background: 'var(--badge-blue-bg)', color: 'var(--accent3)' }}>
            {totalTables} Total
          </span>
        </div>

        <div className={styles.controls}>
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

      {/* ── CONTENT ── */}
      {isLoading ? (
        <TableSkeleton count={12} />
      ) : groupedSections.length === 0 ? (
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
        <div className={styles.sectionsWrap}>
          {groupedSections.map(section => (
            <div key={section.name} className={styles.sectionBlock}>

              {/* Section header */}
              <div className={styles.sectionHeader}>
                <div className={styles.sectionLeft}>
                  <span className={styles.sectionIcon}>{section.icon}</span>
                  <span className={styles.sectionName}>{section.name}</span>
                  <span className={styles.sectionCount}>
                    {section.tables.length} table{section.tables.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.sectionBadges}>
                  {section.counts.OCCUPIED > 0 && (
                    <span className="badge badge-amber">{section.counts.OCCUPIED} Occupied</span>
                  )}
                  {section.counts.FREE > 0 && (
                    <span className="badge badge-green">{section.counts.FREE} Free</span>
                  )}
                  {section.counts.RESERVED > 0 && (
                    <span className="badge badge-purple">{section.counts.RESERVED} Reserved</span>
                  )}
                  {section.counts.BILLING > 0 && (
                    <span className="badge badge-red">{section.counts.BILLING} Billing</span>
                  )}
                </div>
              </div>

              {/* Table cards grid */}
              <div className={styles.sectionGrid}>
                {section.tables.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onClick={() => handleTableClick(table)}
                  />
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
