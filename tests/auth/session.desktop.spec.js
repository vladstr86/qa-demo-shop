import { test, expect } from '../../fixtures/shop.js';
import { AccountPage } from '../../pages/AccountPage.js';
import { ShopPage } from '../../pages/ShopPage.js';
import { account } from '../../test-data/shop.js';

test('tab sessions and remember me persist correctly across reload and a new browser context', async ({ page, browser, baseURL, shop, accountPage }) => {
  for (const remember of [false, true]) {
    await test.step(`remember me = ${remember}: verify storage lifetime and logout`, async () => {
      await accountPage.login(account.email, account.password, remember);
      const storage = await accountPage.storage();
      expect(remember ? storage.local : storage.session).toBeTruthy();
      expect(remember ? storage.session : storage.local).toBeNull();
      await shop.reload();
      await accountPage.open();
      await expect(accountPage.logoutButton).toBeVisible();
      await accountPage.close();

      // A copied storageState includes localStorage, but excludes tab sessionStorage.
      const context = await browser.newContext({ baseURL, storageState: await page.context().storageState() });
      try {
        const nextPage = await context.newPage();
        const nextShop = new ShopPage(nextPage);
        const nextAccount = new AccountPage(nextPage);
        await nextShop.goto();
        await nextAccount.open();
        if (remember) {
          await expect(nextAccount.logoutButton).toBeVisible();
          expect(JSON.parse((await nextAccount.storage()).local).email).toBe(account.email);
          await nextAccount.logout();
          expect(await nextAccount.storage()).toEqual({ local: null, session: null });
          await nextShop.reload();
          await nextAccount.open();
          await expect(nextAccount.loginButton).toBeVisible();
        } else {
          await expect(nextAccount.loginButton).toBeVisible();
          expect(await nextAccount.storage()).toEqual({ local: null, session: null });
        }
      } finally {
        await context.close();
      }
      await accountPage.logout();
      expect(await accountPage.storage()).toEqual({ local: null, session: null });
      await shop.reload();
      await accountPage.open();
      await expect(accountPage.loginButton).toBeVisible();
      await accountPage.close();
    });
  }
});
