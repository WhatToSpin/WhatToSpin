document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumDataString = urlParams.get('albumData');

    const saveButton = document.getElementById('saveChanges');
    const deleteButton = document.getElementById('deleteAlbum');
    
    if (albumDataString) {
        try {
            const albumData = JSON.parse(albumDataString);
            
            document.getElementById('editAlbumTitle').textContent = albumData.album;
            document.getElementById('editArtistName').textContent = albumData.artist;
            document.getElementById('editYear').textContent = albumData.year;
            
            const coverImg = document.getElementById('editCover');
            window.electronAPI.debug(albumData);
            window.electronAPI.debug(albumData.cover);

            if (albumData.cover) {
                const coverFileName = albumData.cover.split('/').pop();
                const relativeCoverPath = `covers/${coverFileName}`;

                window.electronAPI.debug("Setting cover image path to: " + relativeCoverPath);
                
                coverImg.src = relativeCoverPath;
                coverImg.alt = `${albumData.album} by ${albumData.artist}`;
                
                coverImg.onerror = () => {
                    coverImg.src = 'covers/unknown.png';
                    coverImg.alt = 'Album cover not found';
                };
            } else {
                coverImg.src = 'covers/unknown.png';
                coverImg.alt = 'Album cover not found';
            }
        } catch (error) {
            console.error('Error parsing album data:', error);
            document.getElementById('editAlbumTitle').textContent = 'Unknown Album';
            document.getElementById('editArtistName').textContent = 'Unknown Artist';
            document.getElementById('editYear').textContent = 'Unknown Year';
            document.getElementById('editCover').src = 'covers/unknown.png';
        }
    }
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            window.close();
        }
    });

    saveButton.addEventListener('click', async () => {
        const albumTitle = document.getElementById('editAlbumTitle').textContent;
        const artistName = document.getElementById('editArtistName').textContent;
        const year = document.getElementById('editYear').textContent;

        if (!albumTitle || !artistName) {
            alert('Please fill in the album and artist name');
            return;
        }
        
        const updatedAlbumData = {
            album: albumTitle,
            artist: artistName,
            year: year || ''
        };

        try {
            const oldAlbumData = JSON.parse(albumDataString);
            const result = await window.electronAPI.updateAlbumInCollection(oldAlbumData, updatedAlbumData);
            if (result && result.success) {
                await window.electronAPI.notifyAlbumAdded(updatedAlbumData);
                window.close();
            } else {
                alert(`Error updating album: ${result ? result.error : 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating album:', error);
            alert(`Failed to update album. Please try again. ${error.message}`);
        }
    });
});
