import { test, expect } from '../../fixtures/shop.js';
import { account } from '../../test-data/shop.js';

test('mock login rejects invalid credentials in RO/EN, then supports login and logout', async ({ shop, accountPage }) => {
  for (const language of ['ro', 'en']) {
    await test.step(`${language}: reject a copied invalid password`, async () => {
      await shop.language(language);
      const invalidAccount = { ...account, password: 'wrong-password' };
      await accountPage.login(invalidAccount.email, invalidAccount.password);
      await expect(accountPage.error).toHaveText(language === 'ro'
        ? 'Email sau parolă incorectă.' : 'Incorrect email or password.');
      expect(await accountPage.storage()).toEqual({ local: null, session: null });
      await expect(accountPage.loginButton).toBeVisible();
      await accountPage.close();
    });
    await test.step(`${language}: valid tab-session login, reload, and logout`, async () => {
      await accountPage.login(account.email, account.password);
      await expect(accountPage.dialog).not.toBeVisible();
      const storage = await accountPage.storage();
      expect(storage.local).toBeNull();
      expect(JSON.parse(storage.session).email).toBe(account.email);
      await shop.reload();
      await expect(accountPage.headerButton).toHaveText(language === 'ro' ? 'Contul meu' : 'My account');
      await accountPage.logout();
      expect(await accountPage.storage()).toEqual({ local: null, session: null });
      await expect(accountPage.headerButton).toHaveText(language === 'ro' ? 'Autentificare' : 'Sign in');
    });
  }
});
