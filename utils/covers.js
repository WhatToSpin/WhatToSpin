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
        throw new Error(`Failed to fetch album data: ${response.statusText}`);
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
    await fs.writeFileSync(coverPath, Buffer.from(buffer));

    return coverPath;
}

export { getAlbumCover, saveAlbumCover };