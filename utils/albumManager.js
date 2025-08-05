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
        throw new Error(`Failed to fetch album data: ${response.statusText}`);
    }

    const data = await response.json();

    // getting cover
    const covers = data.album.image;
    const cover = covers.find(img => img.size === 'large') || covers[0];
    const coverPath = await saveAlbumCover(album, artist, cover);

    const newAlbum = {
        album: album,
        artist: artist,
        year: year,
        cover: coverPath,
    };

    collection.albums.push(newAlbum);
    collection.albums.sort((a, b) => {
        return a.artist.localeCompare(b.artist) || a.year - b.year; // sort by artist then year
    });

    await fsPromises.writeFile(
        COLLECTION_PATH,
        JSON.stringify(collection, null, 2)
    );
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
    await fsPromises.writeFile(coverPath, Buffer.from(buffer));

    return coverPath;
}


async function getRandomAlbum() {
    const albums = await getAlbumsFromCollection();
    if (albums.length === 0) {
        return null;
    }
    const randomIndex = getRandomIndex(albums.length);
    return albums[randomIndex];
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

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
}

export {
    addAlbumToCollection,
    getRandomAlbum,
    getAlbumsFromCollection
};