const { ipcMain } = require('electron');
const { 
    addAlbumToCollection, 
    getAlbumsFromCollection, 
    deleteAlbumFromCollection, 
    updateAlbumInCollection,
    updateSortingMethod
} = require('../utils/albumManager');
const { BrowserWindow } = require('electron');
const path = require('path');
const filepath = require('../utils/filepath');

function registerIpcHandlers() {

    ipcMain.handle('get-cover-path', (event, filename) => {
        return filepath.getCoverPath(filename);
    });

    ipcMain.handle('get-unknown-cover-path', () => {
        return filepath.unknownCover;
    });

    ipcMain.handle('get-albums', async () => {
        try {
            const albums = await getAlbumsFromCollection();
            return albums;
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

    ipcMain.handle('update-sorting-method', async (event, method) => updateSortingMethod(method) );

    ipcMain.handle('notify-album-added', async (event, albumData) => {
        const addAlbumWindow = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = addAlbumWindow.getParentWindow();

        mainWindow.webContents.send('album-was-added', albumData);
        return { success: true };
    });

    ipcMain.handle('notify-album-update', async (event, updatedAlbumData) => {
        const editAlbumWindow = BrowserWindow.fromWebContents(event.sender);
        const albumFocus = editAlbumWindow.getParentWindow();

        albumFocus.webContents.send('album-was-updated', updatedAlbumData);
        return { success: true };
    });

    ipcMain.handle('open-add-album-window', async (event, currentAlbumCoverColor) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);
        
        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();
        
        const windowWidth = 400;
        const windowHeight = 300;
        const windowX = mainX + Math.floor((mainWidth - windowWidth) / 2);
        const windowY = mainY + Math.floor((mainHeight - windowHeight) / 2);
        
        let addAlbumWindow = new BrowserWindow({
            width: windowWidth,
            height: windowHeight,
            x: windowX,
            y: windowY,
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
        addAlbumWindow.loadFile(path.join(__dirname, './windows/addAlbumWindow.html'), { 
            query: { currentAlbumCoverColor: encodedColor } 
        });

        addAlbumWindow.on('closed', () => {
            addAlbumWindow = null;
        });
    });

    ipcMain.handle('open-album-focus-window', async (event, albumData, albumCoverColor) => {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const windowWidth = 300;
        const windowHeight = 370;
        const windowX = mainX + Math.floor((mainWidth - windowWidth) / 2);
        const windowY = mainY + Math.floor((mainHeight - windowHeight) / 2);

        let albumFocusWindow = new BrowserWindow({
            width: windowWidth,
            height: windowHeight,
            x: windowX,
            y: windowY,
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

        albumFocusWindow.loadFile(path.join(__dirname, './windows/albumFocusWindow.html'), {
            query: { 
                albumData: JSON.stringify(albumData), 
                albumCoverColor: encodeURIComponent(albumCoverColor) 
            }
        });
        
        albumFocusWindow.on('closed', () => {
            albumFocusWindow = null;
        });
    });

    ipcMain.handle('open-edit-album-window', async (event, albumData, albumCoverColor) => {
        const albumFocusWindow = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = albumFocusWindow.getParentWindow();

        const [mainX, mainY] = mainWindow.getPosition();
        const [mainWidth, mainHeight] = mainWindow.getSize();

        const windowWidth = 300;
        const windowHeight = 370;
        const windowX = mainX + Math.floor((mainWidth - windowWidth) / 2);
        const windowY = mainY + Math.floor((mainHeight - windowHeight) / 2);

        let editAlbumWindow = new BrowserWindow({
            width: windowWidth,
            height: windowHeight,
            x: windowX,
            y: windowY,
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

        editAlbumWindow.loadFile(path.join(__dirname, './windows/editAlbumWindow.html'), {
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

module.exports = { registerIpcHandlers };
