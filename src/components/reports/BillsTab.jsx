import { useState } from 'react';
import { useBills } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';
import { downloadCsv } from '../../utils/csvUtils';
import { generateBillPdf } from '../../utils/billPdf';

const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const fmtDateTime = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const STATUS_COLORS = {
  PAID: 'green', DRAFT: 'amber', PRINTED: 'blue', VOIDED: 'red', REFUNDED: 'purple',
};

const SUB_TABS = [
  { key: 'all',      label: 'All Bills'       },
  { key: 'discount', label: 'Discount Report' },
  { key: 'due',      label: 'Due / Credit'    },
];

function primaryPayment(bill) {
  const payments = bill.payments || [];
  if (!payments.length) return '—';
  const top = payments.reduce((a, b) => Number(a.amount || 0) >= Number(b.amount || 0) ? a : b);
  return top.paymentMethod || '—';
}

export default function BillsTab({ from, to }) {
  const [subTab, setSubTab] = useState('all');
  const { data: bills = [], isLoading, isError } = useBills(from, to);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError)   return <div className={styles.empty}>⚠️ Could not load bills data</div>;

  const filtered = subTab === 'discount'
    ? bills.filter(b => Number(b.orderDiscount) > 0 || Number(b.itemDiscount) > 0)
    : subTab === 'due'
    ? bills.filter(b => (b.payments || []).some(p => p.paymentMethod === 'CREDIT'))
    : bills;

  const totalRevenue  = bills.reduce((s, b) => s + Number(b.totalAmount   || 0), 0);
  const totalDiscount = bills.reduce((s, b) => s + Number(b.orderDiscount || 0) + Number(b.itemDiscount || 0), 0);
  const totalDue      = bills
    .flatMap(b => b.payments || [])
    .filter(p => p.paymentMethod === 'CREDIT')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  function handleDownloadCsv() {
    const rows = filtered.map(bill => {
      const discAmt = Number(bill.orderDiscount || 0) + Number(bill.itemDiscount || 0);
      const dueAmt  = (bill.payments || [])
        .filter(p => p.paymentMethod === 'CREDIT')
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const row = {
        'Bill #':       bill.billNumber  || '',
        'Order #':      bill.orderNumber || '',
        'Date':         fmtDateTime(bill.createdAt),
        'Customer':     bill.customerName || '',
        'Payment Mode': primaryPayment(bill),
        'Total':        Number(bill.totalAmount || 0).toFixed(2),
        'Status':       bill.billStatus || '',
      };

      if (subTab === 'discount') row['Discount']   = discAmt.toFixed(2);
      if (subTab === 'due')      row['Due Amount'] = dueAmt.toFixed(2);

      return row;
    });

    const label = subTab === 'discount' ? 'discount' : subTab === 'due' ? 'due' : 'all';
    downloadCsv(`bills_${label}_${from}_to_${to}.csv`, rows);
  }

  return (
    <div className={styles.tabContent}>

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

      <div className={styles.subTabsRow}>
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
        <button className={styles.csvBtn} onClick={handleDownloadCsv}>⬇ CSV</button>
      </div>

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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bill => {
                  const dueAmt  = (bill.payments || [])
                    .filter(p => p.paymentMethod === 'CREDIT')
                    .reduce((s, p) => s + Number(p.amount || 0), 0);
                  const discAmt = Number(bill.orderDiscount || 0) + Number(bill.itemDiscount || 0);
                  const color   = STATUS_COLORS[bill.billStatus] || 'amber';
                  return (
                    <tr key={bill.id}>
                      <td className={styles.monoCell}>{bill.billNumber}</td>
                      <td className={styles.monoCell}>{bill.orderNumber}</td>
                      <td>{fmtDateTime(bill.createdAt)}</td>
                      <td>{bill.customerName || '—'}</td>
                      {subTab === 'discount' && <td className={styles.discountCell}>{fmtC(discAmt)}</td>}
                      {subTab === 'due'      && <td className={styles.dueCell}>{fmtC(dueAmt)}</td>}
                      <td className={styles.numCell}>{fmtC(bill.totalAmount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles['status_' + color]}`}>
                          {bill.billStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.pdfRowBtn}
                          title="Download PDF"
                          onClick={() => generateBillPdf(bill)}>
                          📄
                        </button>
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
