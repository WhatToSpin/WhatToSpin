import { app, BrowserWindow } from 'electron';
import path from 'path';

let registerIpcHandlers;

async function loadModules() {
    const ipcModule = await import('./registerIpcHandlers.js');
    registerIpcHandlers = ipcModule.registerIpcHandlers;
}

async function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 350,
        show: false,
        resizable: false,
        titleBarStyle: 'customButtonsOnHover',
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    await mainWindow.loadFile('src/index.html');
    mainWindow.show();
}

app.whenReady().then(async () => {
    await loadModules();
    registerIpcHandlers();
    createWindow();
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
    