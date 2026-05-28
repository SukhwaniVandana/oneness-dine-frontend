import { useSales, useDaily } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';

const fmt  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesTab({ from, to, isRange }) {
  const { data, isLoading, isError } = isRange
    ? useSales(from, to)
    : useDaily(from);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError || !data) return <div className={styles.empty}>⚠️ Could not load sales data</div>;

  /* Normalize — both DailySummaryDto and SalesReportDto */
  const revenue       = data.totalRevenue    || 0;
  const orders        = data.totalOrders     || 0;
  const discount      = data.totalDiscount   || 0;
  const tax           = data.totalTax        || 0;
  const avgOrder      = data.avgOrderValue   || (orders > 0 ? revenue / orders : 0);
  const cancelled     = data.cancelledOrders || 0;
  const dineIn        = data.dineInOrders    || 0;
  const takeaway      = data.takeawayOrders  || 0;
  const online        = data.onlineOrders    || 0;
  const dailyBreakdown= data.dailyBreakdown  || [];

  return (
    <div className={styles.tabContent}>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard label="Total Revenue"   value={fmtC(revenue)}  color="accent"  icon="💰" />
        <KpiCard label="Total Orders"    value={fmt(orders)}    color="blue"    icon="🧾" />
        <KpiCard label="Avg Order Value" value={fmtC(avgOrder)} color="green"   icon="📈" />
        <KpiCard label="Total Discount"  value={fmtC(discount)} color="amber"   icon="🏷️" />
        <KpiCard label="Total Tax"       value={fmtC(tax)}      color="purple"  icon="📋" />
        <KpiCard label="Cancelled"       value={fmt(cancelled)} color="red"     icon="❌" />
      </div>

      {/* Order type breakdown */}
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

      {/* Daily breakdown table — only for date range */}
      {dailyBreakdown.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Daily Breakdown</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Avg Order</th>
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
