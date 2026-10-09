import { test, expect } from '../../fixtures/shop.js';
import { variants, pricesCents, shippingCents, money, euroCents } from '../../test-data/shop.js';

async function expectCart(cart, language, expectedLines, expectedSubtotal) {
  const lines = await cart.readLines(language);
  const actualSubtotal = euroCents(await cart.total.innerText(), language);
  const calculatedSubtotal = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const diagnostic = `Cart ${language}: ${lines.map(line => `${line.key}: ${line.unitPriceText} (${line.unitPriceCents} cents) × ${line.quantity}`).join('; ')}; expected ${expectedSubtotal}, calculated ${calculatedSubtotal}, displayed ${actualSubtotal} cents`;

  expect(lines.map(line => line.key), diagnostic).toEqual(Object.keys(expectedLines));
  await expect(cart.rows).toHaveCount(Object.keys(expectedLines).length);
  for (const line of lines) {
    expect(line.unitPriceCents, diagnostic).toBe(expectedLines[line.key].price);
    expect(line.quantity, diagnostic).toBe(expectedLines[line.key].quantity);
    await expect(cart.unitPrice(line.key)).toHaveText(money(expectedLines[line.key].price, language));
    await expect(cart.quantity(line.key)).toHaveValue(String(expectedLines[line.key].quantity));
  }
  expect(calculatedSubtotal, diagnostic).toBe(expectedSubtotal);
  expect(await cart.calculateSubtotalCents(language), diagnostic).toBe(calculatedSubtotal);
  expect(actualSubtotal, diagnostic).toBe(calculatedSubtotal);
  await expect(cart.total).toHaveText(money(expectedSubtotal, language));
}

test('cart calculates displayed prices, rejects quantities, persists and merges distinct variants', async ({ shop, product }) => {
  await test.step('Build the required two-product cart using the catalog position loop', async () => {
    await shop.reset();
    await shop.language('ro');
    await shop.product(1);
    await product.select(variants.atlas);
    await product.add(2);
    await shop.openProductAtIndex(2, candidate => {
      expect(candidate).toEqual({ index: 2, name: 'Căști Pulse Pro', id: 3 });
    });
    await product.select(variants.pulseWireless);
    await product.add(3);
    await shop.cart.open();
  });

  const twoProducts = {
    '1-black-16-512': { price: pricesCents.atlas, quantity: 2 },
    '3-black-wireless': { price: pricesCents.pulseWireless, quantity: 3 },
  };
  for (const language of ['ro', 'en']) {
    await test.step(`Verify EUR cart mathematics and rejected quantities in ${language}`, async () => {
      await shop.language(language);
      await expectCart(shop.cart, language, twoProducts, 201785);
      await expect(shop.cart.shippingSummary).toContainText(money(shippingCents.standard, language));
      await expect(shop.cart.shippingSummary).toContainText(money(shippingCents.express, language));
      for (const invalidQuantity of [0, 11]) {
        await shop.cart.changeQuantity('1-black-16-512', invalidQuantity);
        await expect(shop.cart.error).not.toHaveText('');
        await expectCart(shop.cart, language, twoProducts, 201785);
      }
    });
  }

  await test.step('Recalculate quantity changes and removal independently', async () => {
    await shop.language('ro');
    await shop.cart.changeQuantity('1-black-16-512', 1);
    await expectCart(shop.cart, 'ro', {
      ...twoProducts,
      '1-black-16-512': { price: pricesCents.atlas, quantity: 1 },
    }, 121885);
    await shop.cart.remove('3-black-wireless');
    await expect(shop.cart.row('3-black-wireless')).toHaveCount(0);
    await expectCart(shop.cart, 'ro', {
      '1-black-16-512': { price: pricesCents.atlas, quantity: 1 },
    }, 79900);
  });

  await test.step('Persist the cart and merge only identical variants', async () => {
    await shop.language('en');
    await shop.cart.close();
    await shop.reload();
    await shop.cart.open();
    await expectCart(shop.cart, 'en', {
      '1-black-16-512': { price: pricesCents.atlas, quantity: 1 },
    }, 79900);
    await shop.cart.close();
    await shop.product(1);
    await product.select(variants.atlasUpgrade);
    await product.add();
    await shop.product(1);
    await product.select(variants.atlas);
    await product.add(2);
    await shop.cart.open();
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expectCart(shop.cart, language, {
        '1-black-16-512': { price: pricesCents.atlas, quantity: 3 },
        '1-black-32-1024': { price: pricesCents.atlasUpgrade, quantity: 1 },
      }, 335650);
    }
  });

  await test.step('Reset remains empty after reload', async () => {
    await shop.cart.close();
    await shop.reset();
    await shop.reload();
    await shop.cart.open();
    await expectCart(shop.cart, 'ro', {}, 0);
    await expect(shop.cart.checkoutButton).toBeDisabled();
  });
});
