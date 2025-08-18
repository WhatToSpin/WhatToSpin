const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    getCoverPath: (filename) => ipcRenderer.invoke('get-cover-path', filename),

    getUnknownCoverPath: () => ipcRenderer.invoke('get-unknown-cover-path'),

    getAlbumsFromCollection: () => ipcRenderer.invoke('get-albums'),

    addAlbumToCollection: (albumData) => ipcRenderer.invoke('add-album', albumData),

    deleteAlbumFromCollection: (albumData) => ipcRenderer.invoke('delete-album', albumData),

    updateAlbumInCollection: (albumDataString, updatedAlbumData, newCoverData) => ipcRenderer.invoke('update-album', albumDataString, updatedAlbumData, newCoverData),

    updateSortingMethod: (options, albums) => ipcRenderer.invoke('update-sorting-method', options, albums),

    openAddAlbumWindow: (coverColors) => ipcRenderer.invoke('open-add-album-window', coverColors),

    openAlbumFocusWindow: (albumData, coverColors) => ipcRenderer.invoke('open-album-focus-window', albumData, coverColors),

    openEditAlbumWindow: (albumData, coverColors) => ipcRenderer.invoke('open-edit-album-window', albumData, coverColors),

    notifyAlbumAdded: (albumData) => ipcRenderer.invoke('notify-album-added', albumData),

    onAlbumAdded: (callback) => ipcRenderer.on('album-was-added', (event, albumData) => callback(albumData)),

    notifyAlbumUpdated: (updatedAlbumData) => ipcRenderer.invoke('notify-album-update', updatedAlbumData),

    onAlbumUpdated: (callback) => ipcRenderer.on('album-was-updated', (event, updatedAlbumData) => callback(updatedAlbumData)),

    debug: (message) => ipcRenderer.invoke('debug', message),
});