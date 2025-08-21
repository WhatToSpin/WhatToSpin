const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const osTmpdir = require('os').tmpdir;

test.describe('Edit Album Tests', () => {
    let electronApp;
    let mainWindow;
    let tempUserDataDir;

    test.beforeAll(async () => {
        // create a temp directory
        tempUserDataDir = fs.mkdtempSync(path.join(osTmpdir(), 'test-dir-'));
        fs.mkdirSync(tempUserDataDir, { recursive: true });

        electronApp = await electron.launch({
            cwd: path.resolve(__dirname, '..'),
            args: [
                '.',
                `--user-data-dir=${tempUserDataDir}`
            ]
        });
        mainWindow = await electronApp.firstWindow();
        await mainWindow.waitForLoadState('domcontentloaded');
        await mainWindow.waitForTimeout(1000);
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
    
    async function openFocusWindow() {
        const windowPromise = electronApp.waitForEvent('window');
        await mainWindow.locator('#centerCover').click();
        const focusWindow = await windowPromise;
        await focusWindow.waitForLoadState('domcontentloaded');
        return focusWindow;
    }

    async function openEditWindow(focusWindow) {
        const windowPromise = electronApp.waitForEvent('window');
        await focusWindow.locator('#options').click();
        await focusWindow.locator('#edit').click();
        const editWindow = await windowPromise;
        await editWindow.waitForLoadState('domcontentloaded');
        return editWindow;
    }

    test('Setup album to edit', async () => {
        const albumData = { album: "Let It Be", artist: "The Beatles", year: "1970" };
        await addAlbumToCollection(albumData);
    });

    test('Open dropdown menu', async () => {
        // open album focus 
        const focusWindow = await openFocusWindow();

        // press options button
        await expect(focusWindow.locator('#options')).toBeVisible();
        await expect(focusWindow.locator('#dropdownContent')).toBeHidden();
        await focusWindow.locator('#options').click();
        await expect(focusWindow.locator('#dropdownContent')).toBeVisible();

        // click button again to hide
        await focusWindow.locator('#options').click();
        await expect(focusWindow.locator('#dropdownContent')).toBeHidden();

        // press options button
        await expect(focusWindow.locator('#dropdownContent')).toBeHidden();
        await focusWindow.locator('#options').click();
        await expect(focusWindow.locator('#dropdownContent')).toBeVisible();

        // click off menu to hide
        await focusWindow.mouse.click(200, 150);
        await expect(focusWindow.locator('#dropdownContent')).toBeHidden();

        // close album focus
        await focusWindow.close();
    });

    test('Open edit album menu', async () => {
        // open album edit window
        const focusWindow = await openFocusWindow();
        const editWindow = await openEditWindow(focusWindow);

        // check content editable
        await expect(editWindow.locator('#editAlbumTitle')).toHaveAttribute('contenteditable', 'true');
        await expect(editWindow.locator('#editArtistName')).toHaveAttribute('contenteditable', 'true');
        await expect(editWindow.locator('#editYear')).toHaveAttribute('contenteditable', 'true');

        // close both windows
        await editWindow.close();
        await focusWindow.close();
    }); 

    test('Check edit album window content', async () => {
        // open album foucs window
        const focusWindow = await openFocusWindow();

        // get focus album info
        const focusAlbumName = await focusWindow.locator('#focusedAlbumTitle').textContent();
        const focusArtistName = await focusWindow.locator('#focusedArtistName').textContent();
        const focusYearReleased = await focusWindow.locator('#focusedYear').textContent();

        // open album edit window
        const editWindow = await openEditWindow(focusWindow);

        // get edit album info
        const editAlbumName = await editWindow.locator('#editAlbumTitle').textContent();
        const editArtistName = await editWindow.locator('#editArtistName').textContent();
        const editYearReleased = await editWindow.locator('#editYear').textContent();

        // compare 
        expect(editAlbumName).toBe(focusAlbumName);
        expect(editArtistName).toBe(focusArtistName);
        expect(editYearReleased).toBe(focusYearReleased);

        // close both windows
        await editWindow.close();
        await focusWindow.close();
    });

    test('Edit album name', async () => {
        // open album edit window
        const focusWindow = await openFocusWindow();
        const editWindow = await openEditWindow(focusWindow);

        // fill in new info
        await editWindow.locator('#editAlbumTitle').fill("Rubber Soul"); 

        // save changes
        await editWindow.locator('#saveChanges').click();

        // check that focus window info is correct
        await expect(focusWindow.locator('#focusedAlbumTitle')).toContainText("Rubber Soul");

        // close focus window
        await focusWindow.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#albumTitle')).toContainText("Rubber Soul");
    });

    test('Edit album year', async () => {
        // open album edit window
        const focusWindow = await openFocusWindow();
        const editWindow = await openEditWindow(focusWindow);

        // fill in new info
        await editWindow.locator('#editYear').fill("1965");

        // save changes
        await editWindow.locator('#saveChanges').click();

        // check that focus window info is correct
        await expect(focusWindow.locator('#focusedYear')).toContainText("1965");

        // close focus window
        await focusWindow.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#year')).toContainText("1965");
    });

    test('Unsaved edits', async () => {
        // open album focus window
        const focusWindow = await openFocusWindow();

        // get album info
        const albumTitle = await focusWindow.locator('#focusedAlbumTitle').textContent();
        const yearReleased = await focusWindow.locator('#focusedYear').textContent();

        // open album edit window
        const editWindow = await openEditWindow(focusWindow);
    
        // fill in new info
        await editWindow.locator('#editAlbumTitle').fill("A Hard Days Night"); 
        await editWindow.locator('#editYear').fill("1964")

        // exit edit window (without saving changes)
        await editWindow.close();
        
        // check that focus window info is correct
        await expect(focusWindow.locator('#focusedAlbumTitle')).toContainText(albumTitle);
        await expect(focusWindow.locator('#focusedYear')).toContainText(yearReleased);

        // close focus window
        await focusWindow.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#albumTitle')).toContainText(albumTitle);
        await expect(mainWindow.locator('#year')).toContainText(yearReleased);
    })

    test('Edit album cover', async () => {
        // open album focus window
        const focusWindow = await openFocusWindow();

        // capture old cover screenshot as buffer for comparison
        const oldCover = focusWindow.locator('#focusedCover');
        const oldCoverScreenshot = await oldCover.screenshot();
        await focusWindow.waitForTimeout(1000);

        // open album edit window
        const editWindow = await openEditWindow(focusWindow);
        await editWindow.waitForTimeout(1000);

        // change cover
        const newCoverPath = path.join(__dirname, '..', 'src', 'assets', 'unknown.png');
        await editWindow.locator('#coverInput').setInputFiles(newCoverPath);
        await editWindow.waitForTimeout(1000);

        // save changes
        await editWindow.locator('#saveChanges').click();

        // check that focus window cover has changed
        await focusWindow.waitForTimeout(1000);
        const newCover = focusWindow.locator('#focusedCover');
        const newCoverScreenshot = await newCover.screenshot();

        // verify the screenshots are different
        expect(Buffer.compare(oldCoverScreenshot, newCoverScreenshot)).not.toBe(0);

        // close focus window
        await focusWindow.close();
    });
});
