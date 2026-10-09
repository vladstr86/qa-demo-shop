import { test, expect } from '../../fixtures/shop.js';
import { account, customer, pricesCents, shippingCents, money, euroCents } from '../../test-data/shop.js';

test('authenticated cash checkout prefills the account email and then uses the fixed customer', async ({ shop, product, checkout, accountPage }) => {
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
  });
});
