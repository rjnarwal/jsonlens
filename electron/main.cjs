const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'JSONLens - Semantic JSON Diff, Formatter & Type Generator',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#080f1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
  });

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }

  const indexPath = path.join(__dirname, '../jsonlens-dist/index.html');
  win.loadFile(indexPath);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
