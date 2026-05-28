import { useState } from 'react';
import { useBills } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';

const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtD = (s) => s ? new Date(s).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

const STATUS_COLORS = {
  PAID:    'green', DRAFT:   'amber',
  PRINTED: 'blue',  VOIDED:  'red', REFUNDED: 'purple',
};

const SUB_TABS = [
  { key: 'all',      label: 'All Bills'       },
  { key: 'discount', label: 'Discount Report' },
  { key: 'due',      label: 'Due / Credit'    },
];

export default function BillsTab({ from, to }) {
  const [subTab, setSubTab] = useState('all');
  const { data: bills = [], isLoading, isError } = useBills(from, to);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError)   return <div className={styles.empty}>⚠️ Could not load bills data</div>;

  /* Filter by sub tab */
  const filtered = subTab === 'discount'
    ? bills.filter(b => Number(b.orderDiscount) > 0 || Number(b.itemDiscount) > 0)
    : subTab === 'due'
    ? bills.filter(b => (b.payments || []).some(p => p.paymentMethod === 'CREDIT'))
    : bills;

  /* Summary totals */
  const totalRevenue  = bills.reduce((s, b) => s + Number(b.totalAmount  || 0), 0);
  const totalDiscount = bills.reduce((s, b) => s + Number(b.orderDiscount || 0) + Number(b.itemDiscount || 0), 0);
  const totalDue      = bills
    .flatMap(b => b.payments || [])
    .filter(p => p.paymentMethod === 'CREDIT')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className={styles.tabContent}>

      {/* Summary KPIs */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpi_accent}`}>
          <div className={styles.kpiIcon}>🧾</div>
          <div className={styles.kpiValue}>{bills.length}</div>
          <div className={styles.kpiLabel}>Total Bills</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpi_green}`}>
          <div className={styles.kpiIcon}>💰</div>
          <div className={styles.kpiValue}>{fmtC(totalRevenue)}</div>
          <div className={styles.kpiLabel}>Total Revenue</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpi_amber}`}>
          <div className={styles.kpiIcon}>🏷️</div>
          <div className={styles.kpiValue}>{fmtC(totalDiscount)}</div>
          <div className={styles.kpiLabel}>Total Discount</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpi_red}`}>
          <div className={styles.kpiIcon}>📋</div>
          <div className={styles.kpiValue}>{fmtC(totalDue)}</div>
          <div className={styles.kpiLabel}>Total Due</div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className={styles.subTabs}>
        {SUB_TABS.map(t => (
          <button key={t.key}
            className={`${styles.subTab} ${subTab === t.key ? styles.subTabActive : ''}`}
            onClick={() => setSubTab(t.key)}>
            {t.label}
            <span className={styles.subTabCount}>{
              t.key === 'all'      ? bills.length :
              t.key === 'discount' ? bills.filter(b => Number(b.orderDiscount) > 0 || Number(b.itemDiscount) > 0).length :
              bills.filter(b => (b.payments || []).some(p => p.paymentMethod === 'CREDIT')).length
            }</span>
          </button>
        ))}
      </div>

      {/* Bills table */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No bills for this filter</div>
      ) : (
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  {subTab === 'discount' && <th>Discount</th>}
                  {subTab === 'due'      && <th>Due Amount</th>}
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bill => {
                  const dueAmt = (bill.payments || [])
                    .filter(p => p.paymentMethod === 'CREDIT')
                    .reduce((s, p) => s + Number(p.amount || 0), 0);
                  const discAmt = Number(bill.orderDiscount || 0) + Number(bill.itemDiscount || 0);
                  const color = STATUS_COLORS[bill.billStatus] || 'amber';
                  return (
                    <tr key={bill.id}>
                      <td className={styles.monoCell}>{bill.billNumber}</td>
                      <td className={styles.monoCell}>{bill.orderNumber}</td>
                      <td>{fmtD(bill.createdAt)}</td>
                      <td>{bill.customerName || '—'}</td>
                      {subTab === 'discount' && (
                        <td className={styles.discountCell}>{fmtC(discAmt)}</td>
                      )}
                      {subTab === 'due' && (
                        <td className={styles.dueCell}>{fmtC(dueAmt)}</td>
                      )}
                      <td className={styles.numCell}>{fmtC(bill.totalAmount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles['status_' + color]}`}>
                          {bill.billStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
