import { ipcMain } from 'electron';
import { 
    addAlbumToCollection, 
    getAlbumsFromCollection, 
    deleteAlbumFromCollection, 
    updateAlbumInCollection,
} from '../utils/albumManager.js';
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
            return { albums: [] };
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
            const result = await deleteAlbumFromCollection(albumData);

            if (result.success && result.isEmpty) {
                const allWindows = BrowserWindow.getAllWindows();
                const mainWindow = allWindows.find(win => !win.getParentWindow());

                if (mainWindow) {
                    setTimeout(() => {
                        mainWindow.reload();
                    }, 100);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting album:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update-album', async (event, albumDataString, updatedAlbumData, newCoverData) => {
        try {
            const result = await updateAlbumInCollection(albumDataString, updatedAlbumData, newCoverData);
            return { success: true, updatedAlbum: result.updatedAlbum };
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

    ipcMain.handle('open-add-album-popup', async (event, currentAlbumCoverColor) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);
        
        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();
        
        const popupWidth = 400;
        const popupHeight = 300;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);
        
        let addAlbumWindow = new BrowserWindow({
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
                preload: path.join(__dirname, './preload.js')
            }
        });

        const encodedColor = encodeURIComponent(currentAlbumCoverColor || '#cfcfcf');
        addAlbumWindow.loadFile(path.join(__dirname, './popups/addAlbumPopup.html'), { 
            query: { currentAlbumCoverColor: encodedColor } 
        });

        addAlbumWindow.on('closed', () => {
            addAlbumWindow = null;
        });
    });

    ipcMain.handle('open-album-focus-popup', async (event, albumData, albumCoverColor) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const popupWidth = 300;
        const popupHeight = 400;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);

        let albumFocusWindow = new BrowserWindow({
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
                preload: path.join(__dirname, './preload.js')
            }
        });

        albumFocusWindow.loadFile(path.join(__dirname, './popups/albumFocusPopup.html'), {
            query: { 
                albumData: JSON.stringify(albumData), 
                albumCoverColor: encodeURIComponent(albumCoverColor) 
            }
        });
        
        albumFocusWindow.on('closed', () => {
            albumFocusWindow = null;
        });
    });

    ipcMain.handle('open-edit-album-popup', async (event, albumData, albumCoverColor) => {
        const albumFocusWindow = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = albumFocusWindow.getParentWindow();

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const popupWidth = 300;
        const popupHeight = 400;
        const popupX = mainX + Math.floor((mainWidth - popupWidth) / 2);
        const popupY = mainY + Math.floor((mainHeight - popupHeight) / 2);

        let editAlbumWindow = new BrowserWindow({
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
                preload: path.join(__dirname, './preload.js')
            }
        });

        editAlbumWindow.loadFile(path.join(__dirname, './popups/editAlbumPopup.html'), {
            query: { 
                albumData: JSON.stringify(albumData),
                albumCoverColor: encodeURIComponent(albumCoverColor)
            }
        });

        editAlbumWindow.on('closed', () => {
            editAlbumWindow = null;
        });
    });

    ipcMain.handle('debug', (event, message) => {
        console.log(message);
        return { success: true };
    });
}