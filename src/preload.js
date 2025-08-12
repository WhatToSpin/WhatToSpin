const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getPaths: () => ipcRenderer.invoke('get-paths'),

    getAlbumsFromCollection: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumData) => ipcRenderer.invoke('add-album', albumData),

    deleteAlbumFromCollection: (albumData) => ipcRenderer.invoke('delete-album', albumData),

    updateAlbumInCollection: (albumDataString, updatedAlbumData, newCoverData) => ipcRenderer.invoke('update-album', albumDataString, updatedAlbumData, newCoverData),

    openAddAlbumPopup: (currentAlbumCoverColor) => ipcRenderer.invoke('open-add-album-popup', currentAlbumCoverColor),

    openAlbumFocusPopup: (albumData, albumCoverColor) => ipcRenderer.invoke('open-album-focus-popup', albumData, albumCoverColor),

    openEditAlbumPopup: (albumData, albumCoverColor) => ipcRenderer.invoke('open-edit-album-popup', albumData, albumCoverColor),

    notifyAlbumAdded: (albumData) => ipcRenderer.invoke('notify-album-added', albumData),

    onAlbumAdded: (callback) => ipcRenderer.on('album-was-added', (event, albumData) => callback(albumData)),

    notifyAlbumUpdated: (updatedAlbumData) => ipcRenderer.invoke('notify-album-update', updatedAlbumData),

    onAlbumUpdated: (callback) => ipcRenderer.on('album-was-updated', (event, updatedAlbumData) => callback(updatedAlbumData)),

    debug: (message) => ipcRenderer.invoke('debug', message),
});