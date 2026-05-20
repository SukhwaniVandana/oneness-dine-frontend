import { useState } from 'react';
import styles from './VariantAddonModal.module.css';

/**
 * VariantAddonModal
 * Only shown when item.hasVariants=true OR item.hasAddons=true
 * Captain selects variant (required) + addons (optional), confirms qty
 *
 * Props:
 *   item      — menu item from API (includes variants[], addonGroups[])
 *   onConfirm — ({ item, variant, addons, quantity, unitPrice }) => void
 *   onClose   — () => void
 */
export default function VariantAddonModal({ item, onConfirm, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons,  setSelectedAddons]  = useState([]);
  const [quantity,        setQuantity]        = useState(1);

  const variants    = item.variants     || [];
  const addonGroups = item.addonGroups  || [];
  const hasVariants = item.hasVariants  && variants.length > 0;
  const hasAddons   = item.hasAddons    && addonGroups.length > 0;

  /* Live price calculation */
  const basePrice   = selectedVariant
    ? Number(selectedVariant.price || selectedVariant.basePrice)
    : Number(item.basePrice);
  const addonsTotal = selectedAddons.reduce((s, a) => s + Number(a.price), 0);
  const unitPrice   = basePrice + addonsTotal;
  const totalPrice  = unitPrice * quantity;

  function toggleAddon(addon) {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  }

  function handleConfirm() {
    if (hasVariants && !selectedVariant) return;
    onConfirm({
      item,
      variant:   selectedVariant,
      addons:    selectedAddons,
      quantity,
      unitPrice,
      variantId: selectedVariant?.id || null,
    });
  }

  const canConfirm = !hasVariants || !!selectedVariant;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.itemName}>{item.name}</div>
            {item.categoryName && (
              <div className={styles.catName}>{item.categoryName}</div>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          {/* ── VARIANTS ── */}
          {hasVariants && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Select Variant
                <span className={styles.required}> *</span>
              </div>
              <div className={styles.optionGrid}>
                {variants.map(v => (
                  <button
                    key={v.id}
                    className={`${styles.optBtn} ${selectedVariant?.id === v.id ? styles.selected : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <div className={styles.optName}>{v.name}</div>
                    <div className={styles.optPrice}>
                      ₹ {Number(v.price || v.basePrice).toFixed(0)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ADDON GROUPS ── */}
          {hasAddons && addonGroups.map(group => (
            <div key={group.id} className={styles.section}>
              <div className={styles.sectionTitle}>
                {group.name}
                <span className={styles.optional}> (optional)</span>
              </div>
              <div className={styles.optionGrid}>
                {(group.addons || []).map(addon => {
                  const isSelected = !!selectedAddons.find(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      className={`${styles.optBtn} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleAddon(addon)}
                    >
                      <div className={styles.optName}>{addon.name}</div>
                      <div className={styles.optPrice}>
                        + ₹ {Number(addon.price).toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── QUANTITY ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Quantity</div>
            <div className={styles.qtyRow}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >−</button>
              <span className={styles.qtyNum}>{quantity}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity(q => q + 1)}
              >+</button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.totalPrice}>
            ₹ {totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div className={styles.footerBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Add to Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
