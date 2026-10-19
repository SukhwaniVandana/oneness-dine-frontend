const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// ── Printer modules ───────────────────────────────────
const { testPrint, doPrintBill, doPrintKot } = require('./printer/index');

// ── Default printer config ────────────────────────────
// connectionType: USB | BLUETOOTH | LAN | WIFI
// address:
//   USB/BLUETOOTH → COM port number e.g. "COM11"
//   LAN/WIFI      → IP[:port]      e.g. "192.168.1.100" or "192.168.1.100:9100"
let printerConfig = {
  brand:          'EPSON',
  connectionType: 'USB',
  address:        'COM11',
  paperWidth:     '80',
  timeout:        5000,
};

// ── Main Window ───────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        1024,
    minHeight:       600,
    frame:           false,
    titleBarStyle:   'hidden',
    transparent:     false,
    backgroundColor: '#0d0f14',
    icon: path.join(__dirname, '../public/logo192.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.maximize();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// ── Window Controls ───────────────────────────────────
ipcMain.handle('window:minimize',    () => mainWindow?.minimize());
ipcMain.handle('window:maximize',    () => {
  if (mainWindow?.isMaximized()) mainWindow.restore();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close',       () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

// ── Printer IPC ───────────────────────────────────────

ipcMain.handle('printer:getConfig', () => printerConfig);

ipcMain.handle('printer:setConfig', (_, config) => {
  printerConfig = { ...printerConfig, ...config };
  console.log('[Printer] Config saved:', JSON.stringify(printerConfig));
  return { success: true, config: printerConfig };
});

ipcMain.handle('printer:test', async () => {
  console.log('[Printer] Test print started | config:', JSON.stringify(printerConfig));
  try {
    await testPrint(printerConfig);
    console.log('[Printer] Test print SUCCESS');
    return { success: true };
  } catch (err) {
    console.error('[Printer] Test print FAILED:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('printer:printBill', async (_, billData) => {
  console.log('[Printer] Bill print | Bill#:', billData?.billNumber);
  try {
    await doPrintBill(printerConfig, billData);
    console.log('[Printer] Bill print SUCCESS');
    return { success: true };
  } catch (err) {
    console.error('[Printer] Bill print FAILED:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('printer:printKot', async (_, kotData) => {
  console.log('[Printer] KOT print | KOT#:', kotData?.kotNumber);
  try {
    await doPrintKot(printerConfig, kotData);
    console.log('[Printer] KOT print SUCCESS');
    return { success: true };
  } catch (err) {
    console.error('[Printer] KOT print FAILED:', err.message);
    return { success: false, error: err.message };
  }
});
