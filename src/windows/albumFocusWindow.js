document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumDataString = urlParams.get('albumData');
    const albumCoverColor = decodeURIComponent(urlParams.get('albumCoverColor'));

    const options = document.getElementById('options');
    const dropdownContent = document.getElementById('dropdownContent');
    const editLink = document.getElementById('edit');

    const UNKNOWN_COVER_PATH = await window.electronAPI.getUnknownCoverPath();
    
    let albumData = null; 
    if (albumDataString) {
        albumData = JSON.parse(albumDataString);
        setFocusedAlbum(albumData);
    }

    async function setFocusedAlbum(albumData) {
        try {            
            document.getElementById('focusedAlbumTitle').textContent = albumData.album;
            document.getElementById('focusedArtistName').textContent = albumData.artist;
            document.getElementById('focusedYear').textContent = albumData.year;
            
            const coverImg = document.getElementById('focusedCover');

            if (albumData.coverPath) {
                const coverFilename = albumData.coverPath.split('/').pop();
                const coverFilepath = await window.electronAPI.getCoverPath(coverFilename);

                coverImg.src = `file://${coverFilepath}?t=${Date.now()}`;
                coverImg.alt = `${albumData.album} by ${albumData.artist}`;
                
                coverImg.onerror = () => {
                    coverImg.src = `file://${UNKNOWN_COVER_PATH}`;
                    coverImg.alt = 'Album cover not found';
                };
            } else {
                coverImg.src = `file://${UNKNOWN_COVER_PATH}`;
                coverImg.alt = 'Album cover not found';
            }
        } catch (error) {
            console.error('Error parsing album data:', error);
            document.getElementById('focusedAlbumTitle').textContent = 'Unknown Album';
            document.getElementById('focusedArtistName').textContent = 'Unknown Artist';
            document.getElementById('focusedYear').textContent = '';
            document.getElementById('focusedCover').src = `file://${UNKNOWN_COVER_PATH}`;
        }
    }
    
    // close behavior
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            window.close();
        }
    });

    // dropdown menu behavior
    options.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
    });

    editLink.addEventListener('click', () => {
        window.electronAPI.openEditAlbumWindow(albumData, albumCoverColor);
        dropdownContent.classList.remove('show');
    });

    window.onclick = function(event) {
        if (!event.target.matches('.options')) {
            dropdownContent.classList.remove('show');
        }
    }

    // listen for an album updated
    window.electronAPI.onAlbumUpdated(async (updatedAlbumData) => {

        // notify the main window of an album change 
        await window.electronAPI.notifyAlbumAdded(updatedAlbumData);

        if (!updatedAlbumData) { // album was deleted
            window.close();
            return;
        }

        // set focused album with new data
        albumData = updatedAlbumData;
        setFocusedAlbum(updatedAlbumData);
    });
});
