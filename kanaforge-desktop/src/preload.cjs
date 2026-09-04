const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kanaforgeDesktop', {
  getAppInfo: () => ipcRenderer.invoke('kanaforge:app-info'),
  openExternal: (url) => ipcRenderer.invoke('kanaforge:open-external', url),
});
