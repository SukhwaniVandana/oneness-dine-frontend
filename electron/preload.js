const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Window controls
  minimize:    () => ipcRenderer.invoke('window:minimize'),
  maximize:    () => ipcRenderer.invoke('window:maximize'),
  close:       () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Printer
  getPrinterConfig: ()       => ipcRenderer.invoke('printer:getConfig'),
  setPrinterConfig: (config) => ipcRenderer.invoke('printer:setConfig', config),
  testPrinter:      ()       => ipcRenderer.invoke('printer:test'),
  printBill:        (data)   => ipcRenderer.invoke('printer:printBill', data),
  printKot:         (data)   => ipcRenderer.invoke('printer:printKot',  data),
});
