import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const __dirname = path.resolve();
const COLLECTION_PATH = path.join(__dirname, 'src', 'collection.json');

async function addAlbumToCollection(album, artist, year) {
    // make sure collection.json exists
    let collection;
    try {
        const fileContent = await fsPromises.readFile(COLLECTION_PATH, 'utf-8');
        if (fileContent.trim() === '') {
            throw new Error('File is empty');
        }
        collection = JSON.parse(fileContent);
    } catch (err) {
        collection = { albums: [] };
        await fsPromises.writeFile(COLLECTION_PATH, JSON.stringify(collection, null, 2));
    }

    // make sure album does not already exist
    const existingAlbum = collection.albums.find(
        (a) => a.album === album && a.artist === artist
    );
    if (existingAlbum) {
        throw new Error('Album already exists in the collection');
    }

    let coverPath = await getAlbumCover(album, artist);
    if (!coverPath) {
        coverPath = path.join(__dirname, 'src', 'covers', 'unknown.png');
    }

    const newAlbum = {
        album: album,
        artist: artist,
        year: year,
        cover: coverPath,
    };

    collection.albums.push(newAlbum);
    collection.albums.sort((a, b) => {
        // remove "the" for sorting 
        const artistA = a.artist.startsWith('The ') || a.artist.startsWith('the ') ? a.artist.slice(4) : a.artist;
        const artistB = b.artist.startsWith('The ') || b.artist.startsWith('the ') ? b.artist.slice(4) : b.artist;
        return artistA.localeCompare(artistB) || a.year - b.year; // sort by artist, then year
    });

    await fsPromises.writeFile(
        COLLECTION_PATH,
        JSON.stringify(collection, null, 2)
    );
}

async function getAlbumsFromCollection() {
    try {
        const collection = await fsPromises.readFile(COLLECTION_PATH, 'utf-8');
        const albumsData = JSON.parse(collection).albums;
        return albumsData;
    } catch (error) {
        console.error('Error loading albums:', error);
        return [];
    }
}

async function getAlbumCover(album, artist) {
    const params = new URLSearchParams({
        method: 'album.getinfo',
        api_key: LASTFM_API_KEY,
        artist: artist,
        album: album,
        format: 'json'
    });
    const url = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    // getting cover
    const covers = data.album.image;
    const cover = covers.find(img => img.size === 'large') || covers[0];
    const coverPath = await saveAlbumCover(album, artist, cover);

    return coverPath;
}

async function saveAlbumCover(album, artist, cover) {

    const coverDir = path.join(__dirname, 'covers');

    const coverUrl = cover['#text'];
    const filename = `${artist.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${album.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    const coverPath = path.join(coverDir, filename);

    if (!fs.existsSync(coverDir)) {
        fs.mkdirSync(coverDir, { recursive: true });
    }

    const response = await fetch(coverUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch cover image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(coverPath, Buffer.from(buffer));

    return coverPath;
}

export {
    addAlbumToCollection,
    getAlbumsFromCollection
};