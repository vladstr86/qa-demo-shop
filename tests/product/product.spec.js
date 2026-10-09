import { test, expect } from '../../fixtures/shop.js';
import { euroCents, pricesCents, variants } from '../../test-data/shop-data.js';

test('product variants show fixed bilingual prices and every gallery image decodes', async ({ shop, product }) => {
  test.setTimeout(90_000);
  const configurations = [
    { id: 1, attributes: variants.atlas, cents: pricesCents.atlas },
    { id: 1, attributes: { ...variants.atlas, ram: '32' }, cents: pricesCents.atlas + 10000 },
    { id: 1, attributes: { ...variants.atlas, ssd: '1024' }, cents: pricesCents.atlas + 6050 },
    { id: 1, attributes: variants.atlasUpgrade, cents: pricesCents.atlasUpgrade },
    { id: 2, attributes: variants.horizon, cents: pricesCents.horizon },
    { id: 2, attributes: variants.horizonUpgrade, cents: pricesCents.horizonUpgrade },
    { id: 3, attributes: variants.pulseWireless, cents: pricesCents.pulseWireless },
    { id: 3, attributes: variants.pulseWired, cents: pricesCents.pulseWired },
    { id: 4, attributes: {}, cents: pricesCents.wave },
    { id: 5, attributes: {}, cents: pricesCents.keyboard },
    { id: 6, attributes: {}, cents: pricesCents.mouse },
  ];

  await test.step('base prices and individual upgrades retain integer cents across RO/EN', async () => {
    for (const configuration of configurations) {
      await shop.product(configuration.id);
      await product.select(configuration.attributes);
      for (const language of ['ro', 'en']) {
        await shop.language(language);
        const rendered = await product.price.innerText();
        expect(euroCents(rendered, language), `Product ${configuration.id}: ${JSON.stringify(configuration.attributes)}, ${language}: ${rendered}`).toBe(configuration.cents);
        for (const [attribute, value] of Object.entries(configuration.attributes)) {
          if (attribute === 'color') await expect(product.swatch(value)).toBeChecked();
          else await expect(product.option(attribute)).toHaveValue(value);
        }
      }
      await product.close();
      await shop.language('ro');
    }
  });

  for (let id = 1; id <= 6; id++) {
    await test.step(`product ${id}: main images, thumbnails, zoom and gallery wrapping`, async () => {
      await shop.product(id);
      const colors = id <= 3 ? ['red', 'purple', 'black'] : [null];
      for (const color of colors) {
        await product.thumbnail(1);
        if (color) {
          await product.select({ color });
          await expect(product.swatch(color)).toBeChecked();
          for (const other of colors.filter(value => value !== color)) await expect(product.swatch(other)).not.toBeChecked();
        }
        const suffix = color ? `-${color}` : '';
        for (let thumb = 1; thumb <= 3; thumb++) {
          const thumbnail = product.thumbImage(thumb);
          await expect(thumbnail).toBeVisible();
          await expect(thumbnail).toHaveAttribute('src', new RegExp(`${id}-${thumb}${suffix}\\.png$`));
          await expect.poll(() => product.imageDecoded(thumbnail), { message: `Product ${id}, ${color || 'default'} thumbnail ${thumb} decodes` }).toBe(true);
        }
        for (let view = 1; view <= 3; view++) {
          await product.thumbnail(view);
          const source = new RegExp(`${id}-${view}${suffix}\\.png$`);
          await expect(product.galleryImage).toBeVisible();
          await expect(product.galleryImage).toHaveAttribute('src', source);
          await expect.poll(() => product.imageDecoded(product.galleryImage), { message: `Product ${id}, ${color || 'default'} view ${view} decodes` }).toBe(true);
          await product.openZoom();
          await expect(product.zoomDialog).toBeVisible();
          await expect(product.zoomImage).toBeVisible();
          await expect(product.zoomImage).toHaveAttribute('src', source);
          await expect.poll(() => product.imageDecoded(product.zoomImage), { message: `Product ${id}, ${color || 'default'} zoom ${view} decodes` }).toBe(true);
          await product.closeZoom();
          await expect(product.zoomDialog).not.toBeVisible();
        }
        await product.nextImage();
        await expect(product.galleryImage).toHaveAttribute('src', new RegExp(`${id}-1${suffix}\\.png$`));
        await expect.poll(() => product.imageDecoded(product.galleryImage)).toBe(true);
        await product.previousImage();
        await expect(product.galleryImage).toHaveAttribute('src', new RegExp(`${id}-3${suffix}\\.png$`));
        await expect.poll(() => product.imageDecoded(product.galleryImage)).toBe(true);
      }
      await product.close();
    });
  }
});

test('product validation preserves the cart for missing options, unavailable stock and quantity limits', async ({ shop, product }) => {
  await shop.language('ro');
  await shop.product(6);
  await product.add();

  async function expectSeedCart() {
    await shop.cart.open();
    await expect(shop.cart.rows).toHaveCount(1);
    await expect(shop.cart.row('6')).toBeVisible();
    await expect(shop.cart.quantity('6')).toHaveValue('1');
    expect(euroCents(await shop.cart.unitPrice('6').innerText())).toBe(pricesCents.mouse);
    expect(euroCents(await shop.cart.total.innerText())).toBe(pricesCents.mouse);
    await shop.cart.close();
  }

  for (const configuration of [
    { id: 1, attributes: variants.atlasUpgrade, unavailable: { color: 'red' } },
    { id: 2, attributes: variants.horizonUpgrade, unavailable: { color: 'black' } },
    { id: 3, attributes: variants.pulseWired, unavailable: { color: 'purple' } },
  ]) {
    await test.step(`product ${configuration.id}: required options receive focus and unavailable combinations stay disabled`, async () => {
      await shop.product(configuration.id);
      await expect(product.addButton).toBeDisabled();
      await expect(product.chooseButton).toBeEnabled();
      for (const [attribute, value] of Object.entries(configuration.attributes)) {
        await product.chooseMissingOption();
        if (attribute === 'color') await expect(product.swatch('red')).toBeFocused();
        else await expect(product.option(attribute)).toBeFocused();
        await product.select({ [attribute]: value });
      }
      await expect(product.addButton).toBeEnabled();
      await expect(product.chooseButton).not.toBeVisible();
      await product.select(configuration.unavailable);
      await expect(product.addButton).toBeDisabled();
      await expect(product.stock).toContainText('Variantă indisponibilă');
      await shop.language('en');
      await expect(product.addButton).toBeDisabled();
      await expect(product.stock).toContainText('Variant unavailable');
      await shop.language('ro');
      await product.select({ color: configuration.attributes.color });
      await expect(product.addButton).toBeEnabled();
      await product.close();
      await expectSeedCart();
    });
  }

  await test.step('the unavailable simple product cannot be added', async () => {
    await shop.product(5);
    await expect(product.addButton).toBeDisabled();
    await expect(product.stock).toContainText('Variantă indisponibilă');
    await product.close();
    await expectSeedCart();
  });

  await test.step('quantity 0 and 11 are rejected and the positive value is restored', async () => {
    for (const quantity of [0, 11]) {
      await shop.product(6);
      await expect(product.quantity).toHaveValue('1');
      await product.add(quantity);
      await expect(product.dialog).toBeVisible();
      expect(await product.quantityValid(), `Product quantity ${quantity} must be invalid`).toBe(false);
      await product.setQuantity(1);
      await expect(product.quantity).toHaveValue('1');
      expect(await product.quantityValid()).toBe(true);
      await product.close();
      await expectSeedCart();
    }
  });

  await test.step('ten units are accepted but a cumulative eleventh unit is rejected', async () => {
    await shop.reset();
    await shop.product(6);
    await product.add(10);
    await expect(product.dialog).not.toBeVisible();
    await shop.cart.open();
    await expect(shop.cart.quantity('6')).toHaveValue('10');
    expect(euroCents(await shop.cart.total.innerText())).toBe(pricesCents.mouse * 10);
    await shop.cart.close();
    await shop.product(6);
    await product.add(1);
    await expect(product.dialog).toBeVisible();
    expect(await product.quantityValid()).toBe(true);
    await expect(product.error).toContainText('Maximum 10');
    await product.close();
    await shop.cart.open();
    await expect(shop.cart.rows).toHaveCount(1);
    await expect(shop.cart.quantity('6')).toHaveValue('10');
    expect(euroCents(await shop.cart.unitPrice('6').innerText())).toBe(pricesCents.mouse);
    expect(euroCents(await shop.cart.total.innerText())).toBe(pricesCents.mouse * 10);
  });
});
