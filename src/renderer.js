document.addEventListener('DOMContentLoaded', async () => {

    const albumTitle = document.getElementById('albumTitle');
    const artistName = document.getElementById('artistName');
    const year = document.getElementById('year');
    
    const wayLeftCover = document.getElementById('wayLeftCover');
    const leftCover = document.getElementById('leftCover');
    const centerCover = document.getElementById('centerCover');
    const rightCover = document.getElementById('rightCover');
    const wayRightCover = document.getElementById('wayRightCover');

    const addAlbumButton = document.getElementById('addAlbumButton');
    const shuffleButton = document.getElementById('shuffleButton');
    
    let albums = [];
    let currentIndex = 0;
    let currentAlbumCoverColor = '#cfcfcf'; // for 'add' button 
    
    try {
        albums = await window.electronAPI.getAlbums();        
        if (albums.length > 0) {
            currentIndex = getRandomIndex(albums.length);
            const randomAlbum = albums[currentIndex];
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
            
            wayLeftCover.src = '';
            leftCover.src = '';
            centerCover.src = '';
            rightCover.src = '';
            wayRightCover.src = '';
            return;
        }
        
        const current = albums[currentIndex];
        albumTitle.textContent = current.album;
        artistName.textContent = current.artist;
        year.textContent = current.year;
        
        updateCoverImages();
    }

    async function updateCoverImages() {
        if (albums.length === 0) return;

        const wayLeftIndex = (currentIndex - 2 + albums.length) % albums.length;
        const leftIndex = (currentIndex - 1 + albums.length) % albums.length;
        const rightIndex = (currentIndex + 1) % albums.length;
        const wayRightIndex = (currentIndex + 2) % albums.length;
        
        setCoverImage(wayLeftCover, albums[wayLeftIndex]);
        setCoverImage(leftCover, albums[leftIndex]);
        setCoverImage(centerCover, albums[currentIndex]);
        setCoverImage(rightCover, albums[rightIndex]);
        setCoverImage(wayRightCover, albums[wayRightIndex]);

        setCoverColor(albums[currentIndex].cover);
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

    async function setCoverColor(albumCover) {
        if (!albumCover) {
            return;
        }

        const coverFileName = albumCover.split('/').pop();
        const relativeCoverPath = `covers/${coverFileName}`;

        const img = new Image();
        img.src = relativeCoverPath;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = async () => {
            try {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                const colorsCounts = {};

                // sample every 4th pixel
                const sampleRate = 4;
                for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const alpha = pixels[i + 3];
                    
                    if (alpha < 128) continue;
                    
                    // skip very light and dark colors
                    const brightness = (r + g + b) / 3;
                    if (brightness < 30 || brightness > 225) continue;
                    
                    const quantizeLevel = 32;
                    const qR = Math.floor(r / quantizeLevel) * quantizeLevel;
                    const qG = Math.floor(g / quantizeLevel) * quantizeLevel;
                    const qB = Math.floor(b / quantizeLevel) * quantizeLevel;
                    
                    const colorKey = `${qR},${qG},${qB}`;
                    colorsCounts[colorKey] = (colorsCounts[colorKey] || 0) + 1;
                }

                let maxCount = 0;
                let dominantColor = '#cfcfcf';

                for (const colorKey in colorsCounts) {
                    if (colorsCounts[colorKey] > maxCount) {
                        maxCount = colorsCounts[colorKey];
                        const [r, g, b] = colorKey.split(',').map(Number);
                        dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    }
                }

                currentAlbumCoverColor = dominantColor;
            } catch (error) {
                console.error('Error processing image for color extraction:', error);
                currentAlbumCoverColor = '#cfcfcf';
            }
        };

        img.onerror = () => {
            console.error('Failed to load image for color extraction:', relativeCoverPath);
            currentAlbumCoverColor = '#cfcfcf';
        };
    }

    shuffleButton.addEventListener('click', () => {
        if (albums.length === 0) return;
        shuffleAlbums();
    });

    function shuffleAlbums() {
        const shuffleTime = 1 * 1000 + Math.random() * 2000; // 1 - 3 seconds
        const startTime = Date.now();
        
        const shuffleInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % albums.length;
            updateDisplay();
            
            if (Date.now() - startTime >= shuffleTime) {
                clearInterval(shuffleInterval);
                // selected album
                currentIndex = getRandomIndex(albums.length);
                updateDisplay();
            }
        }, 100); // update every 100ms 
    }

    addAlbumButton.addEventListener('click', async () => {
        try {
            await window.electronAPI.openAddAlbumPopup(currentAlbumCoverColor);
        } catch (error) {
            console.error('Error adding album:', error);
            alert('Failed to add album. Please try again.');
        }
    });

    centerCover.addEventListener('click', async () => {
        if (albums.length === 0) return;
        try {
            await window.electronAPI.openAlbumFocusPopup(albums[currentIndex]);
        } catch (error) {
            console.error('Error opening album focus popup:', error);
            alert('Failed to open album focus popup. Please try again.');
        }
    });

    leftCover.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + albums.length) % albums.length;
        updateDisplay();
    });

    rightCover.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % albums.length;
        updateDisplay();
    });

    wayLeftCover.addEventListener('click', () => {
        currentIndex = (currentIndex - 2 + albums.length) % albums.length;
        updateDisplay();
    });

    wayRightCover.addEventListener('click', () => {
        currentIndex = (currentIndex + 2) % albums.length;
        updateDisplay();
    });

    updateDisplay();
});

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
}
