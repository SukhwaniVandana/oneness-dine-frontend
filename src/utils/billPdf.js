// src/utils/billPdf.js
// Requires: npm install jspdf

import { jsPDF } from 'jspdf';

const fmtC = (n) => 'Rs. ' + Number(n || 0).toFixed(2);
const fmtDT = (s) => {
  if (!s) return '';
  const d = new Date(s);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
};

const PAYMENT_LABELS = {
  CASH: 'Cash', CARD: 'Card', UPI: 'UPI',
  CREDIT: 'Credit / Due', WALLET: 'Wallet',
};

export function generateBillPdf(bill) {
  const doc   = new jsPDF({ unit: 'mm', format: 'a4' });
  const W     = doc.internal.pageSize.getWidth();   // 210 mm
  const L     = 20;   // left margin
  const R     = W - 20; // right margin
  let   y     = 20;

  const line  = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
  const text  = (t, x, yy, opts = {}) => doc.text(String(t ?? ''), x, yy, opts);
  const hr    = (yy) => { doc.setDrawColor(200); line(L, yy, R, yy); return yy; };

  /* ── Header ── */
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  text(bill.branchName || 'Restaurant', W / 2, y, { align: 'center' });
  y += 6;

  if (bill.branchAddress) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    text(bill.branchAddress, W / 2, y, { align: 'center' });
    y += 5;
  }
  if (bill.branchGstin) {
    doc.setFontSize(8);
    text(`GSTIN: ${bill.branchGstin}`, W / 2, y, { align: 'center' });
    y += 5;
  }
  doc.setTextColor(0);

  y += 2;
  hr(y); y += 6;

  /* ── Bill meta ── */
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  text('TAX INVOICE', W / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const meta = [
    ['Bill #',   bill.billNumber  || '—', 'Order #',  bill.orderNumber || '—'],
    ['Date',     fmtDT(bill.createdAt),  'Table',    bill.tableNumber != null ? `T-${bill.tableNumber}` : '—'],
    ['Status',   bill.billStatus  || '—', 'Customer', bill.customerName || 'Walk-in'],
  ];

  meta.forEach(([lk, lv, rk, rv]) => {
    doc.setFont('helvetica', 'bold');
    text(`${lk}:`, L, y);
    doc.setFont('helvetica', 'normal');
    text(lv, L + 22, y);
    doc.setFont('helvetica', 'bold');
    text(`${rk}:`, W / 2, y);
    doc.setFont('helvetica', 'normal');
    text(rv, W / 2 + 22, y);
    y += 6;
  });

  y += 2;
  hr(y); y += 6;

  /* ── Items table header ── */
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(L, y - 4, R - L, 7, 'F');
  text('#',        L,       y);
  text('Item',     L + 7,   y);
  text('Qty',      R - 38,  y, { align: 'right' });
  text('Rate',     R - 20,  y, { align: 'right' });
  text('Amount',   R,       y, { align: 'right' });
  y += 5;
  hr(y); y += 4;

  /* ── Items rows ── */
  doc.setFont('helvetica', 'normal');
  const items = bill.items || [];
  items.forEach((item, idx) => {
    const name  = item.itemName || item.name || '—';
    const qty   = item.quantity ?? 1;
    const rate  = Number(item.unitPrice || item.price || 0);
    const total = Number(item.totalPrice || rate * qty || 0);

    // Wrap long item names
    const lines = doc.splitTextToSize(name, 80);
    text(idx + 1,        L,      y);
    doc.text(lines,       L + 7,  y);
    text(qty,             R - 38, y, { align: 'right' });
    text(fmtC(rate),      R - 20, y, { align: 'right' });
    text(fmtC(total),     R,      y, { align: 'right' });
    y += lines.length * 5 + 1;

    // Page break guard
    if (y > 260) { doc.addPage(); y = 20; }
  });

  y += 2;
  hr(y); y += 6;

  /* ── Totals ── */
  const totals = [
    { label: 'Subtotal',      value: bill.subtotal      },
    Number(bill.orderDiscount) > 0 && { label: 'Order Discount (-)', value: -Number(bill.orderDiscount), red: true },
    Number(bill.itemDiscount)  > 0 && { label: 'Item Discount (-)',  value: -Number(bill.itemDiscount),  red: true },
    Number(bill.cgstAmount)    > 0 && { label: `CGST (${bill.cgstRate || ''}%)`, value: bill.cgstAmount },
    Number(bill.sgstAmount)    > 0 && { label: `SGST (${bill.sgstRate || ''}%)`, value: bill.sgstAmount },
    Number(bill.serviceCharge) > 0 && { label: 'Service Charge',    value: bill.serviceCharge },
  ].filter(Boolean);

  doc.setFontSize(9);
  totals.forEach(({ label, value, red }) => {
    doc.setFont('helvetica', 'normal');
    if (red) doc.setTextColor(180, 0, 0);
    text(label,       R - 60, y);
    text(fmtC(Math.abs(value)), R, y, { align: 'right' });
    doc.setTextColor(0);
    y += 6;
  });

  // Grand total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setFillColor(240, 240, 240);
  doc.rect(R - 70, y - 4, 70, 8, 'F');
  text('TOTAL',          R - 60, y);
  text(fmtC(bill.totalAmount), R, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 10;

  /* ── Payments ── */
  const payments = bill.payments || [];
  if (payments.length) {
    doc.setFont('helvetica', 'bold');
    text('Payment', L, y); y += 5;
    doc.setFont('helvetica', 'normal');
    payments.forEach(p => {
      text(`${PAYMENT_LABELS[p.paymentMethod] || p.paymentMethod}`, L + 4, y);
      text(fmtC(p.amount), R, y, { align: 'right' });
      y += 5;
    });
    y += 4;
  }

  hr(y); y += 8;

  /* ── Footer ── */
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'italic');
  text('Thank you for dining with us!', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  text(`Generated: ${fmtDT(new Date().toISOString())}`, W / 2, y, { align: 'center' });
  doc.setTextColor(0);

  /* ── Save ── */
  const filename = `bill_${bill.billNumber || bill.id || 'download'}.pdf`;
  doc.save(filename);
}
