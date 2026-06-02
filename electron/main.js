const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// ─── Thermal Printer ─────────────────────────────────
let ThermalPrinter, PrinterTypes, CharacterSet, BreakLine;
try {
  const tp = require('node-thermal-printer');
  ThermalPrinter  = tp.printer;
  PrinterTypes    = tp.types;
  CharacterSet    = tp.characterSet;
  BreakLine       = tp.breakLine;
} catch (e) {
  console.warn('node-thermal-printer not available:', e.message);
}

// ─── Store printer config ─────────────────────────────
let printerConfig = {
  type:       'EPSON',          // EPSON | STAR
  interface:  'tcp://192.168.1.100', // default — user configures in settings
  port:       9100,
  width:       48,              // characters per line (80mm = 48 chars)
  timeout:     3000,
};

// ─── Main Window ─────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  1024,
    minHeight: 600,
    autoHideMenuBar: true,
    title: 'ONENESS Dine',
    titleBarStyle: {
      alignCenter: true
    },
    icon: path.join(__dirname, 'logo192.png'),
    webPreferences: {
      nodeIntegration:    false,
      contextIsolation:   true,
      preload:            path.join(__dirname, 'preload.js'),
    },
  });

  // Load React app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);
  mainWindow.setMenuBarVisibility(false);

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

// ─── IPC: Get/Set printer config ─────────────────────
ipcMain.handle('printer:getConfig', () => printerConfig);

ipcMain.handle('printer:setConfig', (event, config) => {
  printerConfig = { ...printerConfig, ...config };
  return printerConfig;
});

ipcMain.handle('printer:test', async () => {
  try {
    const printer = createPrinter();
    printer.alignCenter();
    printer.println('ONENESS Dine');
    printer.println('Print test successful!');
    printer.cut();
    const success = await printer.execute();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: Print Bill ─────────────────────────────────
ipcMain.handle('printer:printBill', async (event, billData) => {
  try {
    const printer = createPrinter();
    printBillTemplate(printer, billData);
    await printer.execute();
    return { success: true };
  } catch (err) {
    console.error('Bill print error:', err);
    return { success: false, error: err.message };
  }
});

// ─── IPC: Print KOT ──────────────────────────────────
ipcMain.handle('printer:printKot', async (event, kotData) => {
  try {
    const printer = createPrinter();
    printKotTemplate(printer, kotData);
    await printer.execute();
    return { success: true };
  } catch (err) {
    console.error('KOT print error:', err);
    return { success: false, error: err.message };
  }
});

// ─── Create printer instance ─────────────────────────
function createPrinter() {
  return new ThermalPrinter({
    type:          PrinterTypes[printerConfig.type] || PrinterTypes.EPSON,
    interface:     printerConfig.interface,
    characterSet:  CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    width:         printerConfig.width || 48,
    options: {
      timeout: printerConfig.timeout || 3000,
    },
  });
}

// ─── Bill template ───────────────────────────────────
function printBillTemplate(printer, bill) {
  const W = printerConfig.width || 48;
  const divider = '-'.repeat(W);
  const fmt = (n) => `Rs.${Number(n||0).toFixed(2)}`;
  const pad = (left, right, total) => {
    const space = total - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  // Header
  if (bill.restaurantLogo) {
    printer.alignCenter();
    printer.printImage(bill.restaurantLogo).catch(() => {});
  }
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(bill.restaurantName || 'RESTAURANT');
  printer.bold(false);
  printer.setTextNormal();
  if (bill.restaurantAddress) printer.println(bill.restaurantAddress);
  if (bill.fssaiNumber)       printer.println(`FSSAI: ${bill.fssaiNumber}`);
  if (bill.gstNumber)         printer.println(`GSTIN: ${bill.gstNumber}`);
  printer.drawLine();

  // Bill info
  printer.alignLeft();
  printer.println(`Date: ${formatDate(bill.createdAt)}   Bill No: ${bill.billNumber}`);
  printer.println(`Table: ${bill.tableNumber || 'N/A'}   Cashier: ${bill.cashierName || ''}`);
  if (bill.customerName) printer.println(`Name: ${bill.customerName}`);
  printer.drawLine();

  // Column headers
  printer.bold(true);
  printer.println(padColumns('Item', 'Qty', 'Price', 'Amt', W));
  printer.bold(false);
  printer.drawLine();

  // Items
  (bill.items || []).forEach(item => {
    const name = item.itemName.substring(0, W - 22);
    printer.println(padColumns(name, String(item.quantity), item.unitPrice.toFixed(2), item.totalPrice.toFixed(2), W));
  });

  printer.drawLine();

  // Totals
  printer.println(`Total Qty: ${(bill.items||[]).reduce((s,i)=>s+i.quantity,0)}`);
  printer.println(pad('Sub Total', fmt(bill.subtotal), W));

  if (Number(bill.orderDiscount) > 0) {
    const pct = bill.discountPct ? ` ${bill.discountPct}%` : '';
    printer.println(pad(`Discount${pct}`, `(${fmt(bill.orderDiscount)})`, W));
  }
  if (Number(bill.serviceCharge) > 0)
    printer.println(pad('Service Charge', fmt(bill.serviceCharge), W));
  if (Number(bill.cgstAmount) > 0)
    printer.println(pad(`CGST ${getCgstRate(bill)}%`, fmt(bill.cgstAmount), W));
  if (Number(bill.sgstAmount) > 0)
    printer.println(pad(`SGST ${getSgstRate(bill)}%`, fmt(bill.sgstAmount), W));
  if (Number(bill.igstAmount) > 0)
    printer.println(pad('IGST', fmt(bill.igstAmount), W));
  if (Number(bill.roundOff) !== 0)
    printer.println(pad('Round off', fmt(bill.roundOff), W));

  printer.drawLine();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(pad('Grand Total', fmt(bill.totalAmount), W));
  printer.bold(false);
  printer.setTextNormal();
  printer.drawLine();

  // Payments
  (bill.payments || []).forEach(p => {
    printer.println(pad(`Paid via ${p.paymentMethod}`, fmt(p.amount), W));
  });
  if (Number(bill.changeReturned) > 0)
    printer.println(pad('Change', fmt(bill.changeReturned), W));

  printer.drawLine();

  // Footer
  printer.alignCenter();
  if (bill.fssaiNumber) printer.println(`FSSAI Lic No. ${bill.fssaiNumber}`);
  printer.println(bill.footerLine1 || '!!! Eat Right !!!');
  printer.println(bill.footerLine2 || '!! THANKS Visit Again !!');
  printer.newLine();
  printer.cut();
}

// ─── KOT template ────────────────────────────────────
function printKotTemplate(printer, kot) {
  const W = printerConfig.width || 48;

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println('KOT');
  printer.bold(false);
  printer.setTextNormal();

  printer.println(`${formatDateTime(kot.createdAt)}`);
  printer.bold(true);
  printer.println(`KOT # ${kot.kotNumber}`);
  printer.bold(false);
  printer.println(kot.orderType || 'Dine In');
  printer.println(`Table No: ${kot.tableNumber || 'N/A'}`);
  if (kot.waiterName) printer.println(`Biller: ${kot.waiterName}`);

  printer.drawLine();
  printer.alignLeft();

  // Column headers
  printer.bold(true);
  printer.println(padKotColumns('Item', 'Note', 'Qty', W));
  printer.bold(false);
  printer.drawLine();

  // Items
  (kot.items || []).forEach(item => {
    const name = item.itemName.substring(0, W - 14);
    const note = item.specialInstruction ? item.specialInstruction.substring(0, 6) : '--';
    printer.println(padKotColumns(name, note, String(item.quantity), W));
  });

  printer.drawLine();
  printer.cut();
}

// ─── Helpers ─────────────────────────────────────────
function padColumns(item, qty, price, amt, W) {
  const qtyW = 4, priceW = 8, amtW = 8;
  const nameW = W - qtyW - priceW - amtW - 3;
  return item.substring(0, nameW).padEnd(nameW)
    + qty.padStart(qtyW)
    + price.padStart(priceW)
    + amt.padStart(amtW);
}

function padKotColumns(item, note, qty, W) {
  const noteW = 8, qtyW = 4;
  const nameW = W - noteW - qtyW - 2;
  return item.substring(0, nameW).padEnd(nameW)
    + note.padEnd(noteW)
    + qty.padStart(qtyW);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function getCgstRate(bill) {
  return bill.subtotal > 0
    ? ((Number(bill.cgstAmount) / Number(bill.subtotal)) * 100).toFixed(1)
    : '2.5';
}
function getSgstRate(bill) {
  return bill.subtotal > 0
    ? ((Number(bill.sgstAmount) / Number(bill.subtotal)) * 100).toFixed(1)
    : '2.5';
}
