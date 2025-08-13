const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

test.describe('Add Album Tests', () => {
    let electronApp;
    let mainWindow;

    test.beforeAll(async () => {

        // clear albums first
        const electronDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'Electron');
        try {
            execSync(`rm -f "${electronDataPath}/collection.json"`);
            execSync(`rm -rf "${electronDataPath}/covers/"`);
        } catch (error) {
            // ignore
        }

        // launch app
        electronApp = await electron.launch({ 
            args: ['./src/main.js'] 
        });
        mainWindow = await electronApp.firstWindow();
    });

    test.afterAll(async () => {
        // close app
        await mainWindow.close();
        await electronApp.close();
    });

    async function addAlbumToCollection(albumData) {
        // open add album window
        const windowPromise = electronApp.waitForEvent('window');
        await expect(mainWindow.locator('#addAlbumButton')).toBeVisible();
        await mainWindow.locator('#addAlbumButton').click();
        const addWindow = await windowPromise;
        await addWindow.waitForLoadState('domcontentloaded');

        // fill in album details
        await addWindow.locator('#album-name').fill(albumData.album);
        await addWindow.locator('#artist-name').fill(albumData.artist);
        await addWindow.locator('#year-released').fill(albumData.year);

        // click add album button
        await addWindow.locator('#submit-button').click();
        await addWindow.waitForEvent('close');
    }

    async function isCoverVisible(wayLeft, left, center, right, wayRight) {
        const coverStates = [
            { cover: '#wayLeftCover', visibility: wayLeft },
            { cover: '#leftCover', visibility: left },
            { cover: '#centerCover', visibility: center },
            { cover: '#rightCover', visibility: right },
            { cover: '#wayRightCover', visibility: wayRight },
        ];

        for (const { cover, visibility } of coverStates) {
            if (visibility) {
                await expect(mainWindow.locator(cover)).toBeVisible();
            } else {
                await expect(mainWindow.locator(cover)).toBeHidden();
            }
        }
    }

    test('Complete album information', async () => {
        // check for no albums 
        await expect(mainWindow.locator('#albumTitle')).toContainText('No albums found');
        await expect(mainWindow.locator('#artistName')).toContainText('');
        await expect(mainWindow.locator('#year')).toContainText('');

        // add album
        const albumData = { album: "Let It Be", artist: "The Beatles", year: "1970" };
        await addAlbumToCollection(albumData);

        // check that album was added
        expect(mainWindow.locator('#centerCover')).toBeVisible;
        expect(mainWindow.locator('#albumTitle')).toContainText('Let It Be');
        expect(mainWindow.locator('#artistName')).toContainText('The Beatles');
        expect(mainWindow.locator('#year')).toContainText('1970');

        // check cover visibility (center should be visible)
        isCoverVisible(false, false, true, false, false);
    });

    test('No release year', async () => {
        // add album
        const albumData = { album: "Abbey Road", artist: "The Beatles", year: '' };
        await addAlbumToCollection(albumData);

        // check that album was added
        expect(mainWindow.locator('#albumTitle')).toContainText('Abbey Road');
        expect(mainWindow.locator('#artistName')).toContainText('The Beatles');
        expect(mainWindow.locator('#year')).toBeHidden();

        // check cover visibility (center and right should be visible)
        isCoverVisible(false, false, true, true, false);
    });

    test('Cover visibility', async () => {
        // add album three
        await addAlbumToCollection({ album: "The Beatles (The White Album)", artist: "The Beatles", year: '1968' });

        // check cover visibility (center/left/right should be visible)
        isCoverVisible(false, true, true, true, false);

        // add album four
        await addAlbumToCollection({ album: "Sgt. Pepper's Lonely Hearts Club Band", artist: "The Beatles", year: '1967' });

        // check cover visibility (center/left/right should be visible)
        isCoverVisible(false, true, true, true, false);

        // add album five
        await addAlbumToCollection({ album: "Revolver", artist: "The Beatles", year: '1966' });

        // check cover visibility (all covers should be visible)
        isCoverVisible(true, true, true, true, true);
    })

    test('Missing information', async () => {
        // open add album window
        const windowPromise = electronApp.waitForEvent('window');
        await expect(mainWindow.locator('#addAlbumButton')).toBeVisible();
        await mainWindow.locator('#addAlbumButton').click();
        const addWindow = await windowPromise;
        await addWindow.waitForLoadState('domcontentloaded');

        // track error
        let alertMessage = '';
        let alertReceived = false;
        addWindow.on('dialog', async dialog => {
            alertMessage = dialog.message();
            alertReceived = true;
            await dialog.accept();
        });

        // click add album button (wait for error)
        await addWindow.locator('#submit-button').click();
        await addWindow.waitForTimeout(500);

        // check error
        expect(alertReceived).toBe(true);
        expect(alertMessage).toBe('Please fill in the album and artist name');
    });

    test('Album already exists', async () => {
        // open add album window
        const windowPromise = electronApp.waitForEvent('window');
        await expect(mainWindow.locator('#addAlbumButton')).toBeVisible();
        await mainWindow.locator('#addAlbumButton').click();
        const addWindow = await windowPromise;
        await addWindow.waitForLoadState('domcontentloaded');

        // track error
        let alertMessage = '';
        let alertReceived = false;
        addWindow.on('dialog', async dialog => {
            alertMessage = dialog.message();
            alertReceived = true;
            await dialog.accept();
        });

        // fill in album details
        await addWindow.locator('#album-name').fill('Let It Be');
        await addWindow.locator('#artist-name').fill('The Beatles');
        await addWindow.locator('#year-released').fill('1969');

        // click add album button (wait for error)
        await addWindow.locator('#submit-button').click();
        await addWindow.waitForTimeout(500);

        // check error
        expect(alertReceived).toBe(true);
        expect(alertMessage).toContain('Album already exists in the collection');
    });
});