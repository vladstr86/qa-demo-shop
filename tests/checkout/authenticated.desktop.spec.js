import { test, expect } from '../../fixtures/shop.js';
import { customer, pricesCents, shippingCents, money, euroCents } from '../../test-data/shop-data.js';
import { accountContact, realAccounts } from '../../fixtures/account-api.js';

test('mock cash checkout preserves fixed data and real account profiles and order history stay owner-scoped', async ({ page, shop, product, checkout, accountPage, account, accountApi }) => {
  test.setTimeout(60000);
  let subtotal;
  await test.step('Verify account prefill before entering the permanent customer data', async () => {
    await accountPage.login(account.email, account.password);
    await shop.product(4);
    await product.add();
    await shop.cart.open();
    const lines = await shop.cart.readLines('ro');
    expect(lines.map(({ key, unitPriceCents, quantity }) => ({ key, unitPriceCents, quantity }))).toEqual([
      { key: '4', unitPriceCents: pricesCents.wave, quantity: 1 },
    ]);
    subtotal = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
    expect(subtotal).toBe(4990);
    expect(euroCents(await shop.cart.total.innerText(), 'ro')).toBe(subtotal);
    await shop.cart.checkout();
    await expect(checkout.field('customer-email')).toHaveValue(account.email);
    await expect(checkout.field('same-billing')).toBeChecked();
    await expect(checkout.field('billing-address')).not.toBeVisible();
    await checkout.address(customer);
    await checkout.newsletter(false);
  });

  for (const language of ['ro', 'en']) {
    await test.step(`Preserve the fixed customer and disabled newsletter in ${language}`, async () => {
      await shop.language(language);
      await expect(checkout.field('customer-name')).toHaveValue(customer.name);
      await expect(checkout.field('customer-email')).toHaveValue(customer.email);
      await expect(checkout.field('customer-address')).toHaveValue(customer.address);
      await expect(checkout.field('billing-address')).not.toBeVisible();
      await expect(checkout.field('billing-address')).toHaveValue('');
      await expect(checkout.field('same-billing')).toBeChecked();
      await expect(checkout.field('newsletter')).not.toBeChecked();
      await expect(checkout.total).toHaveText(money(subtotal + shippingCents.standard, language));
    });
  }

  await test.step('Use Standard shipping and cash while Back preserves address details', async () => {
    await checkout.next();
    await checkout.back();
    await expect(checkout.field('customer-email')).toHaveValue(customer.email);
    await expect(checkout.field('customer-address')).toHaveValue(customer.address);
    await expect(checkout.field('same-billing')).toBeChecked();
    await expect(checkout.field('billing-address')).not.toBeVisible();
    await expect(checkout.field('newsletter')).not.toBeChecked();
    await checkout.next();
    await checkout.shipping('standard');
    await checkout.payment('cash');
    await expect(checkout.paymentInput('cash')).toBeChecked();
    await expect(checkout.field('card-number')).not.toBeVisible();
    await checkout.next();
    await expect(checkout.step).toHaveText('3 / 3');
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      for (const value of [customer.name, customer.email, customer.address]) {
        await expect(checkout.review).toContainText(value);
      }
      await expect(checkout.review).toContainText(`${language === 'ro' ? 'Facturare' : 'Billing'}: ${customer.address}`);
      await expect(checkout.review).toContainText(language === 'ro' ? 'Numerar' : 'Cash');
      await expect(checkout.review).toContainText(language === 'ro' ? 'Newsletter: Nu' : 'Newsletter: No');
      const total = euroCents(await checkout.total.innerText(), language);
      expect(total, `Wave Mini ${subtotal} + Standard ${shippingCents.standard}; displayed ${total} cents`).toBe(5290);
      await expect(checkout.total).toHaveText(money(subtotal + shippingCents.standard, language));
    }
    await checkout.place();
  });

  await test.step('Save the cash order total and empty the cart', async () => {
    await expect(checkout.confirmation).toBeVisible();
    expect(await shop.cart.savedLines(), 'The cash order clears the persisted cart').toEqual([]);
    await expect(checkout.orderNumber).toHaveText('DEMO-0001');
    await expect(checkout.orderTotal).toHaveText(money(subtotal + shippingCents.standard, 'ro'));
    expect(euroCents(await checkout.orderTotal.innerText(), 'ro')).toBe(5290);
    await checkout.close();
    await shop.cart.open();
    await expect(shop.cart.rows).toHaveCount(0);
    await expect(shop.cart.total).toHaveText(money(0, 'ro'));
    await expect(shop.cart.checkoutButton).toBeDisabled();
    expect(euroCents(await checkout.orderTotal.innerText(), 'ro'), 'The cash confirmation retains its total after reopening the empty cart').toBe(5290);
    expect(accountApi.writeCalls, 'Demo account login remains a local mock order').toEqual([]);
  });

  await shop.cart.close();
  accountApi.enabled = true;
  const secondContact = { ...accountContact, name: 'Fictional Second Owner', shipping: { ...accountContact.shipping, street: 'Second Owner Street' } };
  accountApi.seedProfile(realAccounts.b, secondContact);
  await shop.reload();
  await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
  await expect(accountPage.profileForm).toBeVisible();
  const firstContact = { ...accountContact, name: 'Fictional First Owner', shipping: { ...accountContact.shipping, street: 'First Owner Street' } };

  await test.step('Owner-only HTTP contracts deny foreign profile reads and updates; order history never exposes another owner', async () => {
    await accountPage.profile(firstContact);
    await accountPage.saveProfile();
    await expect(accountPage.profileStatus).not.toHaveText('');
    const foreignRead = await accountApi.requestAs(page, realAccounts.b, `/rest/v1/qa_demo_profiles?select=*&user_id=eq.${realAccounts.a.id}`);
    expect(foreignRead).toEqual({ status: 200, data: null });
    const foreignWrite = await accountApi.requestAs(page, realAccounts.b, '/rest/v1/qa_demo_profiles', {
      method: 'POST', body: { user_id: realAccounts.a.id, full_name: 'Forbidden Replacement', phone: '+40700123456' },
    });
    expect(foreignWrite.status).toBe(403);
    expect(accountApi.profiles.get(realAccounts.a.id).full_name).toBe(firstContact.name);

    const orderId = '33333333-3333-4333-8333-333333333333';
    const order = await accountApi.requestAs(page, realAccounts.a, '/rest/v1/rpc/qa_demo_place_authenticated_order', {
      method: 'POST', body: { p_request_id: orderId, p_contact: { name: firstContact.name, phone: '+40700123456',
        shipping_address: JSON.stringify(firstContact.shipping), billing_address: JSON.stringify(firstContact.billing) },
        p_items: [{ variant_key: '4', quantity: 1 }], p_shipping: 'standard' },
    });
    expect(order.status).toBe(200);
    expect(order.data.total_cents).toBe(5290);
    const foreignOrders = await accountApi.requestAs(page, realAccounts.b, '/rest/v1/rpc/qa_demo_my_orders', { method: 'POST', body: { p_limit: 25 } });
    expect(foreignOrders).toEqual({ status: 200, data: [] });
    await accountPage.close();
    await accountPage.open();
    await accountPage.reloadAccount();
    await expect(accountPage.orderRow(orderId)).toBeVisible();
    await expect(accountPage.orderRows).toHaveCount(1);
    await accountPage.realLogout();
    await expect(accountPage.profileForm).not.toBeVisible();
    await expect(accountPage.orderRows).toHaveCount(0);
    await accountPage.realLogin(realAccounts.b.email, realAccounts.b.password);
    await expect(accountPage.field('profile-name')).toHaveValue(secondContact.name);
    await expect(accountPage.field('profile-email')).toHaveValue(realAccounts.b.email);
    await expect(accountPage.field('profile-shipping-street')).toHaveValue(secondContact.shipping.street);
    await expect(accountPage.orderRows).toHaveCount(0);
    await accountPage.realLogout();
  });

  await test.step('A delayed expired profile response from the old owner cannot sign out or replace the new owner', async () => {
    await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
    await expect(accountPage.field('profile-email')).toHaveValue(realAccounts.a.email);
    accountApi.delayedProfileOwner = realAccounts.a.id;
    await accountPage.reloadAccount();
    await expect.poll(() => typeof accountApi.releaseProfileRead).toBe('function');
    await accountPage.realLogout();
    await accountPage.realLogin(realAccounts.b.email, realAccounts.b.password);
    await expect(accountPage.field('profile-email')).toHaveValue(realAccounts.b.email);
    await expect(accountPage.field('profile-name')).toHaveValue(secondContact.name);
    const logoutCalls = accountApi.calls.filter(call => call.path === '/auth/v1/logout').length;
    const oldResponse = accountPage.expiredProfileResponse();
    accountApi.releaseProfileRead();
    await oldResponse;
    await accountPage.reloadAccount();
    await expect(accountPage.profileForm).toBeVisible();
    await expect(accountPage.field('profile-email')).toHaveValue(realAccounts.b.email);
    await expect(accountPage.field('profile-name')).toHaveValue(secondContact.name);
    await expect(accountPage.field('profile-shipping-street')).toHaveValue(secondContact.shipping.street);
    await expect(accountPage.orderRows).toHaveCount(0);
    expect(accountApi.calls.filter(call => call.path === '/auth/v1/logout')).toHaveLength(logoutCalls);
    await accountPage.realLogout();
  });
});
