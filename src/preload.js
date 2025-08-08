const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAlbums: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumsData) => ipcRenderer.invoke('add-album', albumsData),

    openAddAlbumPopup: (currentAlbumCoverColor) => ipcRenderer.invoke('open-add-album-popup', currentAlbumCoverColor),

    openAlbumFocusPopup: (albumData) => ipcRenderer.invoke('open-album-focus-popup', albumData),

    notifyAlbumAdded: (albumData) => ipcRenderer.invoke('notify-album-added', albumData),

    onAlbumAdded: (callback) => ipcRenderer.on('album-was-added', (event, albumData) => callback(albumData)),

    debug: (message) => ipcRenderer.invoke('debug', message),
});