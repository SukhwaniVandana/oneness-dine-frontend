import { usePayments } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';
import { downloadCsv } from '../../utils/csvUtils';

const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MODES = [
  { key: 'cashTotal',   label: 'Cash',   icon: '💵', color: 'green'  },
  { key: 'cardTotal',   label: 'Card',   icon: '💳', color: 'blue'   },
  { key: 'upiTotal',    label: 'UPI',    icon: '📱', color: 'purple' },
  { key: 'walletTotal', label: 'Wallet', icon: '👜', color: 'amber'  },
  { key: 'otherTotal',  label: 'Other',  icon: '🔀', color: 'red'    },
];

export default function PaymentsTab({ from, to }) {
  const { data, isLoading, isError } = usePayments(from, to);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError || !data) return <div className={styles.empty}>⚠️ Could not load payments data</div>;

  const grand = Number(data.grandTotal || 0);

  function handleDownloadCsv() {
    const rows = MODES.map(m => {
      const amt = Number(data[m.key] || 0);
      const pct = grand > 0 ? ((amt / grand) * 100).toFixed(1) : '0.0';
      return {
        'Payment Mode': m.label,
        'Amount':       amt.toFixed(2),
        'Percentage':   pct + '%',
      };
    });
    rows.push({
      'Payment Mode': 'TOTAL',
      'Amount':       grand.toFixed(2),
      'Percentage':   '100%',
    });
    downloadCsv(`payments_${from}_to_${to}.csv`, rows);
  }

  return (
    <div className={styles.tabContent}>

      {/* Grand total */}
      <div className={styles.grandTotalCard}>
        <div className={styles.gtLabel}>Total Collections</div>
        <div className={styles.gtValue}>{fmtC(grand)}</div>
        <div className={styles.gtSub}>{data.totalTransactions || 0} transactions · {from} – {to}</div>
      </div>

      {/* Payment mode cards */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>By Payment Mode</div>
          <button className={styles.csvBtn} onClick={handleDownloadCsv}>⬇ CSV</button>
        </div>
        <div className={styles.paymentGrid}>
          {MODES.map(m => {
            const amt = Number(data[m.key] || 0);
            const pct = grand > 0 ? (amt / grand) * 100 : 0;
            return (
              <div key={m.key} className={`${styles.payCard} ${styles['pay_' + m.color]}`}>
                <div className={styles.payIcon}>{m.icon}</div>
                <div className={styles.payLabel}>{m.label}</div>
                <div className={styles.payAmount}>{fmtC(amt)}</div>
                <div className={styles.payBar}>
                  <div className={styles.payBarFill} style={{ width: pct + '%' }} />
                </div>
                <div className={styles.payPct}>{pct.toFixed(1)}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
