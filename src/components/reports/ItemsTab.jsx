import { useItems } from '../../hooks/useReports';
import Spinner from '../common/Spinner';
import styles from './ReportTabs.module.css';
import { downloadCsv } from '../../utils/csvUtils';

const fmt  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ItemsTab({ from, to }) {
  const { data: items = [], isLoading, isError } = useItems(from, to);

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;
  if (isError)   return <div className={styles.empty}>⚠️ Could not load items data</div>;
  if (!items.length) return <div className={styles.empty}>No items data for this period</div>;

  const maxQty = Math.max(...items.map(i => i.quantitySold || 0));

  function handleDownloadCsv() {
    const rows = items.map((item, idx) => ({
      'Rank':      idx + 1,
      'Item':      item.itemName || item.name || '',
      'Category':  item.categoryName || '',
      'Qty Sold':  item.quantitySold || 0,
      'Revenue':   Number(item.totalRevenue || 0).toFixed(2),
    }));
    downloadCsv(`top_items_${from}_to_${to}.csv`, rows);
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Top Selling Items</div>
          <button className={styles.csvBtn} onClick={handleDownloadCsv}>⬇ CSV</button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Popularity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = item.quantitySold || 0;
                const rev = item.totalRevenue || 0;
                const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                return (
                  <tr key={idx} className={idx < 3 ? styles.topRow : ''}>
                    <td>
                      <span className={styles.rank}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                    </td>
                    <td className={styles.itemNameCell}>{item.itemName || item.name}</td>
                    <td><span className={styles.catBadge}>{item.categoryName || '—'}</span></td>
                    <td className={styles.numCell}>{fmt(qty)}</td>
                    <td className={styles.numCell}>{fmtC(rev)}</td>
                    <td>
                      <div className={styles.barWrap}>
                        <div className={styles.barFill} style={{ width: pct + '%' }} />
                        <span className={styles.barPct}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
