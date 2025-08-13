const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');

test.describe('Edit Album Tests', () => {
    let electronApp;
    let mainWindow;

    test.beforeAll(async () => {
        // launch app
        electronApp = await electron.launch({ 
            args: ['./src/main.js'] 
        });
        mainWindow = await electronApp.firstWindow();

        // check for album covers
        await expect(mainWindow.locator('#wayLeftCover')).toBeVisible();
        await expect(mainWindow.locator('#leftCover')).toBeVisible();
        await expect(mainWindow.locator('#centerCover')).toBeVisible();
        await expect(mainWindow.locator('#rightCover')).toBeVisible();
        await expect(mainWindow.locator('#wayRightCover')).toBeVisible();

        // check for album info
        await expect(mainWindow.locator('#albumTitle')).toContainText(/.+/gm)
        await expect(mainWindow.locator('#artistName')).toContainText(/.+/gm)
    });

    test.afterAll(async () => {
        // close app
        await mainWindow.close();
        await electronApp.close();
    });

    async function openFocusPopup() {
        const popupPromise = electronApp.waitForEvent('window');
        await mainWindow.locator('#centerCover').click();
        const popupWindow = await popupPromise;
        await popupWindow.waitForLoadState('domcontentloaded');
        return popupWindow;
    }

    async function openEditPopup(focusPopup) {
        const popupPromise = electronApp.waitForEvent('window');
        await focusPopup.locator('#options').click();
        await focusPopup.locator('#edit').click();
        const editPopup = await popupPromise;
        await editPopup.waitForLoadState('domcontentloaded');
        return editPopup;
    }

    test('Open dropdown menu', async () => {
        // open album focus 
        const popupWindow = await openFocusPopup();

        // press options button
        await expect(popupWindow.locator('#options')).toBeVisible();
        await expect(popupWindow.locator('#dropdownContent')).toBeHidden();
        await popupWindow.locator('#options').click();
        await expect(popupWindow.locator('#dropdownContent')).toBeVisible();

        // click button again to hide
        await popupWindow.locator('#options').click();
        await expect(popupWindow.locator('#dropdownContent')).toBeHidden();

        // press options button
        await expect(popupWindow.locator('#dropdownContent')).toBeHidden();
        await popupWindow.locator('#options').click();
        await expect(popupWindow.locator('#dropdownContent')).toBeVisible();

        // click off menu to hide
        await popupWindow.mouse.click(200, 150);
        await expect(popupWindow.locator('#dropdownContent')).toBeHidden();

        // close album focus
        await popupWindow.close();
    });

    test('Open edit album menu', async () => {
        // open album edit popup
        const focusPopup = await openFocusPopup();
        const editPopup = await openEditPopup(focusPopup);

        // check content editable
        await expect(editPopup.locator('#editAlbumTitle')).toHaveAttribute('contenteditable', 'true');
        await expect(editPopup.locator('#editArtistName')).toHaveAttribute('contenteditable', 'true');
        await expect(editPopup.locator('#editYear')).toHaveAttribute('contenteditable', 'true');

        // close both windows
        await editPopup.close();
        await focusPopup.close();
    }); 

    test('Check edit album popup content', async () => {
        // open album foucs popup
        const focusPopup = await openFocusPopup();

        // get focus album info
        const focusAlbumName = await focusPopup.locator('#focusedAlbumTitle').textContent();
        const focusArtistName = await focusPopup.locator('#focusedArtistName').textContent();
        const focusYearReleased = await focusPopup.locator('#focusedYear').textContent();

        // open album edit popup
        const editPopup = await openEditPopup(focusPopup);

        // get edit album info
        const editAlbumName = await editPopup.locator('#editAlbumTitle').textContent();
        const editArtistName = await editPopup.locator('#editArtistName').textContent();
        const editYearReleased = await editPopup.locator('#editYear').textContent();

        // compare 
        expect(editAlbumName).toBe(focusAlbumName);
        expect(editArtistName).toBe(focusArtistName);
        expect(editYearReleased).toBe(focusYearReleased);

        // close both windows
        await editPopup.close();
        await focusPopup.close();
    });

    test('Edit album name', async () => {
        // open album edit popup
        const focusPopup = await openFocusPopup();
        const editPopup = await openEditPopup(focusPopup);

        // fill in new info
        await editPopup.locator('#editAlbumTitle').fill("Rubber Soul"); 

        // save changes
        await editPopup.locator('#saveChanges').click();

        // check that focus popup info is correct
        await expect(focusPopup.locator('#focusedAlbumTitle')).toContainText("Rubber Soul");

        // close focus popup
        await focusPopup.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#albumTitle')).toContainText("Rubber Soul");
    });

    test('Edit album year', async () => {
        // open album edit popup
        const focusPopup = await openFocusPopup();
        const editPopup = await openEditPopup(focusPopup);

        // fill in new info
        await editPopup.locator('#editYear').fill("1965");

        // save changes
        await editPopup.locator('#saveChanges').click();

        // check that focus popup info is correct
        await expect(focusPopup.locator('#focusedYear')).toContainText("1965");

        // close focus popup
        await focusPopup.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#year')).toContainText("1965");
    });

    test('Unsaved edits', async () => {
        // open album focus popup
        const focusPopup = await openFocusPopup();

        // get album info
        const albumTitle = await focusPopup.locator('#focusedAlbumTitle').textContent();
        const yearReleased = await focusPopup.locator('#focusedYear').textContent();

        // open album edit popup
        const editPopup = await openEditPopup(focusPopup);
    
        // fill in new info
        await editPopup.locator('#editAlbumTitle').fill("A Hard Days Night"); 
        await editPopup.locator('#editYear').fill("1964")

        // exit edit popup (without saving changes)
        await editPopup.close();
        
        // check that focus popup info is correct
        await expect(focusPopup.locator('#focusedAlbumTitle')).toContainText(albumTitle);
        await expect(focusPopup.locator('#focusedYear')).toContainText(yearReleased);

        // close focus popup
        await focusPopup.close();

        // check that main window info is correct
        await expect(mainWindow.locator('#albumTitle')).toContainText(albumTitle);
        await expect(mainWindow.locator('#year')).toContainText(yearReleased);
    })

    test('Edit album cover', async () => {
        // open album focus popup
        const focusPopup = await openFocusPopup();

        // capture old cover screenshot as buffer for comparison
        const oldCover = focusPopup.locator('#focusedCover');
        const oldCoverScreenshot = await oldCover.screenshot();
        await focusPopup.waitForTimeout(1000);

        // open album edit popup
        const editPopup = await openEditPopup(focusPopup);
        await editPopup.waitForTimeout(1000);

        // change cover
        const newCoverPath = path.join(__dirname, '..', 'src', 'assets', 'unknown.png');
        await editPopup.locator('#coverInput').setInputFiles(newCoverPath);
        await editPopup.waitForTimeout(1000);

        // save changes
        await editPopup.locator('#saveChanges').click();

        // check that focus popup cover has changed
        await focusPopup.waitForTimeout(1000);
        const newCover = focusPopup.locator('#focusedCover');
        const newCoverScreenshot = await newCover.screenshot();

        // verify the screenshots are different
        expect(Buffer.compare(oldCoverScreenshot, newCoverScreenshot)).not.toBe(0);

        // close focus popup
        await focusPopup.close();
    });
});
