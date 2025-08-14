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

    const infoOverlay = document.getElementById('infoOverlay');
    const collectionSize = document.getElementById('collectionSize');
    const numArtists = document.getElementById('numArtists');
    const topArtist = document.getElementById('topArtist');
    const chartIntro = document.getElementById('chartIntro');

    let cachedStats = null;
    let cachedChart = null;
    let wasCollectionUpdated = false;

    let allowShuffle = true;
    let allowCoverFocus = true;

    const UNKNOWN_COVER_PATH = await window.electronAPI.getUnknownCoverPath();
    
    let albums = [];
    let currentIndex = 0;
    let currentAlbumCoverColor = '#cfcfcf'; // for 'add' button 
    
    try {
        collection = await window.electronAPI.getAlbumsFromCollection();
        albums = collection.albums;  
        if (albums.length > 0) {
            currentIndex = getRandomIndex(albums.length); // start with a random album
        } else {
            currentIndex = 0; // no albums yet
        }
        await updateDisplay();

    } catch (error) {
        console.error('Error loading albums:', error);
        albums = [];
        await updateDisplay();
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
            imgElement.src = `file://${UNKNOWN_COVER_PATH}`;
            imgElement.alt = 'No cover available';
            return;
        }
        
        let coverPath = album.coverPath;
        imgElement.src = `file://${coverPath}?t=${Date.now()}`;
        imgElement.alt = `${album.album} by ${album.artist}`;
        
        imgElement.onerror = function() {
            console.log(`Failed to load cover: ${coverPath}`);
            this.src = `file://${UNKNOWN_COVER_PATH}`;
            this.alt = 'Cover not found';
            this.style.display = 'none';
        };
        
        imgElement.onload = function() {
            this.style.display = 'block';
        };
    }   

    async function setCoverColor(albumCoverPath) {
        if (!albumCoverPath) {
            return;
        }

        const img = new Image();
        img.src = `file://${albumCoverPath}?t=${Date.now()}`;
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
            console.error('Failed to load image for color extraction:', albumCoverPath);
            currentAlbumCoverColor = '#cfcfcf';
        };
    }

    function getCollectionStats() {
        if (cachedStats && !wasCollectionUpdated) {
            return cachedStats
        }

        // number of distinct artists
        const numArtistsResult = new Set(albums.map(album => album.artist)).size;

        // largest artist discography
        const topArtistInfo = albums.reduce((result, album) => {
            const currentCount = (result.artistCounts[album.artist] || 0) + 1;
            result.artistCounts[album.artist] = currentCount;
            
            if (currentCount > result.maxCount) {
                result.maxCount = currentCount;
                result.topArtist = album.artist;
            }

            return result;
        }, { artistCounts: {}, maxCount: 0, topArtist: null });

        // number of albums by year 
        const albumsByYear = albums.reduce((counts, album) => {
            counts[album.year] = (counts[album.year] || 0) + 1;
            return counts;
        }, {});

        // min and max year
        const minYear = Math.min(...Object.keys(albumsByYear).map(Number));
        const maxYear = Math.max(...Object.keys(albumsByYear).map(Number));

        // reset cached stats
        cachedStats = {
            size: albums.length,
            numArtists: numArtistsResult,
            topArtist: topArtistInfo.topArtist,
            topArtistCount: topArtistInfo.maxCount,
            albumsByYear: albumsByYear,
            minYear: minYear,
            maxYear: maxYear
        }

        // reset collection changed flag
        wasCollectionUpdated = false;

        return cachedStats
    }

    function createAlbumChart(albumsByYear, minYear, maxYear) {
        if (cachedChart && !wasCollectionUpdated) {
            return;
        }

        if (cachedChart) {
            cachedChart.destroy()
        }

        const years = Object.keys(albumsByYear).map(Number).sort((a, b) => a - b);
        const counts = years.map(year => albumsByYear[year]);
        
        const decadeData = {};
        Object.entries(albumsByYear).forEach(([year, count]) => {
            const decade = Math.floor(Number(year) / 10) * 10;
            decadeData[decade] = (decadeData[decade] || 0) + count;
        });

        const sortedDecades = Object.keys(decadeData).map(Number).sort((a, b) => a - b);
        const decadeCounts = sortedDecades.map(decade => decadeData[decade]);
        const decadeLabels = sortedDecades.map(decade => `${decade}s`);

        const config = {
            type: 'bar',
            data: {
                labels: decadeLabels,
                datasets: [{
                    label: 'Albums by Decade',
                    data: decadeCounts,
                    borderColor: '#333',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: null
                },
                hover: {
                    mode: null
                },
                onHover: null,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: '#ddd',
                            lineWidth: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false 
                    },
                    hover: {
                        mode: null
                    },
                },
                animation: {
                    duration: 0
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 0
                        }
                    }
                }
            }
        };

        const ctx = document.getElementById('albumChart').getContext('2d');
        cachedChart = new Chart(ctx, config);
    }

    function showAlbumInfo() {
        if (albums.length === 0) {
            collectionSize.innerHTML = `Add an album to start tracking your collection stats`
            infoOverlay.classList.add('show');
            return
        }

        const collectionStats = getCollectionStats();

        collectionSize.innerHTML = `You have <b>${collectionStats.size}</b> albums in your collection`;
        numArtists.innerHTML = `There are <b>${collectionStats.numArtists}</b> different artists in your collection`;
        topArtist.innerHTML = `Your largest discography is by <b>${collectionStats.topArtist}</b> with <b>${collectionStats.topArtistCount}</b> albums`;
        chartIntro.innerHTML = `Your collection spans from <b>${collectionStats.minYear}</b> to <b>${collectionStats.maxYear}</b>`

        createAlbumChart(collectionStats.albumsByYear, collectionStats.minYear, collectionStats.maxYear);

        infoOverlay.classList.add('show');
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Shift') {
            showAlbumInfo();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'Shift') {
            infoOverlay.classList.remove('show');
        }
    });

    shuffleButton.addEventListener('click', async () => {
        if (albums.length === 0 || !allowShuffle) return;
        
        // prevent shuffle and cover focus
        allowShuffle = false;
        allowCoverFocus = false;
        
        await shuffleAlbums();
        
        allowShuffle = true;
        allowCoverFocus = true;
    });

    async function shuffleAlbums() {
        // speed info
        let currentSpeed = 50;
        const endSpeed = 150;
        const minAccel = 1.02; // max of 5 seconds
        const maxAccel = 1.1; // min of 1 second
        const accel = Math.random() * (maxAccel - minAccel) + minAccel;
        
        while (true) {
            // update display
            currentIndex = (currentIndex + 1) % albums.length;
            await updateDisplay();
                        
            // check stop conditions 
            if (currentSpeed >= endSpeed) {
                break;
            }
            
            // update speed and wait
            currentSpeed = Math.min(currentSpeed * accel, endSpeed);
            await new Promise(resolve => setTimeout(resolve, currentSpeed));
        }
        
        // focus final album after 500 ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            await window.electronAPI.openAlbumFocusWindow(albums[currentIndex], currentAlbumCoverColor);
        } catch (error) {
            console.error('Error opening album focus window:', error);
        }
    }

    addAlbumButton.addEventListener('click', async () => {
        try {
            await window.electronAPI.openAddAlbumWindow(currentAlbumCoverColor);
        } catch (error) {
            console.error('Error adding album:', error);
            alert(`Failed to add album. Please try again. Error: ${error.message}`);
        }
    });

    centerCover.addEventListener('click', async () => {
        if (albums.length === 0 || !allowCoverFocus) return;
        try {
            await window.electronAPI.openAlbumFocusWindow(albums[currentIndex], currentAlbumCoverColor);
        } catch (error) {
            console.error('Error opening album focus window:', error);
            alert('Failed to open album focus window. Please try again.');
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

        wasCollectionUpdated = true;

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
