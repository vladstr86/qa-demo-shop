import { test, expect } from '../../fixtures/shop.js';
import { AccountPage } from '../../pages/AccountPage.js';
import { ShopPage } from '../../pages/ShopPage.js';
import { AccountApi, realAccounts } from '../../fixtures/account-api.js';

test('mock remember-me persists selectively while real Auth stays in memory and expires safely', async ({ page, browser, baseURL, shop, product, accountPage, account, accountApi }) => {
  test.setTimeout(60000);
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
        const isolatedApi = new AccountApi(context);
        await isolatedApi.install();
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
        expect(isolatedApi.blocked).toEqual([]);
        expect(isolatedApi.writeCalls).toEqual([]);
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

  accountApi.enabled = true;
  await shop.reload();
  await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
  await expect(accountPage.profileForm).toBeVisible();
  await test.step('Real Auth uses the supplied SDK memory policy rather than mock remember-me storage', async () => {
    const storage = await accountPage.authStorage();
    expect([...Object.keys(storage.local), ...Object.keys(storage.session)].filter(key => /supabase|access_token|refresh_token|^sb-/u.test(key))).toEqual([]);
    await accountPage.close();
    await shop.reload();
    await accountPage.chooseReal();
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.realLoginButton).toBeVisible();
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.profileForm).toBeVisible();
  });
  await test.step('An expired trusted session clears owner contact/order UI and cannot write profile data', async () => {
    const writes = accountApi.writeCalls.length;
    for (const [token, owner] of accountApi.tokens) if (owner.id === realAccounts.a.id) accountApi.revoked.add(token);
    await accountPage.saveProfile();
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.orderRows).toHaveCount(0);
    await expect(accountPage.realLoginButton).toBeVisible();
    expect(accountApi.writeCalls).toHaveLength(writes);
  });
  await test.step('A failed remote sign-out clears the SDK session but preserves cart and language until Reset demo is retried', async () => {
    await accountPage.close();
    await shop.product(6);
    await product.add();
    const cart = await shop.cart.savedLines();
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.profileForm).toBeVisible();
    const language = await shop.languageState();
    const writes = accountApi.writeCalls.length;
    await accountPage.close();
    accountApi.logoutOutcome = 'network';
    await shop.reset();
    await accountPage.chooseReal();
    await expect(accountPage.authError).not.toHaveText('');
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.orderRows).toHaveCount(0);
    await expect(accountPage.realLoginButton).toBeVisible();
    expect(accountApi.writeCalls).toHaveLength(writes);
    expect(await shop.cart.savedLines()).toEqual(cart);
    expect(await shop.languageState()).toEqual(language);
    await accountPage.close();
    await shop.reset();
    await accountPage.chooseReal();
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.realLoginButton).toBeVisible();
    expect(await shop.cart.savedLines()).toEqual([]);
  });
});
