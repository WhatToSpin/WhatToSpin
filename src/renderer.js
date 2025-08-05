document.addEventListener('DOMContentLoaded', async () => {

    const albumTitle = document.getElementById('albumTitle');
    const artistName = document.getElementById('artistName');
    const year = document.getElementById('year');
    
    const leftCover = document.getElementById('leftCover');
    const centerCover = document.getElementById('centerCover');
    const rightCover = document.getElementById('rightCover');
    
    let albums = [];
    let currentIndex = 0;
    
    try {
        albums = await window.electronAPI.getAlbums();
        console.log('Albums loaded:', albums);
        
        if (albums.length > 0) {
            const randomAlbum = await window.electronAPI.getRandomAlbum();
            if (randomAlbum) {
                currentIndex = albums.findIndex(album => 
                    album.album === randomAlbum.album && 
                    album.artist === randomAlbum.artist
                );
                if (currentIndex === -1) currentIndex = 0;
            }
        }
    } catch (error) {
        console.error('Error loading albums:', error);
        albums = [];
    }

    function updateDisplay() {
        if (albums.length === 0) {
            albumTitle.textContent = 'No albums found';
            artistName.textContent = 'Add some albums to get started';
            year.textContent = '';
            
            leftCover.src = '';
            centerCover.src = '';
            rightCover.src = '';
            return;
        }
        
        const current = albums[currentIndex];
        albumTitle.textContent = current.album;
        artistName.textContent = current.artist;
        year.textContent = current.year;
        
        updateCoverImages();
    }

    function updateCoverImages() {
        if (albums.length === 0) return;
        
        const leftIndex = (currentIndex - 1 + albums.length) % albums.length;
        const rightIndex = (currentIndex + 1) % albums.length;
        
        setCoverImage(leftCover, albums[leftIndex]);
        setCoverImage(centerCover, albums[currentIndex]);
        setCoverImage(rightCover, albums[rightIndex]);
    }

    function setCoverImage(imgElement, album) {
        if (!album || !album.cover) {
            imgElement.src = '';
            imgElement.alt = 'No cover available';
            return;
        }
        
        let coverPath = album.cover;
        
        if (coverPath.includes('/src/covers/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `covers/${filename}`;
        } else if (coverPath.includes('/covers/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `../covers/${filename}`;
        } else if (coverPath.startsWith('/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `covers/${filename}`;
        }
        
        imgElement.src = coverPath;
        imgElement.alt = `${album.album} by ${album.artist}`;
        
        imgElement.onerror = function() {
            console.log(`Failed to load cover: ${coverPath}`);
            this.src = '';
            this.alt = 'Cover not found';
            this.style.display = 'none';
        };
        
        imgElement.onload = function() {
            this.style.display = 'block';
        };
    }

    leftCover.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + albums.length) % albums.length;
        updateDisplay();
    });

    rightCover.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % albums.length;
        updateDisplay();
    });

    updateDisplay();
});

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
}


