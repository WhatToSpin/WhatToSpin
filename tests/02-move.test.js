const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test.describe('Movement Tests', () => {
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

        await mainWindow.waitForTimeout(1000);
        const coverSrc = await mainWindow.locator('#centerCover').getAttribute('src');
        console.log(`cover source: ${coverSrc}`);

        // check for album info
        await expect(mainWindow.locator('#albumTitle')).toContainText(/.+/gm)
        await expect(mainWindow.locator('#artistName')).toContainText(/.+/gm)
    });

    test.afterAll(async () => {
        // close app
        await mainWindow.close();
        await electronApp.close();
    });

    async function shiftCover(cover) {
        // get current centered album name
        const oldCenterAlbum = await mainWindow.locator('#albumTitle').textContent();
        
        // shift albums
        await mainWindow.locator(cover).click();

        // check that centered album changed
        const newCenterAlbum = await mainWindow.locator('#albumTitle').textContent();
        expect(oldCenterAlbum == newCenterAlbum).toBe(false);
    }

    test('Test right shift', async () => {
        await shiftCover('#rightCover')
    });

    test('Test left shift', async () => {
        await shiftCover('#leftCover')
    });

    test('Test way right shift', async () => {
        await shiftCover('#wayRightCover')
    });

    test('Test way left shift', async () => {
        await shiftCover('#wayLeftCover')
    });

    test('Shuffle albums', async () => {

        // expect album focus popup
        const popupPromise = electronApp.waitForEvent('window');

        // shuffle albums
        await mainWindow.locator('#shuffleButton').click();
        await mainWindow.waitForTimeout(3500); // shuffle is 1 - 3 seconds

        // check that an album is focused
        const popupWindow = await popupPromise;
        await popupWindow.waitForLoadState('domcontentloaded');

        // check for album info
        await expect(popupWindow.locator('#focusedCover')).toBeVisible();
        await expect(popupWindow.locator('#focusedAlbumTitle')).toContainText(/.+/gm);
        await expect(popupWindow.locator('#focusedArtistName')).toContainText(/.+/gm);

        // close popup
        await popupWindow.close();
    });
});