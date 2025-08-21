const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const osTmpdir = require('os').tmpdir;

test.describe('Delete Album Tests', () => {
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

        // clean up temp directory
        if (tempUserDataDir && fs.existsSync(tempUserDataDir)) {
            execSync(`rm -rf "${tempUserDataDir}"`);
        }
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

    async function deleteAlbum() {
        const focusWindow = await openFocusWindow();
        const editWindow = await openEditWindow(focusWindow);
        await editWindow.locator('#deleteAlbum').click();
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

    test('Setup album to delete', async () => {
        const albumData = { album: "Let It Be", artist: "The Beatles", year: "1970" };
        await addAlbumToCollection(albumData);
    });

    test('Delete albums', async () => {
        // check initial cover visibility
        await isCoverVisible(false, false, true, false, false);

        // delete album
        await deleteAlbum();

        // check updated cover visibility
        await isCoverVisible(false, false, false, false, false);
        await expect(mainWindow.locator('#albumTitle')).toContainText('No albums found');
        await expect(mainWindow.locator('#artistName')).toContainText('');
        await expect(mainWindow.locator('#year')).toContainText('');
    });
});