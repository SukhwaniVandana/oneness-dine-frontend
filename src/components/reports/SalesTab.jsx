import { useSales, useDaily, today } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';
import { downloadCsv } from '../../utils/csvUtils';

const fmt  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format ISO date string → DD/MM/YYYY */
const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? s : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export default function SalesTab({ from, to }) {
  const dailyResult  = useDaily(today());
  const salesResult  = useSales(from, to, !dailyResult.isLoading);

  const { data, isLoading, isError } = from === to ? dailyResult : salesResult;

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError || !data) return <div className={styles.empty}>⚠️ Could not load sales data</div>;

  const revenue        = data.totalRevenue    || 0;
  const orders         = data.totalOrders     || 0;
  const discount       = data.totalDiscount   || 0;
  const tax            = data.totalTax        || 0;
  const avgOrder       = data.avgOrderValue   || (orders > 0 ? revenue / orders : 0);
  const cancelled      = data.cancelledOrders || 0;
  const dineIn         = data.dineInOrders    || 0;
  const takeaway       = data.takeawayOrders  || 0;
  const online         = data.onlineOrders    || 0;
  const dailyBreakdown = data.dailyBreakdown  || [];

  function handleDownloadCsv() {
    if (dailyBreakdown.length > 0) {
      // Range view — daily rows + totals row
      const rows = dailyBreakdown.map(d => ({
        'Date':      fmtDate(d.date || d.summaryDate),
        'Orders':    d.totalOrders   || 0,
        'Revenue':   Number(d.totalRevenue  || 0).toFixed(2),
        'Discount':  Number(d.totalDiscount || 0).toFixed(2),
        'Tax':       Number(d.totalTax      || 0).toFixed(2),
        'Avg Order': Number(d.avgOrderValue || 0).toFixed(2),
      }));
      // Totals row
      rows.push({
        'Date':      'TOTAL',
        'Orders':    rows.reduce((s, r) => s + Number(r['Orders']), 0),
        'Revenue':   rows.reduce((s, r) => s + Number(r['Revenue']), 0).toFixed(2),
        'Discount':  rows.reduce((s, r) => s + Number(r['Discount']), 0).toFixed(2),
        'Tax':       rows.reduce((s, r) => s + Number(r['Tax']), 0).toFixed(2),
        'Avg Order': '',
      });
      downloadCsv(`sales_${from}_to_${to}.csv`, rows);
    } else {
      // Single day summary
      const rows = [{
        'Date':         fmtDate(from),
        'Total Orders': orders,
        'Revenue':      Number(revenue).toFixed(2),
        'Discount':     Number(discount).toFixed(2),
        'Tax':          Number(tax).toFixed(2),
        'Avg Order':    Number(avgOrder).toFixed(2),
        'Cancelled':    cancelled,
        'Dine In':      dineIn,
        'Takeaway':     takeaway,
        'Online':       online,
      }];
      downloadCsv(`sales_${from}.csv`, rows);
    }
  }

  return (
    <div className={styles.tabContent}>

      <div className={styles.kpiGrid}>
        <KpiCard label="Total Revenue"   value={fmtC(revenue)}  color="accent"  icon="💰" />
        <KpiCard label="Total Orders"    value={fmt(orders)}    color="blue"    icon="🧾" />
        <KpiCard label="Avg Order Value" value={fmtC(avgOrder)} color="green"   icon="📈" />
        <KpiCard label="Total Discount"  value={fmtC(discount)} color="amber"   icon="🏷️" />
        <KpiCard label="Total Tax"       value={fmtC(tax)}      color="purple"  icon="📋" />
        <KpiCard label="Cancelled"       value={fmt(cancelled)} color="red"     icon="❌" />
      </div>

      {(dineIn > 0 || takeaway > 0 || online > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Order Type Breakdown</div>
          <div className={styles.breakdownRow}>
            {dineIn   > 0 && <BreakdownChip label="Dine In"  value={dineIn}   color="amber"  />}
            {takeaway > 0 && <BreakdownChip label="Takeaway" value={takeaway} color="blue"   />}
            {online   > 0 && <BreakdownChip label="Online"   value={online}   color="green"  />}
          </div>
        </div>
      )}

      {dailyBreakdown.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Daily Breakdown</div>
            <button className={styles.csvBtn} onClick={handleDownloadCsv}>⬇ CSV</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th><th>Orders</th><th>Revenue</th>
                  <th>Discount</th><th>Tax</th><th>Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map((d, i) => (
                  <tr key={i}>
                    <td>{d.date || d.summaryDate}</td>
                    <td>{fmt(d.totalOrders)}</td>
                    <td>{fmtC(d.totalRevenue)}</td>
                    <td>{fmtC(d.totalDiscount)}</td>
                    <td>{fmtC(d.totalTax)}</td>
                    <td>{fmtC(d.avgOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dailyBreakdown.length === 0 && (
        <div className={styles.csvRow}>
          <button className={styles.csvBtn} onClick={handleDownloadCsv}>⬇ Export CSV</button>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div className={`${styles.kpiCard} ${styles['kpi_' + color]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}

function BreakdownChip({ label, value, color }) {
  return (
    <div className={`${styles.chip} ${styles['chip_' + color]}`}>
      <div className={styles.chipValue}>{value}</div>
      <div className={styles.chipLabel}>{label}</div>
    </div>
  );
}
