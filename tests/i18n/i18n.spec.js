import { test, expect } from '../../fixtures/shop.js';
import { card, customer, euroCents, pricesCents, shippingCents, variants } from '../../test-data/shop.js';

test('RO/EN preserves variants, quantities and all checkout data without responsive overflow', async ({ shop, product, checkout }) => {
  await expect(shop.html).toHaveAttribute('lang', 'ro');
  await expect(shop.card(3)).toContainText('Căști Pulse Pro');
  expect(await shop.fitsViewport(), 'Romanian catalog fits the viewport').toBe(true);

  await test.step('product selections and quantity survive language changes', async () => {
    await shop.product(1);
    await product.select(variants.atlasUpgrade);
    await product.setQuantity(2);
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(shop.html).toHaveAttribute('lang', language);
      await expect(product.swatch('black')).toBeChecked();
      await expect(product.option('ram')).toHaveValue('32');
      await expect(product.option('ssd')).toHaveValue('1024');
      await expect(product.quantity).toHaveValue('2');
      expect(euroCents(await product.price.innerText(), language)).toBe(pricesCents.atlasUpgrade);
      expect(await shop.fitsViewport(), `${language} product dialog fits the viewport`).toBe(true);
    }
    await product.add(2);
  });

  const subtotal = pricesCents.atlasUpgrade * 2;
  await test.step('language persists after reload and the cart retains its variant and integer cents', async () => {
    await shop.language('en');
    await expect(shop.card(3)).toContainText('Pulse Pro Headphones');
    await expect(shop.card(3)).not.toContainText('Căști');
    await expect(shop.cartButton).toContainText('Cart');
    await shop.reload();
    await expect(shop.html).toHaveAttribute('lang', 'en');
    await shop.cart.open();
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(shop.cart.rows).toHaveCount(1);
      await expect(shop.cart.quantity('1-black-32-1024')).toHaveValue('2');
      expect(euroCents(await shop.cart.unitPrice('1-black-32-1024').innerText(), language)).toBe(pricesCents.atlasUpgrade);
      expect(await shop.cart.calculateSubtotalCents(language)).toBe(subtotal);
      expect(euroCents(await shop.cart.total.innerText(), language)).toBe(subtotal);
      expect(await shop.fitsViewport(), `${language} cart fits the viewport`).toBe(true);
      await shop.ensureVisible(shop.cart.checkoutButton);
      await expect(shop.cart.checkoutButton).toBeInViewport();
    }
    await shop.cart.checkout();
  });

  await test.step('contact, shipping, billing and newsletter values survive RO/EN', async () => {
    await checkout.address(customer);
    await checkout.billing(customer.billing);
    await checkout.newsletter(true);
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(checkout.field('customer-name')).toHaveValue(customer.name);
      await expect(checkout.field('customer-email')).toHaveValue(customer.email);
      await expect(checkout.field('customer-address')).toHaveValue(customer.address);
      await expect(checkout.field('billing-address')).toHaveValue(customer.billing);
      await expect(checkout.field('same-billing')).not.toBeChecked();
      await expect(checkout.field('newsletter')).toBeChecked();
      expect(euroCents(await checkout.total.innerText(), language)).toBe(subtotal + shippingCents.standard);
      expect(await shop.fitsViewport(), `${language} address dialog fits the viewport`).toBe(true);
    }
    await checkout.next();
  });

  const expectedTotal = subtotal + shippingCents.express;
  await test.step('express, card number, expiry and CVV survive language changes and back navigation', async () => {
    await checkout.shipping('express');
    await checkout.payment('card');
    await checkout.card();
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(checkout.shippingInput('express')).toBeChecked();
      await expect(checkout.paymentInput('card')).toBeChecked();
      await expect(checkout.field('card-number')).toHaveValue(card.number);
      await expect(checkout.field('card-expiry')).toHaveValue(card.expiry);
      await expect(checkout.field('card-cvv')).toHaveValue(card.cvv);
      expect(euroCents(await checkout.total.innerText(), language)).toBe(expectedTotal);
      expect(await shop.fitsViewport(), `${language} shipping dialog fits the viewport`).toBe(true);
    }
    await checkout.back();
    await expect(checkout.field('customer-name')).toHaveValue(customer.name);
    await expect(checkout.field('customer-email')).toHaveValue(customer.email);
    await expect(checkout.field('customer-address')).toHaveValue(customer.address);
    await expect(checkout.field('billing-address')).toHaveValue(customer.billing);
    await expect(checkout.field('newsletter')).toBeChecked();
    await checkout.next();
    await expect(checkout.shippingInput('express')).toBeChecked();
    await expect(checkout.paymentInput('card')).toBeChecked();
    await expect(checkout.field('card-number')).toHaveValue(card.number);
    await checkout.next();
  });

  await test.step('terms, review and saved confirmation amount remain bilingual after cart clearing', async () => {
    await checkout.terms(true);
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(checkout.field('terms')).toBeChecked();
      for (const value of [customer.name, customer.email, customer.address, customer.billing]) {
        await expect(checkout.review).toContainText(value);
      }
      expect(euroCents(await checkout.total.innerText(), language)).toBe(expectedTotal);
      expect(await shop.fitsViewport(), `${language} review fits the viewport`).toBe(true);
    }
    await checkout.place();
    await expect(checkout.confirmation).toBeVisible();
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expect(checkout.confirmation).toContainText(language === 'ro' ? 'Comanda a fost plasată!' : 'Order placed!');
      expect(euroCents(await checkout.orderTotal.innerText(), language)).toBe(expectedTotal);
      expect(await shop.fitsViewport(), `${language} confirmation fits the viewport`).toBe(true);
    }
    await checkout.close();
    await shop.cart.open();
    await expect(shop.cart.rows).toHaveCount(0);
    await expect(shop.cart.checkoutButton).toBeDisabled();
    expect(euroCents(await shop.cart.total.innerText())).toBe(0);
  });
});
