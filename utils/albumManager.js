const fs = require('fs');
const fsPromises = require('fs/promises');
const albumArt = require('album-art');
const path = require('path');
const filepath = require('./filepath');

// default sorting options
let savedSortingOptions = {
    method: 'artist',
    order: 'ascending'
}

// max retries for fetching album cover
maxRetries = 3;

/* ALBUMS HANDLING */

/**
 * Atomically writes albums to collection.json with backup
 * Uses write-then-rename pattern to ensure file is never in inconsistent state
 */
async function writeAlbumsToCollection(albums) {
    try {
        // Validate input - never write empty array if we shouldn't
        if (!Array.isArray(albums)) {
            throw new Error('Albums must be an array');
        }

        const collectionPath = path.join(filepath.userData, 'collection.json');
        const tempPath = path.join(filepath.userData, 'collection.json.tmp');
        const backupPath = path.join(filepath.userData, 'collection.json.backup');

        // Write to temporary file 
        const jsonData = JSON.stringify(albums, null, 2);
        await fsPromises.writeFile(tempPath, jsonData);

        // Create backup of existing file (if it exists)
        try {
            if (fs.existsSync(collectionPath)) {
                await fsPromises.copyFile(collectionPath, backupPath);
            }
        } catch (backupError) {
            console.warn(`Warning: Could not create backup: ${backupError}`);
        }

        // Atomically rename temp file to actual file
        await fsPromises.rename(tempPath, collectionPath);
        console.log('Successfully saved collection to collection.json');
    } catch (error) {
        console.error(`Error saving albums to collection.json: ${error}`);
        // Clean up temp file if it exists
        try {
            const tempPath = path.join(filepath.userData, 'collection.json.tmp');
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch (cleanupError) {
            console.error(`Error cleaning up temp file: ${cleanupError}`);
        }
        throw error; // Re-throw so caller knows write failed
    }
}

/**
 * Reads albums from collection.json with recovery mechanisms
 * If file is corrupted, attempts to recover from backup
 * Only creates empty collection if file genuinely doesn't exist
 */
async function getAlbumsFromCollection() {
    let albums;
    const collectionPath = path.join(filepath.userData, 'collection.json');
    const backupPath = path.join(filepath.userData, 'collection.json.backup');

    try {
        // Ensure directory exists
        await fsPromises.mkdir(path.dirname(collectionPath), { recursive: true });

        // Try to read main collection file
        const fileContent = await fsPromises.readFile(collectionPath, 'utf-8');
        albums = JSON.parse(fileContent);
        
        // Validate that we got an array
        if (!Array.isArray(albums)) {
            throw new Error('Collection file is not an array');
        }
        return albums;
    } catch (readError) {
        // File doesn't exist - this is normal for first run
        if (readError.code === 'ENOENT') {
            console.log('Collection file does not exist, creating new empty collection');
            albums = [];
            try {
                await writeAlbumsToCollection(albums);
            } catch (writeError) {
                console.error('Failed to create initial collection file:', writeError);
                // Return empty array even if write fails, don't crash
                return [];
            }
            return albums;
        }
        
        // File exists but is corrupted/invalid - try to recover from backup
        console.error('Error reading/parsing collection.json:', readError);
        console.log('Attempting to recover from backup...');
        
        try {
            const backupContent = await fsPromises.readFile(backupPath, 'utf-8');
            albums = JSON.parse(backupContent);
            
            if (!Array.isArray(albums)) {
                throw new Error('Backup file is not an array');
            }
            
            console.log(`Recovered ${albums.length} albums from backup file`);
            
            // Restore from backup
            try {
                await writeAlbumsToCollection(albums);
                console.log('Successfully restored collection from backup');
            } catch (restoreError) {
                console.error('Failed to restore from backup:', restoreError);
            }
            
            return albums;
        } catch (backupError) {
            // No backup available or backup is also corrupted
            console.error('No valid backup available, returning empty collection:', backupError);
            console.warn('⚠️ DATA LOSS WARNING: Collection file was corrupted and cannot be recovered');
            return [];
        }
    }
}


async function addAlbumToCollection(albumData) {
    try {
        let albums = await getAlbumsFromCollection();

        if (!albumData || typeof albumData !== 'object') {
            throw new Error('Invalid album data provided');
        }

        const album = String(albumData.album || '').trim();
        const artist = String(albumData.artist || '').trim();
        const year = albumData.year ? String(albumData.year).trim() : '';
        const dateAdded = Date.now();

        if (!album || !artist) {
            throw new Error('Album name and artist name are required');
        }

        // make sure album does not already exist
        if (albums.length !== 0) {
            const existingAlbum = albums?.find(
                (a) => a.album.toLowerCase() === album.toLowerCase() &&
                a.artist.toLowerCase() === artist.toLowerCase()
            );
            if (existingAlbum) {
                throw new Error('Album already exists in the collection');
            }
        }

        let coverPath = await getAlbumCover(album, artist);
        if (!coverPath) {
            coverPath = filepath.unknownCover;
        }

        const newAlbum = {
            album: album,
            artist: artist,
            year: year,
            dateAdded: dateAdded,
            coverPath: coverPath,
        };

        albums.push(newAlbum);
        albums = await sortCollection(albums);

        await writeAlbumsToCollection(albums);

        return { success: true  };

    } catch (error) {
        console.error('Error adding album:', error);
        return { success: false, error: error.message };
    }
}

async function getAlbumCover(album, artist) {
    if (!album || !artist) {
        return null;
    }

    // album and artist should be strings
    if (typeof album !== 'string') {
        console.log('Album name is not a string, converting to string');
        album = String(album);
    }
    if (typeof artist !== 'string') {
        console.log('Artist name is not a string, converting to string');
        artist = String(artist);
    }

    // validate non-empty strings after conversion
    if (!album.trim() || !artist.trim()) {
        console.log('Album or artist is empty after string conversion');
        return null;
    }

    // retry if albumArt throws an error (up to 3 tries)
    for (let attempt = 1; attempt < maxRetries; attempt++) {
        try {
            const coverUrl = await albumArt(artist, { album: album, size: 'large' });
            if (!coverUrl) {
                console.log("coverUrl is null");
                return null;
            }

            // checking cover;
            const response = await fetch(coverUrl);
            if (!response.ok) {
                return null;
            }

            // saving cover
            const cover = { '#text': coverUrl };
            const coverPath = await saveAlbumCover(album, artist, cover);

            return coverPath;
        } catch (error) {
            console.error(`Error fetching album cover for "${album}" by "${artist}":`, error);
            if (attempt === maxRetries) {
                return null;
            }

            // increase wait time for failed fetch
            const delay = 1000 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

async function saveAlbumCover(album, artist, cover) {
    if (!album || !artist || !cover || !cover['#text']) {
        throw new Error('Invalid parameters for saveAlbumCover');
    }

    // make sure cover directory exists
    if (!fs.existsSync(path.join(filepath.userData, 'covers'))) {
        fs.mkdirSync(path.join(filepath.userData, 'covers'), { recursive: true });
    }

    const coverUrl = cover['#text'];
    const response = await fetch(coverUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch cover image: ${response.statusText}`);
    }

    // get cover path and save image
    const coverPath = await generateCoverPath(album, artist);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(coverPath, Buffer.from(buffer));

    return coverPath;
}

async function deleteAlbumFromCollection(albumData) {

    const album = albumData.album;
    const artist = albumData.artist;
    const coverPath = albumData.coverPath;

    // make sure collection.json exists
    let albums = await getAlbumsFromCollection();
    if (!albums) {
        return { success: false, error: 'Collection is empty or does not exist' };
    }

    // delete album from the collection
    const albumIndex = albums.findIndex(
        (a) => a.album === album && a.artist === artist
    );
    if (albumIndex === -1) {
        throw new Error('Album not found in the collection');
    }
    albums.splice(albumIndex, 1);

    // delete the cover image
    if (coverPath && fs.existsSync(coverPath) && coverPath !== filepath.unknownCover) {
        fs.unlinkSync(coverPath);
    }
    
    // write updated collection
    await writeAlbumsToCollection(albums);

    return { success: true, isEmpty: albums.length === 0 };
}

async function updateAlbumInCollection(oldAlbumData, newAlbumData, newCoverData) {
    
    let albums = await getAlbumsFromCollection();

    // change cover path if album/artist changed
    let coverPath;
    if (oldAlbumData.album !== newAlbumData.album || oldAlbumData.artist !== newAlbumData.artist) {
        coverPath = await generateCoverPath(newAlbumData.album, newAlbumData.artist);
        try {
            fs.renameSync(oldAlbumData.coverPath, coverPath);
        } catch (err) {
            console.error('Error renaming file:', err);
            coverPath = oldAlbumData.coverPath; // fallback to old cover path
        }
    } else {
        coverPath = oldAlbumData.coverPath;
    }

    // overwrite cover data if new cover uploaded
    if (newCoverData) {
        const buffer = Buffer.from(newCoverData);
        fs.writeFileSync(coverPath, buffer); // write new cover data to the correct path
    }

    // get album index
    let albumIndex = albums.findIndex(
        (a) => a.album === oldAlbumData.album && a.artist === oldAlbumData.artist
    );
    if (albumIndex === -1) {
        throw new Error('Album not found in the collection');
    }

    // update album metadata
    albums[albumIndex] = {
        album: newAlbumData.album,
        artist: newAlbumData.artist,
        year: newAlbumData.year,
        coverPath: coverPath
    }

    if (oldAlbumData.artist !== newAlbumData.artist || oldAlbumData.year !== newAlbumData.year) {
        albums = await sortCollection(albums);

        // recalculate album index in case order changed
        albumIndex = albums.findIndex(
            (a) => a.album === newAlbumData.album && a.artist === newAlbumData.artist
        );
        if (albumIndex === -1) {
            throw new Error('Album not found in the collection');
        }
    }

    // rewrite to collection.json
    await writeAlbumsToCollection(albums);

    return { success: true, updatedAlbum: albums[albumIndex] };
}

async function generateCoverPath(album, artist) {
    const albumSafe = String(album).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const artistSafe = String(artist).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const randomId = Math.floor(Math.random() * 1000000).toString();

    const filename = `${artistSafe}_${albumSafe}_${randomId}.png`;
    const coverPath = path.join(path.join(filepath.userData, 'covers'), filename);

    return coverPath;
}

/* SORTING HANDLING */

async function loadOptionsFile() {
    try {
        savedSortingOptions = await fsPromises.readFile(path.join(filepath.userData, 'options.json'), 'utf-8');
        savedSortingOptions = JSON.parse(savedSortingOptions);
    } catch (error) {
        await fsPromises.mkdir(path.dirname(path.join(filepath.userData, 'options.json')), { recursive: true });
        await saveOptions(savedSortingOptions);
    }
    return savedSortingOptions;
}

async function saveOptions(savedSortingOptions) {
    try { 
        await fsPromises.writeFile(
            path.join(filepath.userData, 'options.json'),
            JSON.stringify(savedSortingOptions, null, 2)
        );
    } catch (error) {
        console.log(`Error saving options to options.json: ${error}`);
    }
}

async function updateSortingOptions(sortingOptions, albums) {
    let sortedAlbums = albums;
    if (sortingOptions.method !== savedSortingOptions.method) {
        savedSortingOptions.method = sortingOptions.method;
        sortedAlbums = await sortCollection(albums);
    } else if (sortingOptions.order !== savedSortingOptions.order) {
        savedSortingOptions.order = sortingOptions.order;
        sortedAlbums = sortedAlbums.reverse();
    }
    await writeAlbumsToCollection(sortedAlbums);
    await saveOptions(savedSortingOptions);
    return sortedAlbums;
}

function cleanName(name) {

    name = String(name || '');

    // Remove leading 'the' or 'a'
    name = name.startsWith('The ') || name.startsWith('the ') ? name.slice(4) : name;
    name = name.startsWith('A ') || name.startsWith('a ') ? name.slice(2) : name;

    // Replace common special characters for sorting
    name = name.replace('$', 'S');

    return name;
}

async function sortCollection(albums) {

    if (savedSortingOptions.method === 'year') {

        // sort by year
        albums.sort((a, b) => {
            const artistA = cleanName(a.artist);
            const artistB = cleanName(b.artist);
            return artistA.localeCompare(artistB) || a.year - b.year;
        });
    
    } else if (savedSortingOptions.method === 'dateAdded') {

        // sort by date added
        albums.sort((a, b) => { 
            return a.dateAdded - b.dateAdded;
        });
    } else {

        // sort by artist
        albums.sort((a, b) => {
            const artistA = cleanName(a.artist);
            const artistB = cleanName(b.artist);
            return artistA.localeCompare(artistB) || a.year - b.year;
        });
    }

    if (savedSortingOptions.order === 'descending') {
        albums = albums.reverse()
    }

    return albums;
}

module.exports = {
    addAlbumToCollection,
    getAlbumsFromCollection, 
    deleteAlbumFromCollection,
    updateAlbumInCollection,
    loadOptionsFile,
    sortCollection,
    updateSortingOptions
};