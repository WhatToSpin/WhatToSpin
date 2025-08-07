const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAlbums: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumsData) => ipcRenderer.invoke('add-album', albumsData),

    openAddAlbumPopup: (currentAlbumCoverColor) => ipcRenderer.invoke('open-add-album-popup', currentAlbumCoverColor),

    openAlbumFocusPopup: (albumData) => ipcRenderer.invoke('open-album-focus-popup', albumData)
});