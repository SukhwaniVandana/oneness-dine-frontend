/**
 * ONENESS Dine — Bill Print Template (ESC/POS)
 */

function printBill(printer, bill, paperWidth) {
  const W = paperWidth === '58' ? 32 : 48;
  const LINE = '-'.repeat(W);

  const fmt   = (n) => `Rs.${Number(n || 0).toFixed(2)}`;
  const pad   = (l, r) => l + ' '.repeat(Math.max(1, W - l.length - r.length)) + r;

  // ── Header ───────────────────────────────────────────
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(truncate(bill.restaurantName || 'RESTAURANT', W));
  printer.bold(false);
  printer.setTextNormal();

  if (bill.restaurantAddress) printer.println(truncate(bill.restaurantAddress, W));
  if (bill.restaurantPhone)   printer.println(`Ph: ${bill.restaurantPhone}`);
  if (bill.gstNumber)         printer.println(`GSTIN: ${bill.gstNumber}`);
  if (bill.fssaiNumber)       printer.println(`FSSAI: ${bill.fssaiNumber}`);

  printer.println(LINE);

  // ── Bill Info ─────────────────────────────────────────
  printer.alignLeft();
  printer.println(pad(`Bill: ${bill.billNumber || 'N/A'}`, fmtDate(bill.createdAt)));
  printer.println(`Table: ${bill.tableNumber || 'N/A'}   Cashier: ${truncate(bill.cashierName || '', 12)}`);
  if (bill.customerName) printer.println(`Customer: ${bill.customerName}`);

  printer.println(LINE);

  // ── Items ─────────────────────────────────────────────
  printer.bold(true);
  printer.println(colsItem('Item', 'Qty', 'Price', 'Amt', W));
  printer.bold(false);
  printer.println(LINE);

  (bill.items || []).forEach(item => {
    printer.println(colsItem(
      truncate(item.itemName, W - 22),
      String(item.quantity),
      Number(item.unitPrice  || 0).toFixed(2),
      Number(item.totalPrice || 0).toFixed(2),
      W
    ));
  });

  printer.println(LINE);

  // ── Totals ────────────────────────────────────────────
  printer.println(pad('Sub Total', fmt(bill.subtotal)));

  if (Number(bill.orderDiscount) > 0)
    printer.println(pad(`Discount ${bill.discountPct || ''}%`, `(${fmt(bill.orderDiscount)})`));
  if (Number(bill.cgstAmount) > 0)
    printer.println(pad('CGST', fmt(bill.cgstAmount)));
  if (Number(bill.sgstAmount) > 0)
    printer.println(pad('SGST', fmt(bill.sgstAmount)));
  if (Number(bill.serviceCharge) > 0)
    printer.println(pad('Service Charge', fmt(bill.serviceCharge)));
  if (Number(bill.roundOff) !== 0)
    printer.println(pad('Round Off', fmt(bill.roundOff)));

  printer.println(LINE);
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(pad('GRAND TOTAL', fmt(bill.totalAmount)));
  printer.bold(false);
  printer.setTextNormal();
  printer.println(LINE);

  // ── Payments ──────────────────────────────────────────
  (bill.payments || []).forEach(p =>
    printer.println(pad(`Paid (${p.paymentMethod})`, fmt(p.amount)))
  );
  if (Number(bill.changeReturned) > 0)
    printer.println(pad('Change Returned', fmt(bill.changeReturned)));

  printer.println(LINE);

  // ── Footer ────────────────────────────────────────────
  printer.alignCenter();
  if (bill.fssaiNumber) printer.println(`FSSAI Lic: ${bill.fssaiNumber}`);
  printer.println(bill.footerLine1 || 'Thank you for dining with us!');
  printer.println(bill.footerLine2 || '** Please Visit Again **');

  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.cut();
}

// ── Helpers ───────────────────────────────────────────

function colsItem(item, qty, price, amt, W) {
  const qW = 4, pW = 8, aW = 8;
  const iW = W - qW - pW - aW - 3;
  return truncate(item, iW).padEnd(iW)
       + qty.padStart(qW)
       + price.padStart(pW)
       + amt.padStart(aW);
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) : str;
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

module.exports = { printBill };
