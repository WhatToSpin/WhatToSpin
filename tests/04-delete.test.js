import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test.describe('Delete Album Tests', () => {
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

    async function deleteAlbum() {
        const focusPopup = await openFocusPopup();
        const editPopup = await openEditPopup(focusPopup);
        await editPopup.locator('#deleteAlbum').click();
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

    test('Delete albums', async () => {
        // delete album (should leave four albums)
        await deleteAlbum();

        // check cover visibilty
        await isCoverVisible(false, true, true, true, false);

        // delete album (should leave three albums)
        await deleteAlbum();
        await isCoverVisible(false, true, true, true, false);

        // delete album (should leave two albums)
        await deleteAlbum();
        await isCoverVisible(false, false, true, true, false);

        // delete album (should leave one albums)
        await deleteAlbum();
        await isCoverVisible(false, false, true, false, false);

        // delete album (should leave none)
        await deleteAlbum();
        await isCoverVisible(false, false, false, false, false);
        await expect(mainWindow.locator('#albumTitle')).toContainText('No albums found');
        await expect(mainWindow.locator('#artistName')).toContainText('');
        await expect(mainWindow.locator('#year')).toContainText('');
    });
});