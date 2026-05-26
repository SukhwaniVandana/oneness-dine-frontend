import styles from './PrepSummaryPanel.module.css';

/**
 * PrepSummaryPanel
 * Shows aggregated items from all PENDING + PREPARING KOTs
 * Grouped by category — helps kitchen prepare common items together
 *
 * Props:
 *   kots — all KOT objects from API
 */
export default function PrepSummaryPanel({ kots }) {

  /* Only consider PENDING + PREPARING KOTs */
  const activeKots = (kots || []).filter(k =>
    k.displayStatus === 'PENDING' || k.displayStatus === 'PREPARING'
  );

  /* Aggregate items across all active KOTs
     Group by itemName, sum quantities, track category */
  const categoryMap = new Map();

  activeKots.forEach(kot => {
    (kot.items || []).forEach(item => {
      const category = item.categoryName || 'Other';
      const itemName = item.itemName;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      const catItems = categoryMap.get(category);
      if (catItems.has(itemName)) {
        catItems.get(itemName).quantity += item.quantity;
      } else {
        catItems.set(itemName, {
          itemName,
          quantity: item.quantity,
          categoryName: category,
        });
      }
    });
  });

  /* Convert to sorted array */
  const categories = Array.from(categoryMap.entries())
    .map(([catName, itemsMap]) => ({
      catName,
      items: Array.from(itemsMap.values())
        .sort((a, b) => b.quantity - a.quantity), // highest qty first
    }))
    .sort((a, b) => a.catName.localeCompare(b.catName));

  const totalItems  = categories.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const activeCount = activeKots.length;

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>Prep Summary</div>
        <div className={styles.meta}>
          {activeCount > 0
            ? `${activeCount} active KOT${activeCount > 1 ? 's' : ''} · ${totalItems} items`
            : 'No active KOTs'}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {categories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✅</div>
            <div className={styles.emptyText}>All clear!</div>
            <div className={styles.emptyHint}>No pending or preparing items</div>
          </div>
        ) : (
          categories.map(({ catName, items }) => (
            <div key={catName} className={styles.category}>
              <div className={styles.catHeader}>
                <span className={styles.catName}>{catName}</span>
                <span className={styles.catCount}>
                  {items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              {items.map(item => (
                <div key={item.itemName} className={styles.item}>
                  <span className={styles.itemName}>{item.itemName}</span>
                  <span className={`${styles.qty} ${item.quantity >= 3 ? styles.qtyHigh : ''}`}>
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
