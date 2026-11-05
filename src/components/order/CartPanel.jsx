import { useState } from 'react';
import Spinner from '../common/Spinner';
import styles from './CartPanel.module.css';

const STATUS_COLORS = {
  DRAFT: 'var(--text3)',
  KOT_SENT: 'var(--accent)',
  IN_PROGRESS: 'var(--accent3)',
  READY: 'var(--accent2)',
  SERVED: 'var(--text3)',
  CANCELLED: 'var(--accent4)',
  BILLED: 'var(--accent2)',
};

export default function CartPanel({
  tableNumber,
  existingOrder,
  existingItems,
  kotGroups,
  cart,
  onQtyChange,
  onRemove,
  onNoteChange,
  onRemoveExistingItem,
  onSave,
  onSaveAndPrint,
  onKot,
  onKotAndPrint,
  onSettle,
  canSettle,       // boolean — passed from OrderTaking (orderStatus === 'BILLED')
  loadingAction,
  paxCount,
  onPaxChange,
  paxWarning,
  tableCapacity,
  isCaptain,       // boolean — hides Save/Save & Print for CAPTAIN role
}) {
  const hasNewItems = cart.length > 0;
  const hasExisting = (existingItems || []).filter(i => i.itemStatus !== 'CANCELLED').length > 0;
  const hasAnyItems = hasNewItems || hasExisting;
  const isLoading = !!loadingAction;
  const activeExisting = (existingItems || []).filter(i => i.itemStatus !== 'CANCELLED');

  const newSubtotal = cart.reduce((s, c) => s + (Number(c.unitPrice) || 0) * (c.quantity || 0), 0);
  const existingSubtotal = activeExisting.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (i.quantity || 0), 0);
  const grandTotal = newSubtotal + existingSubtotal;
  const newQty = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className={styles.panel}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <div className={styles.tableLabel}>{tableNumber}</div>
          {existingOrder && (
            <div className={styles.orderMeta}>
              <span>{existingOrder.orderNumber}</span>
              <span className={styles.sessionTag}>{existingOrder.orderSessionTag}</span>
              {existingOrder.orderStatus === 'BILLED' && (
                <span className={styles.billedChip}>✓ Bill Generated</span>
              )}
            </div>
          )}
        </div>
        <div className={styles.paxWrap}>
          <span>👥</span>
          <button className={styles.paxBtn} onClick={() => onPaxChange(Math.max(1, paxCount - 1))}>−</button>
          <span className={`${styles.paxNum} ${paxWarning ? styles.paxOver : ''}`}>
            {paxCount}
          </span>
          <button className={styles.paxBtn} onClick={() => onPaxChange(paxCount + 1)}>+</button>
          {paxWarning && (
            <span className={styles.paxWarnIcon} title={`Exceeds table capacity (${tableCapacity})`}>⚠️</span>
          )}
        </div>
      </div>

      {/* COL HEADERS */}
      {hasAnyItems && (
        <div className={styles.colHeaders}>
          <span className={styles.chItem}>ITEM</span>
          <span className={styles.chQty}>QTY</span>
          <span className={styles.chPrice}>PRICE</span>
        </div>
      )}

      {/* ITEMS */}
      <div className={styles.list}>

        {/* KOT grouped existing items */}
        {kotGroups && kotGroups.length > 0 ? (
          kotGroups.map((kot, idx) => {
            const kotItemIds = new Set((kot.items || []).map(ki => ki.orderItemId));
            const kotItems = activeExisting.filter(oi => kotItemIds.has(oi.id));
            if (kotItems.length === 0) return null;
            return (
              <div key={kot.id || idx}>
                <div className={styles.kotLabel}>
                  <span className={styles.groupDot} style={{ background: 'var(--accent)' }} />
                  KOT #{idx + 1}
                  {kot.createdAt && (
                    <span className={styles.kotTime}>
                      {new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className={`${styles.kotBadge} ${styles['kb_' + (kot.displayStatus || 'PENDING').toLowerCase()]}`}>
                    {kot.displayStatus || 'PENDING'}
                  </span>
                </div>
                {kotItems.map(item => (
                  <ExistingRow key={item.id} item={item} onRemove={onRemoveExistingItem} />
                ))}
              </div>
            );
          })
        ) : activeExisting.length > 0 ? (
          <>
            <div className={styles.groupLabel}>
              <span className={styles.groupDot} style={{ background: 'var(--accent)' }} />
              Sent to Kitchen
            </div>
            {activeExisting.map(item => (
              <ExistingRow key={item.id} item={item} onRemove={onRemoveExistingItem} />
            ))}
          </>
        ) : null}

        {/* New cart items */}
        {hasNewItems && (
          <>
            <div className={styles.groupLabel}>
              <span className={styles.groupDot} style={{ background: 'var(--accent2)' }} />
              New Items
            </div>
            {cart.map(c => (
              <NewRow key={c.cartKey} cartItem={c}
                onQtyChange={onQtyChange} onRemove={onRemove} onNoteChange={onNoteChange} />
            ))}
          </>
        )}

        {!hasAnyItems && (
          <div className={styles.empty}>
            <div style={{ fontSize: 28, opacity: 0.3 }}>🛒</div>
            <div className={styles.emptyText}>No items selected</div>
            <div className={styles.emptyHint}>Tap menu items to add</div>
          </div>
        )}
      </div>

      {/* TOTAL */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>
          Total {newQty > 0 && <span className={styles.newBadge}>+{newQty} new</span>}
        </span>
        <span className={styles.totalAmt}>
          ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </span>
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles.actions}>
        {/* KOT buttons — always visible */}
        <div className={styles.btnRow}>
          <Btn label="KOT" onClick={onKot}
            disabled={!hasNewItems || isLoading} loading={loadingAction === 'kot'} variant="primary" />
          <Btn label="KOT & Print" onClick={onKotAndPrint}
            disabled={!hasNewItems || isLoading} loading={loadingAction === 'kot_print'} variant="primary" />
        </div>

        {/* Save buttons — hidden for CAPTAIN role */}
        {!isCaptain && (
          <div className={styles.btnRow}>
            <Btn label="Save" onClick={onSave}
              disabled={!hasAnyItems || isLoading} loading={loadingAction === 'save'} variant="secondary" />
            <Btn label="Save & Print" onClick={onSaveAndPrint}
              disabled={!hasAnyItems || isLoading} loading={loadingAction === 'save_print'} variant="secondary" />
          </div>
        )}

        {/* Settle — hidden for CAPTAIN, only non-captain roles can settle */}
        {!isCaptain && (
          <button
            className={styles.settleBtn}
            onClick={onSettle}
            disabled={!canSettle || isLoading}
            title={!canSettle ? 'Generate bill first (tap Save)' : 'Proceed to payment'}
          >
            🧾 {canSettle ? 'Settle Bill' : 'Save to Generate Bill First'}
          </button>
        )}
      </div>
    </div>
  );
}

/* Existing (sent) item — read only */
function ExistingRow({ item, onRemove }) {
  const color = STATUS_COLORS[item.itemStatus] || 'var(--text3)';
  const canRemove = !['BILLED', 'CANCELLED', 'SERVED'].includes(item.itemStatus);
  return (
    <div className={`${styles.row} ${styles.existRow}`}>
      <div className={styles.rowName}>
        <VegDot isVeg={item.foodType === 'VEG'} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{item.itemName}</span>
            {item.variantName && <span className={styles.varTag}>({item.variantName})</span>}
          </div>
          {item.specialInstruction && (
            <div className={styles.noteText}>✏️ {item.specialInstruction}</div>
          )}
          <span className={styles.statusChip} style={{ color, borderColor: color }}>
            {item.itemStatus?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <div className={styles.rowQty}>{item.quantity}</div>
      <div className={styles.rowPrice}>
        ₹ {((Number(item.unitPrice) || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </div>
      {canRemove && onRemove && (
        <button className={styles.removeBtn} onClick={() => onRemove(item.id)} title="Remove">✕</button>
      )}
    </div>
  );
}

/* New cart item — editable */
function NewRow({ cartItem, onQtyChange, onRemove, onNoteChange }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const { item, quantity, specialInstruction, cartKey } = cartItem;
  const price = Number(cartItem.unitPrice) || Number(item?.basePrice) || 0;
  return (
    <div className={`${styles.row} ${styles.newRow}`}>
      <div className={styles.rowName}>
        <VegDot isVeg={item.foodType === 'VEG'} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{item.name}</span>
            {cartItem.variantName && <span className={styles.varTag}>({cartItem.variantName})</span>}
            <button className={styles.removeBtn} onClick={() => onRemove(cartKey)}>✕</button>
          </div>
          <button className={styles.noteToggle} onClick={() => setNoteOpen(p => !p)}>
            {noteOpen ? '▲ hide' : '✏️ note'}
          </button>
          {noteOpen && (
            <input className={styles.noteInput}
              placeholder="e.g. Less spicy..."
              value={specialInstruction || ''}
              onChange={e => onNoteChange(cartKey, e.target.value)}
              maxLength={100} />
          )}
        </div>
      </div>
      <div className={styles.rowQty}>
        <div className={styles.qtyCtrl}>
          <button className={styles.qtyBtn} onClick={() => onQtyChange(cartKey, -1)}>−</button>
          <span className={styles.qtyNum}>{quantity}</span>
          <button className={styles.qtyBtn} onClick={() => onQtyChange(cartKey, 1)}>+</button>
        </div>
      </div>
      <div className={styles.rowPrice}>
        ₹ {(price * quantity).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </div>
    </div>
  );
}

function VegDot({ isVeg }) {
  return (
    <span className={styles.vegBox} style={{ borderColor: isVeg ? '#10b981' : '#ef4444' }}>
      <span className={styles.vegInner} style={{ background: isVeg ? '#10b981' : '#ef4444' }} />
    </span>
  );
}

function Btn({ label, onClick, disabled, loading, variant }) {
  return (
    <button className={`${styles.btn} ${styles[variant]}`}
      onClick={onClick} disabled={disabled || loading}>
      {loading && <Spinner size="sm" variant={variant === 'primary' ? 'dark' : 'amber'} />}
      {label}
    </button>
  );
}
