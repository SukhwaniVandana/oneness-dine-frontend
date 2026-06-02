const { contextBridge, ipcRenderer } = require('electron');

// Expose safe print API to React renderer
contextBridge.exposeInMainWorld('electronAPI', {

  // Printer config
  getPrinterConfig: ()       => ipcRenderer.invoke('printer:getConfig'),
  setPrinterConfig: (config) => ipcRenderer.invoke('printer:setConfig', config),
  testPrinter:      ()       => ipcRenderer.invoke('printer:test'),

  // Printing
  printBill: (billData) => ipcRenderer.invoke('printer:printBill', billData),
  printKot:  (kotData)  => ipcRenderer.invoke('printer:printKot',  kotData),

  // Check if running in Electron
  isElectron: true,
});
