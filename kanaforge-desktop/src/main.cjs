const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const rendererDirectory = app.isPackaged
  ? path.join(process.resourcesPath, 'renderer')
  : path.resolve(__dirname, '..', '..', 'dist', 'client');

function isAllowedExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#06090b',
    title: 'KanaForge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) event.preventDefault();
  });

  window.loadFile(path.join(rendererDirectory, 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('kanaforge:app-info', () => ({
    desktop: true,
    version: app.getVersion(),
  }));

  ipcMain.handle('kanaforge:open-external', async (_event, url) => {
    if (!isAllowedExternalUrl(url)) throw new Error('Adresse externe non autorisée.');
    await shell.openExternal(url);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
