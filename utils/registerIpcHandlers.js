import { ipcMain } from 'electron';
import { addAlbumToCollection, getAlbumsFromCollection, deleteAlbumFromCollection, updateAlbumInCollection } from './albumManager.js';
import { BrowserWindow } from 'electron';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function registerIpcHandlers() {

    ipcMain.handle('get-albums', async () => {
        try {
            const collection = await getAlbumsFromCollection();
            return collection;
        } catch (error) {
            console.error('Error getting albums:', error);
            return [];
        }
    });

    ipcMain.handle('add-album', async (event, albumData) => {
        try {
            const result = await addAlbumToCollection(albumData);
            if (result && result.success) {
                return { success: true };
            } else {
                return { success: false, error: result ? result.error : 'Unknown error' };
            }
        } catch (error) {
            console.error('Error adding album:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-album', async (event, albumData) => {
        try {
            await deleteAlbumFromCollection(albumData);
            return { success: true };
        } catch (error) {
            console.error('Error deleting album:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update-album', async (event, albumDataString, updatedAlbumData) => {
        try {

            await updateAlbumInCollection(albumDataString, updatedAlbumData);
            return { success: true };
        } catch (error) {
            console.error('Error updating album:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify-album-added', async (event, albumData) => {
        const addAlbumPopup = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = addAlbumPopup.getParentWindow();

        mainWindow.webContents.send('album-was-added', albumData);
        return { success: true };
    });

    ipcMain.handle('notify-album-update', async (event, albumData) => {
        const editAlbumPopup = BrowserWindow.fromWebContents(event.sender);
        const albumFocus = editAlbumPopup.getParentWindow();

        albumFocus.webContents.send('album-was-updated', albumData);
        return { success: true };
    });

    ipcMain.handle('debug', (event, message) => {
        console.log(message);
        return { success: true };
    });

    ipcMain.handle('open-add-album-popup', async (event, currentAlbumCoverColor) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);
        
        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();
        
        const popupWidth = 400;
        const popupHeight = 300;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);
        
        const popupWindow = new BrowserWindow({
            width: popupWidth,
            height: popupHeight,
            x: popupX,
            y: popupY,
            resizable: false,
            movable: false,
            frame: false,
            parent: mainWindow,
            modal: true,
            webPreferences: {
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../src/preload.js')
            }
        });

        const encodedColor = encodeURIComponent(currentAlbumCoverColor || '#cfcfcf');
        popupWindow.loadFile('src/addAlbumPopup.html', { 
            query: { currentAlbumCoverColor: encodedColor } 
        });

        popupWindow.on('closed', () => {
            popupWindow = null;
        });
    });

    ipcMain.handle('open-album-focus-popup', async (event, albumData) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const popupWidth = 300;
        const popupHeight = 400;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);

        const popupWindow = new BrowserWindow({
            width: popupWidth,
            height: popupHeight,
            x: popupX,
            y: popupY,
            resizable: false,
            movable: false,
            frame: false,
            parent: mainWindow,
            modal: true,
            webPreferences: {
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../src/preload.js')
            }
        });

        popupWindow.loadFile('src/albumFocusPopup.html', {
            query: { albumData: JSON.stringify(albumData) }
        });
        
        popupWindow.on('closed', () => {
            popupWindow = null;
        });
    });

    ipcMain.handle('open-edit-album-popup', async (event, albumData) => {
        const albumFocusWindow = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = albumFocusWindow.getParentWindow();

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const popupWidth = 300;
        const popupHeight = 400;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);

        const popupWindow = new BrowserWindow({
            width: popupWidth,
            height: popupHeight,
            x: popupX,
            y: popupY,
            resizable: false,
            movable: false,
            frame: false,
            parent: albumFocusWindow,
            modal: true,
            webPreferences: {
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../src/preload.js')
            }
        });

        popupWindow.loadFile('src/editAlbumPopup.html', {
            query: { albumData: JSON.stringify(albumData) }
        });

        popupWindow.on('closed', () => {
            popupWindow = null;
        });
    });
}