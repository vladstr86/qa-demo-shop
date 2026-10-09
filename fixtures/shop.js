import { test as base, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { AccountPage } from '../pages/AccountPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
export const test = base.extend({
  shop: async ({ page }, use) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.clearStorage();
    await shop.reload();
    await shop.reset();
    await use(shop);
  },
  product: async ({ page, shop }, use) => { await use(new ProductPage(page)); },
  accountPage: async ({ page, shop }, use) => { await use(new AccountPage(page)); },
  checkout: async ({ page, shop }, use) => { await use(new CheckoutPage(page)); },
});
export { expect };
