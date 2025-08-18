document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let coverColors = JSON.parse(urlParams.get('coverColors'));

    const submitAlbumButton = document.getElementById('submit-button');
    submitAlbumButton.style.setProperty('font-weight', '600', 'important');
    
    if (currentAlbumCoverColor) {
        submitAlbumButton.style.setProperty('background-color', coverColors.cover, 'important')
        submitAlbumButton.style.setProperty('color', coverColors.text, 'important');

        const style = document.createElement('style');
        style.innerHTML = `
            .input:focus {
                border-color: ${coverColors.cover} !important;
                border-width: 2px !important;
                padding: 11px !important;
                box-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
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

