const urlParams = new URLSearchParams(window.location.search);
const albumCoverColor = decodeURIComponent(urlParams.get('albumCoverColor'));  
const MAX_COVER_DIMENSION = 1000; // 1000x1000
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

if (albumCoverColor) {
    const style = document.createElement('style');
    
    const color = albumCoverColor.replace('#', '');        
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
            
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
    
    style.innerHTML = `
        #saveChanges {
            background-color: ${albumCoverColor} !important;
            color: ${textColor} !important;
            font-weight: bold !important;
        }
    `;
    
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    const oldAlbumDataString = urlParams.get('albumData');  

    const saveButton = document.getElementById('saveChanges');
    const deleteButton = document.getElementById('deleteAlbum');
    const editCover = document.getElementById('editCover');
    const coverInput = document.getElementById('coverInput');

    const UNKNOWN_COVER_PATH = 'covers/unknown.png';
    let newCoverData = null; // if new cover uploaded
    
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

    editCover.addEventListener('click', function()  {
        coverInput.click();
    });

    coverInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'image/png') {
            if (file.size > MAX_FILE_SIZE) {
                alert(`File size too large. Maximum size is ${MAX_FILE_SIZE}`);
                return;
            }

            const img = new Image();
            img.onload = async function() {
                if (this.width <= MAX_COVER_DIMENSION && this.height <= MAX_COVER_DIMENSION) {
                    editCover.src = URL.createObjectURL(file); // set the new cover image
                    newCoverData = await file.arrayBuffer(); // setting new cover data
                } else {
                    alert(`Cover has a max size of ${MAX_COVER_DIMENSION}x${MAX_COVER_DIMENSION}`);
                }
            };
            img.src = URL.createObjectURL(file);
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

        let coverPath;
        if (oldAlbumDataString) {
            const oldAlbumData = JSON.parse(oldAlbumDataString);
            coverPath = oldAlbumData.cover;
        } else {
            coverPath = UNKNOWN_COVER_PATH;
        }

        let updatedAlbumData = {
            album: newAlbum,
            artist: newArtist,
            year: newYear,
            cover: coverPath // keep old cover path for now (will be updated later if album/artist changed)
        };

        try {
            const oldAlbumData = JSON.parse(oldAlbumDataString);

            // new cover data/path will be processed in updateAlbumInCollection
            const result = await window.electronAPI.updateAlbumInCollection(oldAlbumData, updatedAlbumData, newCoverData);

            if (result && result.success && result.updatedAlbum) {
                updatedAlbumData = result.updatedAlbum;
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

    deleteButton.addEventListener('click', async () => {
        if (!oldAlbumDataString) {
            alert('No album data to delete');
            return;
        }

        const oldAlbumData = JSON.parse(oldAlbumDataString);
        const result = await window.electronAPI.deleteAlbumFromCollection(oldAlbumData);

        if (result && result.success) {
            await window.electronAPI.notifyAlbumUpdated(null); // notify album was deleted
            window.close(); // close the window after deletion
        } else {
            alert(`Error deleting album: ${result ? result.error : 'Unknown error'}`);
        }
    });
});
