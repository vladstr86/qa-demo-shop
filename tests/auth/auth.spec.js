import { test, expect } from '../../fixtures/shop.js';
import { accountContact, realAccounts } from '../../fixtures/account-api.js';

test('mock and real account modes validate credentials, confirmation and owner contact details in RO/EN', async ({ shop, product, accountPage, account, accountApi }) => {
  test.setTimeout(60000);
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

  await test.step('Missing configuration clearly disables real authentication without changing mock mode', async () => {
    await accountPage.chooseReal();
    await expect(accountPage.configMessage).toBeVisible();
    await expect(accountPage.realLoginButton).toBeDisabled();
    expect(accountApi.calls).toEqual([]);
    await accountPage.close();
  });

  accountApi.enabled = true;
  await shop.reload();
  await shop.language('en');
  await shop.product(6);
  await product.add();
  const originalCart = await shop.cart.savedLines();
  const registration = { email: 'registration-account@example.test', password: 'Fictional-Registration-42!' };

  await test.step('Registration validates email/password and explains confirmation without authenticating', async () => {
    await accountPage.register('invalid-email', 'short');
    expect(accountApi.calls.filter(call => call.path === '/auth/v1/signup')).toHaveLength(0);
    await accountPage.register(registration.email, registration.password);
    await expect(accountPage.authMessage).toContainText('not signed in yet');
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.realLogoutButton).not.toBeVisible();
    expect(await shop.cart.savedLines()).toEqual(originalCart);
    await expect(shop.html).toHaveAttribute('lang', 'en');

    accountApi.signupOutcome = 'duplicate';
    await accountPage.register(registration.email, registration.password);
    await expect(accountPage.authMessage).toContainText('confirmation');
    await expect(accountPage.profileForm).not.toBeVisible();
    accountApi.signupOutcome = 'error';
    await accountPage.register(registration.email, registration.password);
    await expect(accountPage.authError).not.toHaveText('');
    await expect(accountPage.field('real-login-email')).toHaveValue(registration.email);
    await expect(accountPage.realLogoutButton).not.toBeVisible();
  });

  await test.step('Real login reports invalid credentials and network failure before accepting the synthetic account', async () => {
    await accountPage.realLogin(realAccounts.a.email, 'wrong-password');
    await expect(accountPage.authError).not.toHaveText('');
    await expect(accountPage.profileForm).not.toBeVisible();
    accountApi.loginOutcome = 'network';
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.authError).not.toHaveText('');
    await expect(accountPage.profileForm).not.toBeVisible();
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.profileForm).toBeVisible();
    await expect(accountPage.field('profile-email')).toHaveValue(realAccounts.a.email);
    await expect(accountPage.field('profile-email')).toHaveAttribute('readonly', '');
    expect(await shop.cart.savedLines()).toEqual(originalCart);
  });

  const updated = { ...accountContact, name: 'Updated Fictional Owner', shipping: { ...accountContact.shipping, street: 'Updated Example Street' } };
  await test.step('Phone and structured addresses validate before saving, with form values preserved through RO/EN', async () => {
    await accountPage.profile({ ...updated, phone: '123' });
    const writes = accountApi.writeCalls.length;
    await accountPage.saveProfile();
    await expect(accountPage.profileError).not.toHaveText('');
    expect(accountApi.writeCalls).toHaveLength(writes);
    await accountPage.profile({ ...updated, shipping: { ...updated.shipping, houseNumber: '' } });
    await accountPage.saveProfile();
    expect(accountApi.writeCalls).toHaveLength(writes);
    await accountPage.profile(updated);
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      await expect(accountPage.field('profile-name')).toHaveValue(updated.name);
      await expect(accountPage.field('profile-phone')).toHaveValue(updated.phone);
      await expect(accountPage.field('profile-shipping-street')).toHaveValue(updated.shipping.street);
      await expect(accountPage.field('profile-billing-street')).toHaveValue(updated.billing.street);
      expect(await shop.fitsViewport(), `${language} authenticated contact dialog fits the viewport`).toBe(true);
    }
    await accountPage.saveProfile();
    await expect(accountPage.profileStatus).not.toHaveText('');
    expect(accountApi.profiles.get(realAccounts.a.id)).toMatchObject({ full_name: updated.name, phone: '+40700123456' });
    expect(JSON.parse(accountApi.addresses.get(realAccounts.a.id).shipping_address)).toEqual(updated.shipping);
    expect(JSON.parse(accountApi.addresses.get(realAccounts.a.id).billing_address)).toEqual(updated.billing);
    const storage = await accountPage.authStorage();
    expect([...Object.keys(storage.local), ...Object.keys(storage.session)].filter(key => /supabase|access_token|refresh_token|^sb-/u.test(key))).toEqual([]);
    await accountPage.close();
    await shop.reload();
    await accountPage.chooseReal();
    await expect(accountPage.profileForm).not.toBeVisible();
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.field('profile-name')).toHaveValue(updated.name);
    await expect(accountPage.field('profile-shipping-street')).toHaveValue(updated.shipping.street);
    await accountPage.realLogout();
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.orderRows).toHaveCount(0);
    expect(await shop.cart.savedLines()).toEqual(originalCart);
    await expect(shop.html).toHaveAttribute('lang', 'en');
  });
});
