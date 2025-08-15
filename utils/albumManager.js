const fs = require('fs');
const fsPromises = require('fs/promises');
const albumArt = require('album-art');
const path = require('path');
const filepath = require('./filepath');

async function getAlbumsFromCollection() {
    let albums;
    try {
        albums = await fsPromises.readFile(path.join(filepath.userData, 'collection.json'), 'utf-8');
        albums = JSON.parse(albums);
    } catch (error) {
        albums = [];
        await fsPromises.mkdir(path.dirname(path.join(filepath.userData, 'collection.json')), { recursive: true });
        await fsPromises.writeFile(path.join(filepath.userData, 'collection.json'), JSON.stringify(albums, null, 2));
    }
    return albums;
}

async function sortCollection(albums) {
    albums.sort((a, b) => {
        // remove "the" for sorting 
        const artistA = a.artist.startsWith('The ') || a.artist.startsWith('the ') ? a.artist.slice(4) : a.artist;
        const artistB = b.artist.startsWith('The ') || b.artist.startsWith('the ') ? b.artist.slice(4) : b.artist;
        return artistA.localeCompare(artistB) || a.year - b.year; // sort by artist, then year
    });
    return albums;
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

        if (!album || !artist) {
            throw new Error('Album name and artist name are required');
        }

        // make sure album does not already exist
        const albumsData = albums;
        if (albumsData.length !== 0) {
            const existingAlbum = albumsData.find(
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
            coverPath: coverPath,
        };

        albums.push(newAlbum);
        albums = await sortCollection(albums);

        await fsPromises.writeFile(
            path.join(filepath.userData, 'collection.json'),
            JSON.stringify(albums, null, 2)
        );

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
        return null;
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
    await fsPromises.writeFile(
        path.join(filepath.userData, 'collection.json'),
        JSON.stringify(albums, null, 2)
    );

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
    await fsPromises.writeFile(
        path.join(filepath.userData, 'collection.json'),
        JSON.stringify(albums, null, 2)
    );

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

module.exports = {
    addAlbumToCollection,
    getAlbumsFromCollection, 
    deleteAlbumFromCollection,
    updateAlbumInCollection,
};