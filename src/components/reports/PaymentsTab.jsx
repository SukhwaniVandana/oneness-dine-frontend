import { usePayments } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';

const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MODES = [
  { key: 'cashTotal',   label: 'Cash',   icon: '💵', color: 'green'  },
  { key: 'cardTotal',   label: 'Card',   icon: '💳', color: 'blue'   },
  { key: 'upiTotal',    label: 'UPI',    icon: '📱', color: 'purple' },
  { key: 'walletTotal', label: 'Wallet', icon: '👝', color: 'amber'  },
  { key: 'otherTotal',  label: 'Other',  icon: '📋', color: 'red'    },
];

export default function PaymentsTab({ from, to }) {
  const { data, isLoading, isError } = usePayments(from, to);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError || !data) return <div className={styles.empty}>⚠️ Could not load payment data</div>;

  const grandTotal = Number(data.grandTotal || 0);

  return (
    <div className={styles.tabContent}>

      {/* Grand total */}
      <div className={styles.grandTotalCard}>
        <div className={styles.gtLabel}>Total Collections</div>
        <div className={styles.gtValue}>{fmtC(grandTotal)}</div>
        <div className={styles.gtSub}>{data.totalTransactions || 0} transactions</div>
      </div>

      {/* Payment mode breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Payment Mode Breakdown</div>
        <div className={styles.paymentGrid}>
          {MODES.map(m => {
            const amount = Number(data[m.key] || 0);
            if (amount === 0) return null;
            const pct = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : 0;
            return (
              <div key={m.key} className={`${styles.payCard} ${styles['pay_' + m.color]}`}>
                <div className={styles.payIcon}>{m.icon}</div>
                <div className={styles.payLabel}>{m.label}</div>
                <div className={styles.payAmount}>{fmtC(amount)}</div>
                <div className={styles.payBar}>
                  <div className={styles.payBarFill} style={{ width: pct + '%' }} />
                </div>
                <div className={styles.payPct}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
