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
        collection = await window.electronAPI.getAlbumsFromCollection();
        albums = collection.albums;    
        currentIndex = getRandomIndex(albums.length); // start with a random album
        updateDisplay();
    } catch (error) {
        console.error('Error loading albums:', error);
        albums = [];
        updateDisplay();
    }

    async function updateDisplay() {
        if (albums.length === 0) {
            albumTitle.textContent = 'No albums found';
            artistName.textContent = '';
            
            year.textContent = '';
            
            wayLeftCover.src = '';
            leftCover.src = '';
            centerCover.src = '';
            rightCover.src = '';
            wayRightCover.src = '';

            hideCovers([wayLeftCover, leftCover, centerCover, rightCover, wayRightCover]);
            currentAlbumCoverColor = '#cfcfcf'; // reset cover color

            return;
        }

        if (albums.length === 1) {
            showCovers([centerCover]);
            hideCovers([wayLeftCover, leftCover, rightCover, wayRightCover]);

            currentIndex = 0;
            const current = albums[currentIndex];
            albumTitle.textContent = current.album;
            artistName.textContent = current.artist;
            year.textContent = current.year;
            
            setCoverImage(centerCover, current); // only set center cover
            await setCoverColor(current.coverPath);

            return;
        }

        if (albums.length === 2) {
            showCovers([centerCover, rightCover]);
            hideCovers([wayLeftCover, leftCover, wayRightCover]);

            const current = albums[currentIndex];
            albumTitle.textContent = current.album;
            artistName.textContent = current.artist;
            year.textContent = current.year;

            setCoverImage(centerCover, current);
            setCoverImage(rightCover, albums[(currentIndex + 1) % 2]);
            await setCoverColor(current.coverPath);

            return;
        }

        if (albums.length === 3 || albums.length === 4) {
            showCovers([centerCover, rightCover, leftCover]);
            hideCovers([wayLeftCover, wayRightCover]);

            const current = albums[currentIndex];
            albumTitle.textContent = current.album;
            artistName.textContent = current.artist;
            year.textContent = current.year;

            await updateThreeCoverImages();

            return;
        }
        
        if (albums.length >= 5) {
            centerCover.style.display = 'block';
            rightCover.style.display = 'block';
            leftCover.style.display = 'block';
            wayLeftCover.style.display = 'block';
            wayRightCover.style.display = 'block';

            const current = albums[currentIndex];
            albumTitle.textContent = current.album;
            artistName.textContent = current.artist;
            year.textContent = current.year;
            
            await updateFiveCoverImages();
            
            return;
        }
    }

    function showCovers(covers) {
        covers.forEach((cover) => {
            cover.style.display = 'block';
        });
    }

    function hideCovers(covers) {
        covers.forEach((cover) => {
            cover.style.display = 'none';
        });
    }

    async function updateThreeCoverImages() {
        if (albums.length === 0) return;

        const leftIndex = (currentIndex - 1 + albums.length) % albums.length;
        const rightIndex = (currentIndex + 1) % albums.length;
        
        setCoverImage(leftCover, albums[leftIndex]);
        setCoverImage(centerCover, albums[currentIndex]);
        setCoverImage(rightCover, albums[rightIndex]);

        await setCoverColor(albums[currentIndex].coverPath);
    }

    async function updateFiveCoverImages() {
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

        await setCoverColor(albums[currentIndex].coverPath);
    }

    function setCoverImage(imgElement, album) {
        if (!album || !album.coverPath) {
            imgElement.src = '';
            imgElement.alt = 'No cover available';
            return;
        }
        
        let coverPath = album.coverPath;
        
        if (coverPath.includes('/src/assets/covers/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `assets/covers/${filename}`;
        } else if (coverPath.includes('/covers/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `../assets/covers/${filename}`;
        } else if (coverPath.startsWith('/')) {
            const filename = coverPath.split('/').pop();
            coverPath = `assets/covers/${filename}`;
        }
        
        imgElement.src = `${coverPath}?t=${Date.now()}`;
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
        const relativeCoverPath = `assets/covers/${coverFileName}`;

        const img = new Image();
        img.src = `${relativeCoverPath}?t=${Date.now()}`;
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
                    
                    // skip very dark and very light colors
                    const brightness = (r + g + b) / 3;
                    if (brightness < 60 || brightness > 225) continue;
                    
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

    shuffleButton.addEventListener('click', async () => {
        if (albums.length === 0) return;
        await shuffleAlbums();
    });

    async function shuffleAlbums() {
        const shuffleTime = 1 * 1000 + Math.random() * 2000; // 1 - 3 seconds
        const startTime = Date.now();
        
        const shuffleInterval = setInterval(async () => {
            currentIndex = (currentIndex + 1) % albums.length;
            await updateDisplay();
            
            if (Date.now() - startTime >= shuffleTime) {
                clearInterval(shuffleInterval);
                // selected album
                currentIndex = getRandomIndex(albums.length);
                await updateDisplay();
                
                // show focused album after 500 ms
                setTimeout(async () => {
                    try {
                        await window.electronAPI.openAlbumFocusPopup(albums[currentIndex], currentAlbumCoverColor);
                    } catch (error) {
                        console.error('Error opening album focus popup:', error);
                        alert('Failed to open album focus popup. Please try again.');
                    }

                }, 500);
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
            await window.electronAPI.openAlbumFocusPopup(albums[currentIndex], currentAlbumCoverColor);
        } catch (error) {
            console.error('Error opening album focus popup:', error);
            alert('Failed to open album focus popup. Please try again.');
        }
    });

    leftCover.addEventListener('click', async () => {
        currentIndex = (currentIndex - 1 + albums.length) % albums.length;
        await updateDisplay();
    });

    rightCover.addEventListener('click', async () => {
        currentIndex = (currentIndex + 1) % albums.length;
        await updateDisplay();
    });

    wayLeftCover.addEventListener('click', async () => {
        currentIndex = (currentIndex - 2 + albums.length) % albums.length;
        await updateDisplay();
    });

    wayRightCover.addEventListener('click', async () => {
        currentIndex = (currentIndex + 2) % albums.length;
        await updateDisplay();
    });

    // listen for an album added
    window.electronAPI.onAlbumAdded(async (albumData) => {

        // store the current album before refreshing the collection
        const currentAlbum = albums.length > 0 ? albums[currentIndex] : null;

        // refresh album list
        collection = await window.electronAPI.getAlbumsFromCollection();
        albums = collection.albums;

        if (!albumData) {
            // album was deleted -- reset index
            currentIndex = currentIndex > 0 ? getRandomIndex(albums.length) : 0;
        } else {
            // try to find the updated album by matching the albumData provided
            let newIndex = albums.findIndex(album => 
                album.album === albumData.album &&
                album.artist === albumData.artist
            );

            // if not found and we had a current album, try to stay on the same position
            if (newIndex === -1 && currentAlbum) {
                // try to find by original album data
                newIndex = albums.findIndex(album => 
                    album.album === currentAlbum.album &&
                    album.artist === currentAlbum.artist
                );
            }

            // if still not found, try to maintain current position or use 0
            if (newIndex === -1) {
                currentIndex = currentIndex < albums.length ? currentIndex : 0;
            } else {
                currentIndex = newIndex;
            }
        }

        await updateDisplay();
    });
});

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
};
