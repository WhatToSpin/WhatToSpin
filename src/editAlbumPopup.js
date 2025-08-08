document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oldAlbumDataString = urlParams.get('albumData');    

    const saveButton = document.getElementById('saveChanges');
    const deleteButton = document.getElementById('deleteAlbum');

    const UNKNOWN_COVER_PATH = 'covers/unknown.png';
    
    if (oldAlbumDataString) {
        try {
            const oldAlbumData = JSON.parse(oldAlbumDataString);
            
            // setting the inital album data
            document.getElementById('editAlbumTitle').textContent = oldAlbumData.album;
            document.getElementById('editArtistName').textContent = oldAlbumData.artist;
            document.getElementById('editYear').textContent = oldAlbumData.year;
            
            const coverImg = document.getElementById('editCover');

            if (oldAlbumData.cover && oldAlbumData.cover !== UNKNOWN_COVER_PATH) {
                const coverFileName = oldAlbumData.cover.split('/').pop();
                const relativeCoverPath = `covers/${coverFileName}`;
                
                coverImg.src = relativeCoverPath;
                coverImg.alt = `${oldAlbumData.album} by ${oldAlbumData.artist}`;
                
                coverImg.onerror = () => {
                    coverImg.src = 'covers/unknown.png';
                    coverImg.alt = 'Album cover not found';
                };
            } else {
                coverImg.src = UNKNOWN_COVER_PATH;
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
        const newAlbum = document.getElementById('editAlbumTitle').textContent;
        const newArtist = document.getElementById('editArtistName').textContent;
        const newYear = document.getElementById('editYear').textContent;

        if (!newAlbum || !newArtist) {
            alert('Please fill in the album and artist name');
            return;
        }

        // figure out the cover thing

        let newCover;
        if (oldAlbumDataString) {
            const oldAlbumData = JSON.parse(oldAlbumDataString);
            newCover = oldAlbumData.cover;
        } else {
            newCover = UNKNOWN_COVER_PATH;
        }

        const updatedAlbumData = {
            album: newAlbum,
            artist: newArtist,
            year: newYear || '',
            cover: newCover
        };

        try {
            const oldAlbumData = JSON.parse(oldAlbumDataString);
            const result = await window.electronAPI.updateAlbumInCollection(oldAlbumData, updatedAlbumData);
            if (result && result.success) {
                await window.electronAPI.notifyAlbumUpdated(updatedAlbumData);
                window.close(); // close the window after making updates
            } else {
                alert(`Error adding album: ${result ? result.error : 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating album:', error);
            alert(`Failed to update album. Please try again. ${error.message}`);
        }
    });
});
