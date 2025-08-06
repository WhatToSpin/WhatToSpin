import { ipcMain } from 'electron';
import { addAlbumToCollection, getAlbumsFromCollection } from './albumManager.js';

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
}