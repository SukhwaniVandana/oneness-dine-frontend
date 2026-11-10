import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useDueCustomers,
  useCustomerLedger,
  useCollectCredit,
} from '../../hooks/useCreditLedger';
import Spinner from '../common/Spinner';
import tabStyles from './ReportTabs.module.css';
import styles    from './CustomerLedger.module.css';

const fmtC  = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtDt = (s) => s
  ? new Date(s).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  : '—';

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function CustomerLedgerTab({ from, to }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null); // { id, name, phone }
  const [collectTarget,    setCollectTarget]    = useState(null); // same shape

  const { data: customers = [], isLoading, isError, refetch } =
    useDueCustomers(from, to);

  if (isLoading) return <div className={tabStyles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError)   return <div className={tabStyles.empty}>⚠️ Could not load credit data</div>;

  // ── KPI summary ─────────────────────────────────────────────────────────
  const totalDue      = customers.filter(c => Number(c.outstandingBalance) > 0)
                                  .reduce((s, c) => s + Number(c.outstandingBalance), 0);
  const totalAdvance  = customers.filter(c => Number(c.outstandingBalance) < 0)
                                  .reduce((s, c) => s + Math.abs(Number(c.outstandingBalance)), 0);
  const dueCount      = customers.filter(c => Number(c.outstandingBalance) > 0).length;
  const totalBills    = customers.reduce((s, c) => s + Number(c.billCount || 0), 0);

  // ── If a customer is selected, show their ledger detail ─────────────────
  if (selectedCustomer) {
    return (
      <>
        <CustomerDetail
          customer={selectedCustomer}
          from={from}
          to={to}
          onBack={() => setSelectedCustomer(null)}
          onCollect={(c) => setCollectTarget(c)}
        />
        {collectTarget && (
          <CollectModal
            customer={collectTarget}
            onClose={() => setCollectTarget(null)}
            onSuccess={() => { setCollectTarget(null); refetch(); }}
          />
        )}
      </>
    );
  }

  return (
    <div className={tabStyles.tabContent}>

      {/* KPI cards */}
      <div className={tabStyles.kpiGrid}>
        <div className={`${tabStyles.kpiCard} ${tabStyles.kpi_red}`}>
          <div className={tabStyles.kpiIcon}>💳</div>
          <div className={tabStyles.kpiValue}>{fmtC(totalDue)}</div>
          <div className={tabStyles.kpiLabel}>Total Dues</div>
        </div>
        <div className={`${tabStyles.kpiCard} ${tabStyles.kpi_green}`}>
          <div className={tabStyles.kpiIcon}>💰</div>
          <div className={tabStyles.kpiValue}>{fmtC(totalAdvance)}</div>
          <div className={tabStyles.kpiLabel}>Total Advance</div>
        </div>
        <div className={`${tabStyles.kpiCard} ${tabStyles.kpi_accent}`}>
          <div className={tabStyles.kpiIcon}>👤</div>
          <div className={tabStyles.kpiValue}>{dueCount}</div>
          <div className={tabStyles.kpiLabel}>Customers with Dues</div>
        </div>
        <div className={`${tabStyles.kpiCard} ${tabStyles.kpi_blue}`}>
          <div className={tabStyles.kpiIcon}>🧾</div>
          <div className={tabStyles.kpiValue}>{totalBills}</div>
          <div className={tabStyles.kpiLabel}>Bills on Credit</div>
        </div>
      </div>

      {/* Customer list */}
      {customers.length === 0 ? (
        <div className={tabStyles.empty}>No credit activity found 🎉</div>
      ) : (
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Credit Customers</div>
          <div className={styles.customerList}>
            {customers.map(c => {
              const bal = Number(c.outstandingBalance);
              const isDue     = bal > 0;
              const isAdvance = bal < 0;
              return (
                <div
                  key={c.customerId}
                  className={styles.customerRow}
                  onClick={() => setSelectedCustomer({
                    id: c.customerId, name: c.customerName, phone: c.customerPhone,
                  })}
                >
                  <div className={styles.customerInfo}>
                    <div className={styles.customerName}>{c.customerName}</div>
                    <div className={styles.customerPhone}>
                      {c.customerPhone} · {c.billCount} bill{c.billCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={`${styles.balanceBadge} ${isDue ? styles.balanceDue : isAdvance ? styles.balanceAdvance : styles.balanceZero}`}>
                    {isAdvance ? `Advance ${fmtC(Math.abs(bal))}` : fmtC(bal)}
                  </div>
                  <button
                    className={styles.collectBtn}
                    disabled={!isDue}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollectTarget({
                        id: c.customerId, name: c.customerName, phone: c.customerPhone,
                        outstanding: c.outstandingBalance,
                      });
                    }}
                  >
                    Collect
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collect modal (from list view) */}
      {collectTarget && (
        <CollectModal
          customer={collectTarget}
          onClose={() => setCollectTarget(null)}
          onSuccess={() => { setCollectTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ── Per-customer ledger detail ─────────────────────────────────────────────
function CustomerDetail({ customer, from, to, onBack, onCollect }) {
  const { data: entries = [], isLoading, isError } =
    useCustomerLedger(customer.id, from, to);

  // Current balance = last entry's balanceAfter
  const currentBalance = entries.length > 0
    ? Number(entries[0].balanceAfter || 0)
    : 0;

  return (
    <div className={tabStyles.tabContent}>
      <div className={styles.detailPanel}>

        {/* Header */}
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <div>
            <div className={styles.detailTitle}>{customer.name}</div>
            <div className={styles.detailPhone}>{customer.phone}</div>
          </div>
          <div style={{ flex: 1 }} />
          {currentBalance > 0 && (
            <button
              className={styles.collectBtn}
              onClick={() => onCollect({ ...customer, outstanding: currentBalance })}
            >
              Collect Payment
            </button>
          )}
        </div>

        {/* Balance KPI */}
        <div className={tabStyles.kpiGrid}>
          <div className={`${tabStyles.kpiCard} ${currentBalance > 0 ? tabStyles.kpi_red : tabStyles.kpi_green}`}>
            <div className={tabStyles.kpiIcon}>{currentBalance > 0 ? '💳' : '✅'}</div>
            <div className={tabStyles.kpiValue}>{fmtC(currentBalance)}</div>
            <div className={tabStyles.kpiLabel}>Current Balance</div>
          </div>
        </div>

        {/* Ledger table */}
        {isLoading && <div className={tabStyles.loading}><Spinner size="lg" variant="amber" /></div>}
        {isError   && <div className={tabStyles.empty}>⚠️ Could not load ledger</div>}
        {!isLoading && !isError && entries.length === 0 && (
          <div className={tabStyles.empty}>No ledger entries for this period</div>
        )}
        {!isLoading && !isError && entries.length > 0 && (
          <div className={tabStyles.tableWrap}>
            <table className={tabStyles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Bill #</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td>{fmtDt(e.createdAt)}</td>
                    <td>
                      <span className={`${styles.txnBadge} ${e.txnType === 'DEBIT' ? styles.txnBadgeDebit : styles.txnBadgeCredit}`}>
                        {e.txnType === 'DEBIT' ? '↑ Due' : '↓ Paid'}
                      </span>
                    </td>
                    <td className={tabStyles.monoCell}>{e.billNumber || '—'}</td>
                    <td className={e.txnType === 'DEBIT' ? styles.txnDebit : styles.txnCredit}>
                      {e.txnType === 'DEBIT' ? '+' : '−'}{fmtC(e.amount)}
                    </td>
                    <td className={tabStyles.numCell}>{fmtC(e.balanceAfter)}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 11 }}>{e.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Collect payment modal ──────────────────────────────────────────────────
function CollectModal({ customer, onClose, onSuccess }) {
  const { session } = useAuth();
  const [amount,  setAmount]  = useState('');
  const [remarks, setRemarks] = useState('');
  const [error,   setError]   = useState('');

  const { mutateAsync: collect, isPending } = useCollectCredit();

  const outstanding = Number(customer.outstanding || 0);

  async function handleSubmit() {
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    // if (amt > outstanding) {
    //   setError(`Amount cannot exceed outstanding balance (${fmtC(outstanding)})`);
    //   return;
    // }
    try {
      await collect({
        customerId:          customer.id,
        amount:              amt,
        remarks:             remarks || undefined,
        collectedByUserId:   session?.userId,
      });
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to collect payment';
      setError(msg);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>Collect Credit Payment</div>
        <div className={styles.modalSubtitle}>{customer.name} · {customer.phone}</div>

        <div>
          <div className={styles.outstandingLabel}>Outstanding Balance</div>
          <div className={styles.outstandingValue}>{fmtC(outstanding)}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>Amount Collected (₹)</div>
          <input
            className={styles.fieldInput}
            type="number"
            min="0.01"
            max={outstanding}
            step="0.01"
            placeholder={`e.g., ${fmtC(outstanding)}`}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <div className={styles.fieldLabel}>Remarks (optional)</div>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="e.g. Cash received"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : 'Confirm Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}
