/**
 * ONENESS Dine — KOT Print Template (ESC/POS)
 */

function printKot(printer, kot, paperWidth) {
  const W    = paperWidth === '58' ? 32 : 48;
  const LINE = '-'.repeat(W);

  // ── Header ───────────────────────────────────────────
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println('*** KOT ***');
  printer.setTextNormal();
  printer.println(fmtDateTime(kot.createdAt));
  printer.bold(false);

  printer.println(LINE);

  // ── Order Info ────────────────────────────────────────
  printer.bold(true);
  printer.println(`KOT # ${kot.kotNumber || 'N/A'}`);
  printer.bold(false);
  printer.println(`Type   : ${kot.orderType || 'Dine In'}`);
  printer.println(`Table  : ${kot.tableNumber || 'N/A'}`);
  if (kot.waiterName) printer.println(`Waiter : ${kot.waiterName}`);

  printer.println(LINE);

  // ── Items ─────────────────────────────────────────────
  printer.bold(true);
  printer.println(colsKot('Item', 'Note', 'Qty', W));
  printer.bold(false);
  printer.println(LINE);

  (kot.items || []).forEach(item => {
    printer.println(colsKot(
      item.itemName || '',
      item.specialInstruction ? item.specialInstruction.substring(0, 8) : '--',
      String(item.quantity),
      W
    ));
  });

  printer.println(LINE);
  printer.newLine();
  printer.newLine();
  printer.cut();
}

// ── Helpers ───────────────────────────────────────────

function colsKot(item, note, qty, W) {
  const nW = 8, qW = 4;
  const iW = W - nW - qW - 2;
  return truncate(item, iW).padEnd(iW)
       + truncate(note, nW).padEnd(nW)
       + qty.padStart(qW);
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) : str;
}

function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  const date = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${date}  ${time}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

module.exports = { printKot };
