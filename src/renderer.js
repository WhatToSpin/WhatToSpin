document.addEventListener('DOMContentLoaded', async () => {

    // center album info
    const albumTitle = document.getElementById('albumTitle');
    const artistName = document.getElementById('artistName');
    const year = document.getElementById('year');
    
    // covers
    const wayLeftCover = document.getElementById('wayLeftCover');
    const leftCover = document.getElementById('leftCover');
    const centerCover = document.getElementById('centerCover');
    const rightCover = document.getElementById('rightCover');
    const wayRightCover = document.getElementById('wayRightCover');

    // search elements
    const searchIcon = document.getElementById('searchIcon');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const cancelIcon = document.getElementById('cancelIcon');

    // info page elements
    const infoButton = document.getElementById('infoIcon');    
    const infoOverlay = document.getElementById('infoOverlay');
    const collectionSize = document.getElementById('collectionSize');
    const numArtists = document.getElementById('numArtists');
    const topArtist = document.getElementById('topArtist');
    const chartIntro = document.getElementById('chartIntro');

    // sorting elements
    const sortIcon = document.getElementById('sortIcon');
    const sortMenuContent = document.getElementById('sortMenuContent');
    const sortByArtist = document.getElementById('sortByArtist');
    const sortByYear = document.getElementById('sortByYear');
    const sortByDateAdded = document.getElementById('sortByDateAdded');
    const ascending = document.getElementById('ascending');
    const descending = document.getElementById('descending');

    // state variables
    let infoDisplayed = false;
    let cachedStats = null;
    let cachedChart = null;
    let wasCollectionUpdated = false;
    let allowShuffle = true;
    let allowCoverFocus = true;

    // default sorting options
    let sortingOptions = {
        method: 'artist',
        order: 'ascending'
    }

    // function buttons
    const addAlbumButton = document.getElementById('addAlbumButton');
    const shuffleButton = document.getElementById('shuffleButton');

    const UNKNOWN_COVER_PATH = await window.electronAPI.getUnknownCoverPath();
    
    let albums = [];
    let currentIndex = 0;
    let savedIndex = 0;
    let coverColors = { // for button styling
        cover: '#cfcfcf', 
        text: '#000000'
    }
    
    // set up sorting
    try {
        sortingOptions = await window.electronAPI.loadOptionsFile();
        if (!sortingOptions) {
            sortingOptions = {
                method: 'artist',
                order: 'ascending'
            }
        }
    } catch (error) {
        console.error('Error loading options:', error);
    }

    // set up covers
    try {
        albums = await window.electronAPI.getAlbumsFromCollection();
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

    /* DISPLAY */

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
            coverColors.cover = '#cfcfcf'; // reset cover colors
            coverColors.text = '#000000';

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
            showCovers([wayLeftCover, leftCover, centerCover, rightCover, wayRightCover]);

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
            cover.classList.remove('hidden');
        });
    }

    function hideCovers(covers) {
        covers.forEach((cover) => {
            cover.classList.add('hidden');
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

                // set text color 
                const color = dominantColor.replace('#', '');        
                const r = parseInt(color.slice(0, 2), 16);
                const g = parseInt(color.slice(2, 4), 16);
                const b = parseInt(color.slice(4, 6), 16);
                        
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const textColor = luminance > 0.5 ? '#000000' : '#ffffff';

                coverColors.cover = dominantColor;
                coverColors.text = textColor;
                
            } catch (error) {
                console.error('Error processing image for color extraction:', error);
                coverColors.cover = '#cfcfcf';
                coverColors.text = '#000000';
            }
        };

        img.onerror = () => {
            console.error('Failed to load image for color extraction:', albumCoverPath);
            coverColors.cover = '#cfcfcf';
            coverColors.text = '#000000';
        };
    }

    /* SEARCH */

    searchIcon.addEventListener('click', () => {
        searchBar.classList.toggle('hidden');
        searchInput.focus();
    });


    searchInput.addEventListener('keydown', (event) => {
        if (event.key === "Enter") {
            
            // replace search icon with cancel icon
            searchIcon.classList.add('hidden');
            cancelIcon.classList.remove('hidden');

            // handle input
            const input = searchInput.value.trim();
            searchInput.blur();
            handleSearch(input);
        }
    });

    cancelIcon.addEventListener('click', async () => {
        searchInput.value = '';
        cancelIcon.classList.add('hidden');
        searchIcon.classList.remove('hidden');

        // save current album
        let centerAlbum = null;
        if (albums.length !== 0) {
            centerAlbum = albums[currentIndex];
        }

        // refresh albums
        albums = await window.electronAPI.getAlbumsFromCollection();
        
        // get the index of the album that was shown
        if (centerAlbum) {
            currentIndex = findAlbumIndex(centerAlbum)
        } else {
            currentIndex = savedIndex;
        }

        await updateDisplay();
    });

    document.addEventListener('click', (event) => {
        if (!searchBar.classList.contains('hidden') && !event.target.closest('.search-icon') && !event.target.closest('.search-bar') && searchInput.value == '') {
            searchBar.classList.add('hidden');
        }
    });

    async function handleSearch(input) {

        // get query tokens
        const results = tokenizeInput(input);

        // start with full collection
        let matchedAlbums = await window.electronAPI.getAlbumsFromCollection();

        // handle each section of OR operation
        if (results.orGroups && results.orGroups.length > 0) {
            matchedAlbums = matchedAlbums.filter(album => {
                return results.orGroups.some(group => {

                    // check general matches for each group
                    const generalMatch = group.general.length === 0 ||
                        group.general.every(term => 
                            album.album.toLowerCase().includes(term) ||
                            album.artist.toLowerCase().includes(term) ||
                            album.year.toString() === term
                        );

                    // check phrase matches for each group
                    const phraseMatch = group.phrase.length === 0 ||
                        group.phrase.every(phrase => 
                            album.album.toLowerCase() === phrase.toLowerCase() ||
                            album.artist.toLowerCase() === phrase.toLowerCase()
                        );

                    return generalMatch && phraseMatch;
                })
            })

        // handle non-OR input
        } else {

            // check phrase matches
            if (results.phrase.length > 0) {
                matchedAlbums = matchedAlbums.filter(album => {
                    return results.phrase.some(phrase => 
                        album.album.toLowerCase() === phrase.toLowerCase() ||
                        album.artist.toLowerCase() === phrase.toLowerCase()
                    );
                });
            }

            // check general searches
            if (results.general.length > 0) {
                matchedAlbums = matchedAlbums.filter(album => {
                    return results.general.every(term =>
                        album.album.toLowerCase().includes(term) ||
                        album.artist.toLowerCase().includes(term) ||
                        album.year.toString() === term
                    );
                });
            }
        }

        // always check year ranges
        if (results.ranges[0] !== 0) {
            matchedAlbums = matchedAlbums.filter(album => 
                parseInt(album.year) >= results.ranges[0]
            );
        }

        if (results.ranges[1] !== Infinity) {
            matchedAlbums = matchedAlbums.filter(album => 
                parseInt(album.year) <= results.ranges[1]
            );
        }

        // set global albums to filtered collection
        albums = matchedAlbums;
        savedIndex = currentIndex;
        currentIndex = 0;
        await updateDisplay();
    }

    function tokenizeInput(input) {

        let results = {
            general: [],
            phrase: [],
            ranges: [0, Infinity],
            orGroups: []
        };

        // AND operator already handled by general search
        input.replace(" AND ", " ");

        // split OR sections and handle each one
        const orSections = input.split(" OR ");
        if (orSections.length > 1) {
            orSections.forEach(section => {
                const sectionResults = tokenizeSection(section.trim());

                // save general and/or phrase tokens from section
                if (sectionResults.general.length > 0 || sectionResults.phrase.length > 0) {
                    results.orGroups.push(sectionResults);
                }

                // always save ranges
                if (sectionResults.ranges[0] !== 0 || sectionResults.ranges[1] !== Infinity) {
                    results.ranges = sectionResults.ranges;
                }
            });

        // handle normally
        } else {
            results = tokenizeSection(input);
        }

        return results;
    }

    function tokenizeSection(section) {

        const results = { general: [], phrase: [], ranges: [0, Infinity] };

        // handle phrase, range, and general search types
        const tokens = section.match(/(?:"[^"]*"|(?:year:|artist:|album:|from:|to:|[a-zA-Z]+:)(?:"[^"]*"|\S+)|\S+)/gm) || [];
        tokens.forEach(token => {

            const rangeMatch = token.match(/year([<>]={0,1})[0-9]+/);

            // phrase match (highest priority)
            if (token.startsWith('"') && token.endsWith('"')) {
                results.phrase.push(token.slice(1, -1));
            }

            // year ranges (less than/greater than syntax)
            else if (rangeMatch) {
                const year = parseInt(token.split(rangeMatch[1])[1]);
                if (rangeMatch[1] === '>=') results.ranges[0] = year;
                else if (rangeMatch[1] === '<=') results.ranges[1] = year;
                else if (rangeMatch[1] === '>') results.ranges[0] = year + 1;
                else if (rangeMatch[1] === '<') results.ranges[1] = year + 1;
            }

            // year ranges (from/to syntax)
            else if (token.includes('from:') || token.includes('to:')) {
                const [key, value] = token.split(':');
                if (!isNaN(value)) {
                    if (key === 'from:') results.ranges[0] = parseInt(value); 
                    else if (key === 'to:') results.ranges[1] = parseInt(value);
                }
            }

            // general search (lowest priority)
            else {
                results.general.push(token.toLowerCase());
            }
        });

        return results;
    }

    /* INFORMATION PAGE */

    infoButton.addEventListener('click', async () => {
        if (infoDisplayed) {
            infoOverlay.classList.remove('show');
            infoDisplayed = false;
            return;
        }
        infoDisplayed = true;
        showAlbumInfo();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && infoDisplayed) {
            event.preventDefault();
            event.stopPropagation();
            infoOverlay.classList.remove('show');
            infoDisplayed = false;
        }
    });

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

        createAlbumChart(collectionStats.albumsByYear);

        infoOverlay.classList.add('show');
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
        const minYear = Math.min(...Object.keys(albumsByYear).map(Number).filter(year => year >= 1900)); // see below
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

    function createAlbumChart(albumsByYear) {
        if (cachedChart && !wasCollectionUpdated) {
            return;
        }

        if (cachedChart) {
            cachedChart.destroy()
        }
        
        const decadeData = {};
        Object.entries(albumsByYear).forEach(([year, count]) => {
            if (year >= 1900) { // the first modern vinyl record was released in 1948, so this is generous
                const decade = Math.floor(Number(year) / 10) * 10;
                decadeData[decade] = (decadeData[decade] || 0) + count;
            }
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

    /* SORTING */

    sortIcon.addEventListener('click', () => {
        // prep menu before showing
        if (!sortMenuContent.classList.contains('show')) {
            if (sortingOptions.method === 'artist') {
                sortByArtist.classList.add('selected');
                sortByYear.classList.remove('selected');
                sortByDateAdded.classList.remove('selected');
            } else if (sortingOptions.method === 'year') {
                sortByArtist.classList.remove('selected');
                sortByYear.classList.add('selected');
                sortByDateAdded.classList.remove('selected');
            } else if (sortingOptions.method === 'dateAdded') {
                sortByArtist.classList.remove('selected');
                sortByYear.classList.remove('selected');
                sortByDateAdded.classList.add('selected');
            }
            if (sortingOptions.order === 'ascending') {
                ascending.classList.add('selected');
                descending.classList.remove('selected');
            } else if (sortingOptions.order === 'descending') {
                ascending.classList.remove('selected');
                descending.classList.add('selected');
            }
        }
        sortMenuContent.classList.toggle('show');
    });

    sortByArtist.addEventListener('click', async () => {
        if (sortingOptions.method !== 'artist') {
            sortingOptions.method = 'artist';
            await updateSorting();
        } 

        sortMenuContent.classList.remove('show');
    });

    sortByYear.addEventListener('click', async () => {
        if (sortingOptions.method !== 'year') {
            sortingOptions.method = 'year';
            await updateSorting();
        }

        sortMenuContent.classList.remove('show');
    });

    sortByDateAdded.addEventListener('click', async () => {
        if (sortingOptions.method !== 'dateAdded') {
            sortingOptions.method = 'dateAdded';
            await updateSorting();
        }

        sortMenuContent.classList.remove('show');
    });

    ascending.addEventListener('click', async () => {
        if (sortingOptions.order !== 'ascending') {
            sortingOptions.order = 'ascending';
            await updateSorting();
        }

        sortMenuContent.classList.remove('show');
    });

    descending.addEventListener('click', async () => {
        if (sortingOptions.order !== 'descending') {
            sortingOptions.order = 'descending';
            await updateSorting();
        }

        sortMenuContent.classList.remove('show');
    });

    /* SHUFFLE COLLECTION */

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
        const endSpeed = 200;
        const minAccel = 1.03; // 50 to 200 in 5 seconds
        const maxAccel = 1.15; // 50 to 200 in 1 seconds
        const accel = Math.random() * (maxAccel - minAccel) + minAccel;
        let oneSecond = 1000; // spin at 50 ms per iteration for 1 second (to start)
        
        while (true) {
            // update display
            currentIndex = (currentIndex + 1) % albums.length;
            await updateDisplay();
                        
            // check stop conditions 
            if (currentSpeed >= endSpeed) {
                break;
            }
            
            if (oneSecond > 0) {
                // spin for one second first before reducing speed
                oneSecond -= currentSpeed;
            } else {
                // update speed and wait
                currentSpeed = Math.min(currentSpeed * accel, endSpeed);
            }            
            await new Promise(resolve => setTimeout(resolve, currentSpeed));
        }
        
        // focus final album after 500 ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            await window.electronAPI.openAlbumFocusWindow(albums[currentIndex], coverColors);
        } catch (error) {
            console.error('Error opening album focus window:', error);
        }
    }

    /* ADD ALBUM */

    addAlbumButton.addEventListener('click', async () => {
        try {
            await window.electronAPI.openAddAlbumWindow(coverColors);
        } catch (error) {
            console.error('Error adding album:', error);
            alert(`Failed to add album. Please try again. Error: ${error.message}`);
        }
    });

    /* COVER FOCUS/MOVEMENT */

    centerCover.addEventListener('click', async () => {
        if (albums.length === 0 || !allowCoverFocus) return;
        try {
            await window.electronAPI.openAlbumFocusWindow(albums[currentIndex], coverColors);
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

    /* CALLBACK FOR COLLECTION UPDATES */

    // listen for an album added
    window.electronAPI.onAlbumAdded(async (albumData) => {

        wasCollectionUpdated = true;

        // store the current album before refreshing the collection
        const currentAlbum = albums.length > 0 ? albums[currentIndex] : null;
        albums = await window.electronAPI.getAlbumsFromCollection();

        if (!albumData) {
            // album was deleted
            currentIndex = currentIndex > 0 ? currentIndex : 0;
        } else {
            // try to find the updated album
            let newIndex = findAlbumIndex(albumData);
            if (newIndex > -1 && newIndex < albums.length) {
                currentIndex = newIndex;
            } else {
                currentIndex = currentIndex < albums.length ? currentIndex : 0;
            }
        }

        await updateDisplay();
    });

    /* HELPER FUNCTIONS */

    async function updateSorting() {
        const currentAlbum = albums[currentIndex];
        albums = await window.electronAPI.updateSortingOptions(sortingOptions, albums);

        let index;
        if (currentAlbum) index = findAlbumIndex(currentAlbum);

        currentIndex = index > 0 ? index : getRandomIndex(albums.length);
        await updateDisplay();
    }

    function findAlbumIndex(albumInfo) {
        const newIndex = albums.findIndex(album => 
            album.album === albumInfo.album &&
            album.artist === albumInfo.artist
        );
        return newIndex;
    }
});

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
};

