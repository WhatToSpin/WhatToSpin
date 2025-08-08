const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAlbumsFromCollection: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumData) => ipcRenderer.invoke('add-album', albumData),

    deleteAlbumFromCollection: (albumData) => ipcRenderer.invoke('delete-album', albumData),

    updateAlbumInCollection: (albumDataString, updatedAlbumData) => ipcRenderer.invoke('update-album', albumDataString, updatedAlbumData),

    openAddAlbumPopup: (currentAlbumCoverColor) => ipcRenderer.invoke('open-add-album-popup', currentAlbumCoverColor),

    openAlbumFocusPopup: (albumData) => ipcRenderer.invoke('open-album-focus-popup', albumData),

    openEditAlbumPopup: (albumData) => ipcRenderer.invoke('open-edit-album-popup', albumData),

    notifyAlbumAdded: (albumData) => ipcRenderer.invoke('notify-album-added', albumData),

    onAlbumAdded: (callback) => ipcRenderer.on('album-was-added', (event, albumData) => callback(albumData)),

    notifyAlbumUpdated: (albumData) => ipcRenderer.invoke('notify-album-update', albumData),

    onAlbumUpdated: (callback) => ipcRenderer.on('album-was-updated', (event, albumData) => callback(albumData)),

    debug: (message) => ipcRenderer.invoke('debug', message),
});