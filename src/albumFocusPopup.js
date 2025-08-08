document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumDataString = urlParams.get('albumData');

    const options = document.getElementById('options');
    const dropdownContent = document.getElementById('dropdownContent');
    const editLink = document.getElementById('edit');
    
    if (albumDataString) {
        try {
            const albumData = JSON.parse(albumDataString);
            
            document.getElementById('focusedAlbumTitle').textContent = albumData.album;
            document.getElementById('focusedArtistName').textContent = albumData.artist;
            document.getElementById('focusedYear').textContent = albumData.year;
            
            const coverImg = document.getElementById('focusedCover');
            if (albumData.cover) {
                const coverFileName = albumData.cover.split('/').pop();
                const relativeCoverPath = `covers/${coverFileName}`;
                
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
            document.getElementById('focusedAlbumTitle').textContent = 'Unknown Album';
            document.getElementById('focusedArtistName').textContent = 'Unknown Artist';
            document.getElementById('focusedYear').textContent = 'Unknown Year';
            document.getElementById('focusedCover').src = 'covers/unknown.png';
        }
    }
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            window.close();
        }
    });


    options.addEventListener('click', () => {
        window.electronAPI.debug("Options menu clicked");
        dropdownContent.classList.toggle('show');
    });

    window.onclick = function(event) {
        if (!event.target.matches('.options')) {
            dropdownContent.classList.remove('show');
        }
    }
});
