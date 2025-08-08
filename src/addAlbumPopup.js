document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let currentAlbumCoverColor = urlParams.get('currentAlbumCoverColor');
    
    if (currentAlbumCoverColor) {
        currentAlbumCoverColor = decodeURIComponent(currentAlbumCoverColor);
    }

    const submitAlbumButton = document.getElementById('submit-button');
    submitAlbumButton.style.setProperty('font-weight', '600', 'important');
    
    if (currentAlbumCoverColor) {
        submitAlbumButton.style.setProperty('background-color', currentAlbumCoverColor, 'important');
        
        // set text color 
        const color = currentAlbumCoverColor.replace('#', '');        
        const r = parseInt(color.slice(0, 2), 16);
        const g = parseInt(color.slice(2, 4), 16);
        const b = parseInt(color.slice(4, 6), 16);
                
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
        submitAlbumButton.style.setProperty('color', textColor, 'important');
    }

    // close behavior
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            window.close();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            window.close();
        }
    });

    window.focus();

    submitAlbumButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const albumName = document.getElementById('album-name').value;
        const artistName = document.getElementById('artist-name').value;
        const yearReleased = document.getElementById('year-released').value;

        if (!albumName || !artistName) {
            alert('Please fill in the album and artist name');
            return;
        }

        const albumData = {
            album: albumName,
            artist: artistName,
            year: yearReleased || ''
        };

        try {
            const result = await window.electronAPI.addAlbumToCollection(albumData);
            
            if (result && result.success) {
                await window.electronAPI.notifyAlbumAdded(albumData);
                window.close(); // close the window after adding the album
            } else {
                alert(`Error adding album: ${result ? result.error : 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding album:', error);
            alert(`Failed to add album. Please try again. ${error.message}`);
        }
    });
});

