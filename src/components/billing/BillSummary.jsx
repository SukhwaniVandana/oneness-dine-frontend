import styles from './BillSummary.module.css';

/*
 * BillSummary — shows full bill breakdown
 * Calculation order (matches backend):
 *   itemSubtotal = unitPrice × qty
 *   itemTaxable  = itemSubtotal × (1 - discountPct/100)
 *   itemGST      = itemTaxable × gstRate
 *   itemTotal    = itemTaxable + itemGST
 *
 * Display order:
 *   Subtotal → Discount% → Taxable Amt → CGST → SGST → [Cess] → [Service] → [Packaging] → Total
 */
export default function BillSummary({
  bill,
  discountPct,       // string — the % input value
  onDiscountChange,  // (value: string) => void
  calc,              // { orderDiscount, taxableAmount, cgst, sgst, cess, serviceCharge, total }
}) {
  if (!bill) return null;

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  const subtotal = Number(bill.subtotal || 0);
  const serviceChg = calc.serviceCharge;
  const packagingChg = Number(bill.packagingCharge || 0);
  const roundOff = Number(bill.roundOff || 0);

  /* Tax rates from backend bill (for % label display) */
  /* Use discountPct from bill if available to derive correct base */
  const taxBase = subtotal > 0 ? subtotal : 1;
  const cgstRate = ((bill.cgstAmount / taxBase) * 100).toFixed(1);
  const sgstRate = ((bill.sgstAmt / taxBase) * 100).toFixed(1);
  const cessRate = ((bill.cessAmt / taxBase) * 100).toFixed(1);

  const hasDiscount = calc.orderDiscount > 0;
  const hasCgst = calc.cgst > 0;
  const hasSgst = calc.sgst > 0;
  const hasIgst = calc.igst > 0;
  const hasCess = calc.cess > 0;
  const hasService = calc.serviceCharge > 0;
  const hasPackaging = packagingChg > 0;

  return (
    <div className={styles.wrapper}>

      {/* Bill header */}
      <div className={styles.billHeader}>
        <div className={styles.billNum}>{bill.billNumber}</div>
        <div className={styles.billMeta}>
          {bill.orderNumber}
          {bill.customerName && ` · ${bill.customerName}`}
        </div>
      </div>

      {/* Items */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Items</div>
        {(bill.items || []).map((item, idx) => (
          <div key={idx} className={styles.row}>
            <div className={styles.rowName}>
              {item.itemName}
              {item.variantName && (
                <span className={styles.variantTag}> ({item.variantName})</span>
              )}
              {item.isComplimentary && (
                <span className={styles.compTag}>Comp</span>
              )}
            </div>
            <div className={styles.rowQty}>×{item.quantity}</div>
            <div className={styles.rowAmt}>
              {item.isComplimentary ? '—' : `₹ ${fmt(item.totalPrice)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className={styles.section}>

        {/* Subtotal */}
        <div className={styles.row}>
          <div className={styles.rowName}>Subtotal</div>
          <div className={styles.rowAmt}>₹ {fmt(subtotal)}</div>
        </div>

        {/* Discount % input — always visible, correct position */}
        <div className={`${styles.row} ${styles.discountRow}`}>
          <div className={styles.rowName}>
            <span>🏷️ Discount</span>
          </div>
          <div className={styles.discountRight}>
            {hasDiscount && (
              <span className={styles.resolvedAmt}>
                − ₹{fmt(calc.orderDiscount)}
              </span>
            )}
            <div className={styles.discountInputWrap}>
              <input
                className={styles.discountInput}
                type="number"
                placeholder="0"
                value={discountPct}
                onChange={e => onDiscountChange(e.target.value)}
                min={0}
                max={100}
              />
              <span className={styles.pctLabel}>%</span>
            </div>
          </div>
        </div>

        {/* Taxable amount — helper row, shown only when discount > 0 */}
        {hasDiscount && (
          <div className={`${styles.row} ${styles.taxableRow}`}>
            <div className={styles.rowName}>Taxable Amount</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.taxableAmount)}</div>
          </div>
        )}

        {/* GST — CGST+SGST (intra-state) OR IGST (inter-state), never all 3 */}
        {hasCgst && (
          <div className={styles.row}>
            <div className={styles.rowName}>CGST ({cgstRate}%)</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.cgst)}</div>
          </div>
        )}
        {hasSgst && (
          <div className={styles.row}>
            <div className={styles.rowName}>SGST ({sgstRate}%)</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.sgst)}</div>
          </div>
        )}
        {hasIgst && (
          <div className={styles.row}>
            <div className={styles.rowName}>IGST</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.igst)}</div>
          </div>
        )}
        {hasCess && (
          <div className={styles.row}>
            <div className={styles.rowName}>Cess ({cessRate}%)</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.cess)}</div>
          </div>
        )}
        {hasService && (
          <div className={styles.row}>
            <div className={styles.rowName}>Service Charge</div>
            <div className={styles.rowAmt}>₹ {fmt(calc.serviceCharge)}</div>
          </div>
        )}
        {hasPackaging && (
          <div className={styles.row}>
            <div className={styles.rowName}>Packaging</div>
            <div className={styles.rowAmt}>₹ {fmt(packagingChg)}</div>
          </div>
        )}
        {roundOff !== 0 && (
          <div className={styles.row}>
            <div className={styles.rowName}>Round Off</div>
            <div className={styles.rowAmt}>
              {roundOff > 0 ? '+' : ''}₹ {fmt(Math.abs(roundOff))}
            </div>
          </div>
        )}

        {/* Grand total */}
        <div className={`${styles.row} ${styles.grandTotalRow}`}>
          <div className={`${styles.rowName} ${styles.grandTotalLabel}`}>Total</div>
          <div className={`${styles.rowAmt} ${styles.grandTotalAmt}`}>
            ₹ {fmt(calc.total)}
          </div>
        </div>

      </div>
    </div>
  );
}
