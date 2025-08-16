const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    getCoverPath: (filename) => ipcRenderer.invoke('get-cover-path', filename),

    getUnknownCoverPath: () => ipcRenderer.invoke('get-unknown-cover-path'),

    getAlbumsFromCollection: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumData) => ipcRenderer.invoke('add-album', albumData),

    deleteAlbumFromCollection: (albumData) => ipcRenderer.invoke('delete-album', albumData),

    updateAlbumInCollection: (albumDataString, updatedAlbumData, newCoverData) => ipcRenderer.invoke('update-album', albumDataString, updatedAlbumData, newCoverData),

    updateSortingMethod: (method, albums) => ipcRenderer.invoke('update-sorting-method', method, albums),

    openAddAlbumWindow: (currentAlbumCoverColor) => ipcRenderer.invoke('open-add-album-window', currentAlbumCoverColor),

    openAlbumFocusWindow: (albumData, albumCoverColor) => ipcRenderer.invoke('open-album-focus-window', albumData, albumCoverColor),

    openEditAlbumWindow: (albumData, albumCoverColor) => ipcRenderer.invoke('open-edit-album-window', albumData, albumCoverColor),

    notifyAlbumAdded: (albumData) => ipcRenderer.invoke('notify-album-added', albumData),

    onAlbumAdded: (callback) => ipcRenderer.on('album-was-added', (event, albumData) => callback(albumData)),

    notifyAlbumUpdated: (updatedAlbumData) => ipcRenderer.invoke('notify-album-update', updatedAlbumData),

    onAlbumUpdated: (callback) => ipcRenderer.on('album-was-updated', (event, updatedAlbumData) => callback(updatedAlbumData)),

    debug: (message) => ipcRenderer.invoke('debug', message),
});