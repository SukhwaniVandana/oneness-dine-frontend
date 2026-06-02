/**
 * PrintService
 * Handles printing from React side.
 * - In Electron: uses IPC → node-thermal-printer → physical printer
 * - In browser:  uses window.print() with print-optimized CSS (fallback)
 */

const isElectron = () =>
  typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

/* ─────────────────────────────────────────────────────
   PRINT BILL
───────────────────────────────────────────────────── */
export async function printBill(bill, restaurantInfo) {
  const payload = buildBillPayload(bill, restaurantInfo);

  if (isElectron()) {
    const result = await window.electronAPI.printBill(payload);
    if (!result.success) throw new Error(result.error || 'Print failed');
    return result;
  }

  // Browser fallback — open print window
  browserPrintBill(payload);
  return { success: true };
}

/* ─────────────────────────────────────────────────────
   PRINT KOT
───────────────────────────────────────────────────── */
export async function printKot(kot, restaurantInfo) {
  const payload = buildKotPayload(kot, restaurantInfo);

  if (isElectron()) {
    const result = await window.electronAPI.printKot(payload);
    if (!result.success) throw new Error(result.error || 'Print failed');
    return result;
  }

  // Browser fallback
  browserPrintKot(payload);
  return { success: true };
}

/* ─────────────────────────────────────────────────────
   TEST PRINTER
───────────────────────────────────────────────────── */
export async function testPrinter() {
  if (isElectron()) {
    return window.electronAPI.testPrinter();
  }
  return { success: false, error: 'Test print only available in desktop app' };
}

/* ─────────────────────────────────────────────────────
   PRINTER CONFIG
───────────────────────────────────────────────────── */
export async function getPrinterConfig() {
  if (isElectron()) return window.electronAPI.getPrinterConfig();
  return null;
}

export async function setPrinterConfig(config) {
  if (isElectron()) return window.electronAPI.setPrinterConfig(config);
  return null;
}

/* ─────────────────────────────────────────────────────
   BUILD PAYLOADS
───────────────────────────────────────────────────── */
function buildBillPayload(bill, info = {}) {
  return {
    ...bill,
    restaurantName:    info.restaurantName    || '',
    restaurantAddress: info.restaurantAddress || '',
    fssaiNumber:       info.fssaiNumber       || '',
    gstNumber:         info.gstNumber         || '',
    footerLine1:       info.footerLine1       || '',
    footerLine2:       info.footerLine2       || '!! THANKS Visit Again !!',
    cashierName:       info.cashierName       || '',
  };
}

function buildKotPayload(kot, info = {}) {
  return {
    ...kot,
    waiterName: kot.waiterName || info.cashierName || '',
  };
}

/* ─────────────────────────────────────────────────────
   BROWSER FALLBACK — print via HTML window
───────────────────────────────────────────────────── */
function browserPrintBill(bill) {
  const fmt = (n) => `Rs.${Number(n||0).toFixed(2)}`;
  const rows = (bill.items || []).map(i =>
    `<tr>
      <td>${i.itemName}</td>
      <td class="c">${i.quantity}</td>
      <td class="r">${Number(i.unitPrice||0).toFixed(2)}</td>
      <td class="r">${Number(i.totalPrice||0).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: monospace; font-size: 11px; width: 80mm; padding: 4px; }
    h2 { font-size: 14px; text-align: center; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    .c { text-align: center; width: 30px; }
    .r { text-align: right; width: 60px; }
    .total-row td { border-top: 1px dashed #000; font-weight: bold; }
    .grand td { font-size: 14px; font-weight: bold; }
    @media print { @page { margin: 0; size: 80mm auto; } }
  </style></head><body>
  <div class="center bold" style="font-size:14px">${bill.restaurantName || 'RESTAURANT'}</div>
  ${bill.restaurantAddress ? `<div class="center">${bill.restaurantAddress}</div>` : ''}
  ${bill.fssaiNumber ? `<div class="center">FSSAI: ${bill.fssaiNumber}</div>` : ''}
  <hr>
  <div>Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')} &nbsp; Bill: ${bill.billNumber}</div>
  <div>Table: ${bill.tableNumber || 'N/A'} &nbsp; Cashier: ${bill.cashierName || ''}</div>
  ${bill.customerName ? `<div>Name: ${bill.customerName}</div>` : ''}
  <hr>
  <table>
    <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Amt</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <hr>
  <table>
    <tr><td>Sub Total</td><td class="r">${fmt(bill.subtotal)}</td></tr>
    ${Number(bill.orderDiscount)>0 ? `<tr><td>Discount ${bill.discountPct||''}%</td><td class="r">(${fmt(bill.orderDiscount)})</td></tr>` : ''}
    ${Number(bill.cgstAmount)>0    ? `<tr><td>CGST</td><td class="r">${fmt(bill.cgstAmount)}</td></tr>` : ''}
    ${Number(bill.sgstAmount)>0    ? `<tr><td>SGST</td><td class="r">${fmt(bill.sgstAmount)}</td></tr>` : ''}
    ${Number(bill.serviceCharge)>0 ? `<tr><td>Service Charge</td><td class="r">${fmt(bill.serviceCharge)}</td></tr>` : ''}
    ${Number(bill.roundOff)!==0    ? `<tr><td>Round off</td><td class="r">${fmt(bill.roundOff)}</td></tr>` : ''}
    <tr class="grand"><td>Grand Total</td><td class="r">${fmt(bill.totalAmount)}</td></tr>
  </table>
  <hr>
  ${(bill.payments||[]).map(p=>`<div>${p.paymentMethod}: ${fmt(p.amount)}</div>`).join('')}
  ${Number(bill.changeReturned)>0 ? `<div>Change: ${fmt(bill.changeReturned)}</div>` : ''}
  <hr>
  <div class="center">${bill.footerLine1 || ''}</div>
  <div class="center">${bill.footerLine2 || '!! THANKS Visit Again !!'}</div>
  </body></html>`;

  openPrintWindow(html);
}

function browserPrintKot(kot) {
  const rows = (kot.items || []).map(i =>
    `<tr>
      <td>${i.itemName}</td>
      <td>${i.specialInstruction || '--'}</td>
      <td class="c">${i.quantity}</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: monospace; font-size: 12px; width: 80mm; padding: 4px; }
    h2 { font-size: 16px; text-align: center; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 3px 0; vertical-align: top; }
    .c { text-align: center; width: 30px; }
    @media print { @page { margin: 0; size: 80mm auto; } }
  </style></head><body>
  <div class="center bold" style="font-size:16px">KOT</div>
  <div class="center">${new Date(kot.createdAt).toLocaleString('en-IN')}</div>
  <div class="center bold">KOT # ${kot.kotNumber}</div>
  <div class="center">${kot.orderType || 'Dine In'}</div>
  <div class="center bold">Table No: ${kot.tableNumber || 'N/A'}</div>
  ${kot.waiterName ? `<div>Biller: ${kot.waiterName}</div>` : ''}
  <hr>
  <table>
    <thead><tr><th>Item</th><th>Note</th><th class="c">Qty</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <hr>
  </body></html>`;

  openPrintWindow(html);
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=400,height=600');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 500);
}
