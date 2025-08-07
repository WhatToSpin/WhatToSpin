const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAlbums: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumsData) => ipcRenderer.invoke('add-album', albumsData),

    openPopup: () => ipcRenderer.invoke('open-popup')
});