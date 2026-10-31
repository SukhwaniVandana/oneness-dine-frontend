import { useEffect, useRef } from 'react';
import Spinner from '../common/Spinner';
import styles from './ReadyKotsModal.module.css';

/*
  Captain-facing bottom sheet.
  Shows READY kots for the tapped table.
  Props:
    tableNumber  — display name
    kots         — all READY kots for this table
    onMarkServed — (kotId) => void
    onAddItems   — () => void  — navigate to order screen
    onClose      — () => void
    isUpdating   — bool
*/
export default function ReadyKotsModal({
  tableNumber,
  kots = [],
  onMarkServed,
  onAddItems,
  onClose,
  isUpdating,
}) {
  const overlayRef = useRef(null);

  /* Close on overlay click */
  function handleOverlay(e) {
    if (e.target === overlayRef.current) onClose();
  }

  /* Close on Escape */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const readyKots = kots.filter(k => k.displayStatus === 'READY');

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlay}>
      <div className={styles.sheet}>

        {/* Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.readyDot} />
            <span className={styles.title}>Ready to Serve</span>
            <span className={styles.tableTag}>{tableNumber}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* KOT list */}
        <div className={styles.kotList}>
          {readyKots.length === 0 ? (
            <div className={styles.empty}>No ready KOTs for this table</div>
          ) : (
            readyKots.map(kot => (
              <div key={kot.id} className={styles.kotBlock}>
                <div className={styles.kotHeader}>
                  <span className={styles.kotNum}>{kot.kotNumber}</span>
                  <span className={styles.itemCount}>
                    {(kot.items || []).filter(i => i.kitchenStatus !== 'CANCELLED').length} items
                  </span>
                  <button
                    className={styles.serveBtn}
                    onClick={() => onMarkServed(kot.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? <Spinner size="sm" variant="dark" />
                      : '✓ Served'}
                  </button>
                </div>
                <div className={styles.items}>
                  {(kot.items || [])
                    .filter(i => i.kitchenStatus !== 'CANCELLED')
                    .map(item => (
                      <div key={item.id} className={styles.item}>
                        <span className={styles.qty}>{item.quantity}x</span>
                        <span className={styles.itemName}>{item.itemName}</span>
                        {item.specialInstruction && (
                          <span className={styles.note} title={item.specialInstruction}>✏️</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — mark all + add items */}
        <div className={styles.footer}>
          {readyKots.length > 1 && (
            <button
              className={styles.markAllBtn}
              onClick={() => readyKots.forEach(k => onMarkServed(k.id))}
              disabled={isUpdating}
            >
              {isUpdating
                ? <><Spinner size="sm" variant="dark" /> Marking...</>
                : `✓ Mark All ${readyKots.length} KOTs Served`}
            </button>
          )}
          {onAddItems && (
            <button className={styles.addItemsBtn} onClick={onAddItems}>
              + Add More Items
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
