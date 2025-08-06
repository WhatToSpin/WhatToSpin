import { ipcMain } from 'electron';
import { addAlbumToCollection, getAlbumsFromCollection } from './albumManager.js';
import { BrowserWindow } from 'electron';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function registerIpcHandlers() {

    ipcMain.handle('get-albums', async () => {
        try {
            const albums = await getAlbumsFromCollection();
            return albums;
        } catch (error) {
            console.error('Error getting albums:', error);
            return [];
        }
    });

    ipcMain.handle('add-album', async (event, albumsData) => {
        try {
            await addAlbumToCollection(albumsData.album, albumsData.artist, albumsData.year);
            return { success: true };
        } catch (error) {
            console.error('Error adding album:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-popup', async (event) => {
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

        popupWindow.loadFile('src/popup.html');

        popupWindow.on('closed', () => {
            popupWindow = null;
        });
    });
}