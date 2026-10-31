import { useState, useMemo } from 'react';
import { useKots, useUpdateKotStatus } from '../hooks/useKot';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../components/common/Toast';
import { mapApiError } from '../components/common/ErrorHandler';
import KotCard from '../components/kot/KotCard';
import KotSkeleton from '../components/kot/KotSkeleton';
import PrepSummaryPanel from '../components/kot/PrepSummaryPanel';
import Spinner from '../components/common/Spinner';
import styles from './KotScreen.module.css';

const TABS = [
  { key: 'ALL', label: 'All', color: 'var(--text2)' },
  { key: 'PENDING', label: 'Pending', color: 'var(--accent4)' },
  { key: 'PREPARING', label: 'Preparing', color: 'var(--accent)' },
  { key: 'READY', label: 'Ready', color: 'var(--accent2)' },
  { key: 'SERVED', label: 'Served', color: 'var(--text3)' },
];

export default function KotScreen() {
  useWebSocket(session?.branchId);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('ALL');

  const { data: kots = [], isLoading, isFetching, isError, error } = useKots();
  const updateStatus = useUpdateKotStatus();

  /* Filter by tab ALL = everything except settled orders Individual tabs = exact match */
  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return kots; // show everything
    return kots.filter(k => k.displayStatus === activeTab);
  }, [kots, activeTab]);

  /* Count per status */
  const counts = useMemo(() =>
    kots.reduce((acc, k) => {
      acc[k.displayStatus] = (acc[k.displayStatus] || 0) + 1;
      return acc;
    }, {}),
    [kots]
  );

  async function handleStatusUpdate(kotId, nextStatus) {
    try {
      await updateStatus.mutateAsync({ kotId, displayStatus: nextStatus });
      // When KOT is served, also mark the order as served
      if (nextStatus === 'SERVED') {
        const kot = kots.find(k => k.id === kotId);
        if (kot?.orderId) {
          try {
            await import('../services/apiClient')
              .then(m => m.default.patch(`/orders/${kot.orderId}/status`, {
                orderStatus: 'SERVED',
              }));
          } catch (_) { /* non-blocking — KOT served is the primary action */ }
        }
      }
      toast.success(`KOT marked ${nextStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(mapApiError(err).message, 'Could not update KOT');
    }
  }

  if (isError) {
    const { title, message } = mapApiError(error);
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>{title}</div>
        <div className={styles.errorMsg}>{message}</div>
        <button onClick={() => window.location.reload()}>↺ Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* LEFT: KOT grid + tabs */}
      <div className={styles.left}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badges}>
            {counts.PENDING > 0 && <span className="badge badge-red">🔴 {counts.PENDING} Pending</span>}
            {counts.PREPARING > 0 && <span className="badge badge-amber">🟡 {counts.PREPARING} Preparing</span>}
            {counts.READY > 0 && <span className="badge badge-green">🟢 {counts.READY} Ready</span>}
          </div>
          <div className={styles.syncRow}>
            {isFetching && !isLoading
              ? <><Spinner size="sm" variant="amber" /><span className={styles.syncLabel}>Syncing...</span></>
              : <><span className={styles.liveDot} /><span className={styles.syncLabel}>Auto-refresh 15s</span></>
            }
          </div>
        </div>

        {/* Status tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={activeTab === tab.key ? { color: tab.color, borderColor: tab.color } : {}}
            >
              {tab.label}
              {tab.key !== 'ALL' && counts[tab.key] > 0 && (
                <span className={styles.tabCount}
                  style={activeTab === tab.key ? { background: tab.color, color: '#fff' } : {}}>
                  {counts[tab.key]}
                </span>
              )}
              {tab.key === 'ALL' && kots.length > 0 && (
                <span className={styles.tabCount}>{kots.filter(k => k.displayStatus !== 'SERVED').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* KOT grid */}
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <KotSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              {activeTab === 'PENDING' ? '🔴' :
                activeTab === 'PREPARING' ? '👨‍🍳' :
                  activeTab === 'READY' ? '✅' :
                    activeTab === 'SERVED' ? '🍽️' : '✅'}
            </div>
            <div className={styles.emptyText}>
              {activeTab === 'ALL' ? 'No active KOTs right now' : `No ${activeTab.toLowerCase()} KOTs`}
            </div>
            {activeTab === 'ALL' && (
              <div className={styles.emptyHint}>New KOTs will appear here automatically</div>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.filter(kot => (kot.items || []).some(i => i.kitchenStatus !== 'CANCELLED'))
              .map(kot => (
                <KotCard
                  key={kot.id}
                  kot={kot}
                  onUpdateStatus={handleStatusUpdate}
                  isUpdating={updateStatus.isPending}
                />
              ))}
          </div>
        )}
      </div>

      {/* RIGHT: Prep Summary Panel */}
      <PrepSummaryPanel kots={kots} />

    </div>
  );
}
