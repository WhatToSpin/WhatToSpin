const { app, BrowserWindow } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./registerIpcHandlers');

async function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 380,
        minWidth: 600,
        minHeight: 380,
        show: false,
        resizable: true,
        titleBarStyle: 'customButtonsOnHover',
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.show();
}

app.whenReady().then(async () => {
    registerIpcHandlers();
    await createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
