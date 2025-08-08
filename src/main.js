import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let registerIpcHandlers;

async function loadModules() {
    const ipcModule = await import('../utils/registerIpcHandlers.js');
    registerIpcHandlers = ipcModule.registerIpcHandlers;
}

async function createWindow() {
    const window = new BrowserWindow({
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

    await window.loadFile('src/index.html');
    window.show();
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
    