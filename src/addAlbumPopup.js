document.addEventListener('DOMContentLoaded', () => {
    const submitAlbumButton = document.getElementById('submit-button');

    // close window with escape key
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

        if (!albumName || !artistName || !yearReleased) {
            alert('Please fill in all fields.');
            return;
        }

        const albumData = {
            album: albumName,
            artist: artistName,
            year: yearReleased
        };

        try {
            const result = await window.electronAPI.addAlbumToCollection(albumData);
            
            if (result && result.success) {
                window.close(); // close the popup after adding the album
            } else {
                alert(`Error adding album: ${result ? result.error : 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding album:', error);
            alert(`Failed to add album. Please try again. ${error.message}`);
        }
    });
});

