/**
 * ONENESS Dine — Printer Factory
 * Supports: USB (COM port or USB direct), Bluetooth (COM), LAN/WiFi (TCP)
 *
 * USB/Bluetooth via node-thermal-printer (COM port approach)
 * USB direct (USB002) via raw fs write — fallback when COM not available
 * LAN/WiFi via node-thermal-printer TCP
 */

const fs = require('fs');

let ThermalPrinter, PrinterTypes, CharacterSet;
try {
  const tp = require('node-thermal-printer');
  ThermalPrinter = tp.printer;
  PrinterTypes   = tp.types;
  CharacterSet   = tp.characterSet;
} catch (e) {
  console.error('[Printer] node-thermal-printer not available:', e.message);
}

// ── ESC/POS constants ─────────────────────────────────
const ESC = 0x1B;
const GS  = 0x1D;
const NL  = 0x0A;

/**
 * Detect if address is a raw USB device (USB001, USB002 etc)
 * vs a COM port (COM1, COM11 etc)
 */
function isRawUsb(address) {
  return /^USB\d+$/i.test(address.trim());
}

/**
 * Build the interface string for node-thermal-printer
 * USB COM / Bluetooth → \\.\COMx
 * LAN/WiFi            → tcp://ip:port
 */
function buildInterface(connectionType, address) {
  switch (connectionType) {
    case 'BLUETOOTH':
    case 'USB': {
      const clean = address.trim().replace(/^\\\\\.\\/i, '');
      // Normalise COM prefix
      const normalised = clean.replace(/^com/i, 'COM');
      return `\\\\.\\${normalised}`;
    }
    case 'LAN':
    case 'WIFI': {
      if (address.trim().startsWith('tcp://')) return address.trim();
      const [host, port] = address.trim().split(':');
      return `tcp://${host}:${port || 9100}`;
    }
    default:
      return address.trim();
  }
}

/**
 * Create a node-thermal-printer instance (LAN / WiFi / COM-based USB / Bluetooth)
 */
function createPrinter(config) {
  const iface = buildInterface(config.connectionType, config.address);
  console.log(`[Printer] Interface: ${iface} | Type: ${config.connectionType}`);

  return new ThermalPrinter({
    type:         PrinterTypes[config.brand] || PrinterTypes.EPSON,
    interface:    iface,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    width:        config.paperWidth === '58' ? 32 : 48,
    options: { timeout: config.timeout || 5000 },
  });
}

/**
 * Raw USB print — bypasses node-thermal-printer entirely
 * Used when address is USB001/USB002 etc.
 * Accepts a Buffer of ESC/POS bytes.
 */
function rawUsbWrite(address, dataBuffer) {
  return new Promise((resolve, reject) => {
    const devicePath = `\\\\.\\${address.trim().toUpperCase()}`;
    console.log(`[Printer] Raw USB write → ${devicePath}`);
    const stream = fs.createWriteStream(devicePath, { flags: 'a' });
    stream.on('error', reject);
    stream.write(dataBuffer, (err) => {
      if (err) return reject(err);
      stream.end(() => resolve('done'));
    });
  });
}

/**
 * Windows printer name print — uses a temp file + copy command
 * Works for USB002, COM ports, and any Windows-registered printer
 * address = Windows printer name e.g. "POS80 Printer"
 */
function windowsPrinterWrite(printerName, dataBuffer) {
  return new Promise((resolve, reject) => {
    const { execFile } = require('child_process');
    const os   = require('os');
    const path = require('path');

    // Write ESC/POS bytes to a temp file
    const tmpFile = path.join(os.tmpdir(), `escpos_${Date.now()}.bin`);
    fs.writeFile(tmpFile, dataBuffer, (writeErr) => {
      if (writeErr) return reject(writeErr);

      // Use Windows `copy /b` to send raw bytes to printer
      // Pass args as array to avoid shell quoting issues
      const args = ['/c', 'copy', '/b', tmpFile, printerName];
      console.log(`[Printer] Windows copy → cmd.exe ${args.join(' ')}`);

      execFile('cmd.exe', args, (err, stdout, stderr) => {
        // Clean up temp file
        fs.unlink(tmpFile, () => {});
        if (err) {
          console.error(`[Printer] copy error:`, stderr || err.message);
          return reject(new Error(stderr || err.message));
        }
        console.log(`[Printer] copy stdout:`, stdout.trim());
        resolve('done');
      });
    });
  });
}

/**
 * Detect if address is a Windows printer name (not a port/IP)
 * Windows printer names contain spaces or are not USB/COM/IP format
 */
function isWindowsPrinterName(address) {
  const a = address.trim();
  // Not a COM port, not USB00x, not an IP address
  return !/^(COM\d+|USB\d+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i.test(a)
      && !a.startsWith('tcp://');
}

/**
 * Build ESC/POS test receipt as a Buffer (used for raw USB)
 */
function buildTestBuffer(config) {
  const W    = config.paperWidth === '58' ? 32 : 48;
  const LINE = '-'.repeat(W);

  const lines = [
    Buffer.from([ESC, 0x40]),               // Init
    Buffer.from([ESC, 0x61, 0x01]),         // Center
    Buffer.from([ESC, 0x45, 0x01]),         // Bold on
    Buffer.from('ONENESS Dine\n'),
    Buffer.from([ESC, 0x45, 0x00]),         // Bold off
    Buffer.from('Printer Test\n'),
    Buffer.from(LINE + '\n'),
    Buffer.from([ESC, 0x61, 0x00]),         // Left
    Buffer.from(`Brand   : ${config.brand}\n`),
    Buffer.from(`Connect : ${config.connectionType}\n`),
    Buffer.from(`Address : ${config.address}\n`),
    Buffer.from(`Width   : ${config.paperWidth}mm\n`),
    Buffer.from(LINE + '\n'),
    Buffer.from([ESC, 0x61, 0x01]),         // Center
    Buffer.from('** Test Successful **\n'),
    Buffer.from([NL, NL, NL]),              // Feed
    Buffer.from([GS, 0x56, 0x41, 0x03]),   // Full cut
  ];

  return Buffer.concat(lines);
}

/**
 * Build ESC/POS bill as a Buffer (used for raw USB)
 */
function buildBillBuffer(bill, paperWidth) {
  const W    = paperWidth === '58' ? 32 : 48;
  const LINE = '-'.repeat(W);
  const fmt  = (n) => `Rs.${Number(n || 0).toFixed(2)}`;
  const pad  = (l, r) => l + ' '.repeat(Math.max(1, W - l.length - r.length)) + r;

  const lines = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x61, 0x01]),
    Buffer.from([ESC, 0x45, 0x01]),
    Buffer.from((bill.restaurantName || 'RESTAURANT') + '\n'),
    Buffer.from([ESC, 0x45, 0x00]),
  ];

  if (bill.restaurantAddress) lines.push(Buffer.from(bill.restaurantAddress + '\n'));
  if (bill.gstNumber)         lines.push(Buffer.from(`GSTIN: ${bill.gstNumber}\n`));
  if (bill.fssaiNumber)       lines.push(Buffer.from(`FSSAI: ${bill.fssaiNumber}\n`));

  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from([ESC, 0x61, 0x00]));
  lines.push(Buffer.from(`Bill: ${bill.billNumber || 'N/A'}  ${fmtDate(bill.createdAt)}\n`));
  lines.push(Buffer.from(`Table: ${bill.tableNumber || 'N/A'}  Cashier: ${(bill.cashierName || '').substring(0, 12)}\n`));
  if (bill.customerName) lines.push(Buffer.from(`Customer: ${bill.customerName}\n`));
  lines.push(Buffer.from(LINE + '\n'));

  // Items header
  lines.push(Buffer.from([ESC, 0x45, 0x01]));
  lines.push(Buffer.from(colsItem('Item', 'Qty', 'Price', 'Amt', W) + '\n'));
  lines.push(Buffer.from([ESC, 0x45, 0x00]));
  lines.push(Buffer.from(LINE + '\n'));

  (bill.items || []).forEach(item => {
    lines.push(Buffer.from(colsItem(
      (item.itemName || '').substring(0, W - 22),
      String(item.quantity),
      Number(item.unitPrice  || 0).toFixed(2),
      Number(item.totalPrice || 0).toFixed(2),
      W
    ) + '\n'));
  });

  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from(pad('Sub Total', fmt(bill.subtotal)) + '\n'));
  if (Number(bill.orderDiscount) > 0)  lines.push(Buffer.from(pad(`Discount`, `(${fmt(bill.orderDiscount)})`) + '\n'));
  if (Number(bill.cgstAmount)    > 0)  lines.push(Buffer.from(pad('CGST', fmt(bill.cgstAmount)) + '\n'));
  if (Number(bill.sgstAmount)    > 0)  lines.push(Buffer.from(pad('SGST', fmt(bill.sgstAmount)) + '\n'));
  if (Number(bill.serviceCharge) > 0)  lines.push(Buffer.from(pad('Service Charge', fmt(bill.serviceCharge)) + '\n'));
  if (Number(bill.roundOff)     !== 0) lines.push(Buffer.from(pad('Round Off', fmt(bill.roundOff)) + '\n'));

  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from([ESC, 0x45, 0x01]));
  lines.push(Buffer.from(pad('GRAND TOTAL', fmt(bill.totalAmount)) + '\n'));
  lines.push(Buffer.from([ESC, 0x45, 0x00]));
  lines.push(Buffer.from(LINE + '\n'));

  (bill.payments || []).forEach(p =>
    lines.push(Buffer.from(pad(`Paid (${p.paymentMethod})`, fmt(p.amount)) + '\n'))
  );
  if (Number(bill.changeReturned) > 0)
    lines.push(Buffer.from(pad('Change', fmt(bill.changeReturned)) + '\n'));

  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from([ESC, 0x61, 0x01]));
  lines.push(Buffer.from((bill.footerLine1 || 'Thank you for dining with us!') + '\n'));
  lines.push(Buffer.from((bill.footerLine2 || '** Please Visit Again **') + '\n'));
  lines.push(Buffer.from([NL, NL, NL]));
  lines.push(Buffer.from([GS, 0x56, 0x41, 0x03]));

  return Buffer.concat(lines);
}

/**
 * Build ESC/POS KOT as a Buffer (used for raw USB)
 */
function buildKotBuffer(kot, paperWidth) {
  const W    = paperWidth === '58' ? 32 : 48;
  const LINE = '-'.repeat(W);

  const lines = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x61, 0x01]),
    Buffer.from([ESC, 0x45, 0x01]),
    Buffer.from('*** KOT ***\n'),
    Buffer.from([ESC, 0x45, 0x00]),
    Buffer.from(fmtDateTime(kot.createdAt) + '\n'),
    Buffer.from(LINE + '\n'),
    Buffer.from([ESC, 0x45, 0x01]),
    Buffer.from(`KOT # ${kot.kotNumber || 'N/A'}\n`),
    Buffer.from([ESC, 0x45, 0x00]),
    Buffer.from([ESC, 0x61, 0x00]),
    Buffer.from(`Type   : ${kot.orderType || 'Dine In'}\n`),
    Buffer.from(`Table  : ${kot.tableNumber || 'N/A'}\n`),
  ];

  if (kot.waiterName) lines.push(Buffer.from(`Waiter : ${kot.waiterName}\n`));
  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from([ESC, 0x45, 0x01]));
  lines.push(Buffer.from(colsKot('Item', 'Note', 'Qty', W) + '\n'));
  lines.push(Buffer.from([ESC, 0x45, 0x00]));
  lines.push(Buffer.from(LINE + '\n'));

  (kot.items || []).forEach(item => {
    lines.push(Buffer.from(colsKot(
      item.itemName || '',
      item.specialInstruction ? item.specialInstruction.substring(0, 8) : '--',
      String(item.quantity),
      W
    ) + '\n'));
  });

  lines.push(Buffer.from(LINE + '\n'));
  lines.push(Buffer.from([NL, NL]));
  lines.push(Buffer.from([GS, 0x56, 0x41, 0x03]));

  return Buffer.concat(lines);
}

// ── Main exported functions ───────────────────────────

/**
 * Test print — auto-detects USB raw vs TCP/COM
 */
async function testPrint(config) {
  const buf = buildTestBuffer(config);
  if (config.connectionType === 'USB' && isRawUsb(config.address)) {
    await rawUsbWrite(config.address, buf);
  } else if (config.connectionType === 'USB' && isWindowsPrinterName(config.address)) {
    await windowsPrinterWrite(config.address, buf);
  } else {
    const printer = createPrinter(config);
    const W    = config.paperWidth === '58' ? 32 : 48;
    const LINE = '-'.repeat(W);
    printer.alignCenter();
    printer.bold(true);  printer.println('ONENESS Dine');
    printer.bold(false); printer.println('Printer Test');
    printer.println(LINE);
    printer.alignLeft();
    printer.println(`Brand   : ${config.brand}`);
    printer.println(`Connect : ${config.connectionType}`);
    printer.println(`Address : ${config.address}`);
    printer.println(`Width   : ${config.paperWidth}mm`);
    printer.println(LINE);
    printer.alignCenter();
    printer.println('** Test Successful **');
    printer.newLine(); printer.newLine(); printer.newLine();
    printer.cut();
    await printer.execute();
  }
}

/**
 * Print bill — auto-detects USB raw vs TCP/COM
 */
async function doPrintBill(config, billData) {
  const buf = buildBillBuffer(billData, config.paperWidth);
  if (config.connectionType === 'USB' && isRawUsb(config.address)) {
    await rawUsbWrite(config.address, buf);
  } else if (config.connectionType === 'USB' && isWindowsPrinterName(config.address)) {
    await windowsPrinterWrite(config.address, buf);
  } else {
    const { printBill } = require('./templates/bill');
    const printer = createPrinter(config);
    printBill(printer, billData, config.paperWidth);
    await printer.execute();
  }
}

/**
 * Print KOT — auto-detects USB raw vs TCP/COM
 */
async function doPrintKot(config, kotData) {
  const buf = buildKotBuffer(kotData, config.paperWidth);
  if (config.connectionType === 'USB' && isRawUsb(config.address)) {
    await rawUsbWrite(config.address, buf);
  } else if (config.connectionType === 'USB' && isWindowsPrinterName(config.address)) {
    await windowsPrinterWrite(config.address, buf);
  } else {
    const { printKot } = require('./templates/kot');
    const printer = createPrinter(config);
    printKot(printer, kotData, config.paperWidth);
    await printer.execute();
  }
}

// ── Helpers ───────────────────────────────────────────

function colsItem(item, qty, price, amt, W) {
  const qW = 4, pW = 8, aW = 8, iW = W - qW - pW - aW - 3;
  return (item || '').substring(0, iW).padEnd(iW)
       + qty.padStart(qW) + price.padStart(pW) + amt.padStart(aW);
}

function colsKot(item, note, qty, W) {
  const nW = 8, qW = 4, iW = W - nW - qW - 2;
  return (item || '').substring(0, iW).padEnd(iW)
       + (note || '').substring(0, nW).padEnd(nW)
       + qty.padStart(qW);
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${fmtDate(s)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

module.exports = { createPrinter, testPrint, doPrintBill, doPrintKot, buildInterface, isRawUsb };
