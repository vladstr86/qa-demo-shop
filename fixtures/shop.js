import { test as base, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { AccountPage } from '../pages/AccountPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { account as configuredAccount } from '../test-data/shop-data.js';
import { AccountApi } from './account-api.js';
export const test = base.extend({
  accountApi: [async ({ context }, use) => {
    const api = new AccountApi(context);
    await api.install();
    await use(api);
    expect(api.blocked, 'Routine browser tests must not contact a live or unexpected account endpoint').toEqual([]);
  }, { auto: true }],
  shop: async ({ page, accountApi }, use) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.clearStorage();
    await shop.reload();
    await shop.reset();
    await use(shop);
  },
  product: async ({ page, shop }, use) => { await use(new ProductPage(page)); },
  accountPage: async ({ page, shop }, use) => { await use(new AccountPage(page)); },
  account: async ({ accountPage }, use) => {
    await use(configuredAccount.email && configuredAccount.password
      ? configuredAccount : await accountPage.demoAccount());
  },
  checkout: async ({ page, shop }, use) => { await use(new CheckoutPage(page)); },
});
export { expect };
