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
      await expect(product.galleryImage).toHaveAttribute('src', `assets/products/${configuration.id}-1.jpg`);
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
    await test.step(`product ${id}: three distinct photos, thumbnails, zoom and gallery wrapping`, async () => {
      await shop.product(id);
      const thumbnailSources = [];
      for (let view = 1; view <= 3; view++) {
        const thumbnail = product.thumbImage(view);
        await expect(thumbnail).toBeVisible();
        await expect(thumbnail).toHaveAttribute('src', `assets/products/${id}-${view}.jpg`);
        await expect(product.thumbButton(view)).toHaveAccessibleName(`Fotografia ${view}`);
        await expect.poll(() => product.imageDecoded(thumbnail), { message: `Product ${id} thumbnail ${view} decodes` }).toBe(true);
        thumbnailSources.push(await thumbnail.getAttribute('src'));
      }
      expect(new Set(thumbnailSources).size, `Product ${id} has three distinct local photographs`).toBe(3);

      for (let view = 1; view <= 3; view++) {
        await product.thumbnail(view);
        const source = `assets/products/${id}-${view}.jpg`;
        await expect(product.thumbButton(view)).toHaveAttribute('aria-pressed', 'true');
        await expect(product.galleryImage).toBeVisible();
        await expect(product.galleryImage).toHaveAttribute('src', source);
        await expect.poll(() => product.imageDecoded(product.galleryImage), { message: `Product ${id} view ${view} decodes` }).toBe(true);
        await expect(product.galleryImage).toHaveCSS('object-fit', 'contain');
        const { image, frame } = await product.imageFrameBounds(product.galleryImage);
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
        expect(image.width).toBeLessThanOrEqual(frame.width + 1);
        expect(image.height).toBeLessThanOrEqual(frame.height + 1);
        for (const language of ['ro', 'en']) {
          await shop.language(language);
          const productName = await product.title.innerText();
          await expect(product.galleryImage).toHaveAttribute('alt', `${productName} · ${language === 'ro' ? 'fotografie ilustrativă' : 'illustrative photo'} ${view}`);
          await expect(product.zoomButton).toHaveAccessibleName(language === 'ro' ? 'Mărește imaginea' : 'Zoom image');
          await expect(product.previousButton).toHaveAccessibleName(language === 'ro' ? 'Imaginea precedentă' : 'Previous image');
          await expect(product.nextButton).toHaveAccessibleName(language === 'ro' ? 'Imaginea următoare' : 'Next image');
          await expect(product.thumbButton(view)).toHaveAccessibleName(`${language === 'ro' ? 'Fotografia' : 'Photo'} ${view}`);
        }
        await product.openZoom();
        await expect(product.zoomDialog).toBeVisible();
        await expect(product.zoomImage).toBeVisible();
        await expect(product.zoomImage).toHaveAttribute('src', source);
        await expect.poll(() => product.imageDecoded(product.zoomImage), { message: `Product ${id} zoom ${view} decodes` }).toBe(true);
        await product.closeZoom();
        await expect(product.zoomDialog).not.toBeVisible();
        await shop.language('ro');
      }

      if (id <= 3) {
        for (const color of ['red', 'purple', 'black']) {
          await product.select({ color });
          await expect(product.swatch(color)).toBeChecked();
          for (const other of ['red', 'purple', 'black'].filter(value => value !== color)) {
            await expect(product.swatch(other)).not.toBeChecked();
          }
          await expect(product.galleryImage).toHaveAttribute('src', `assets/products/${id}-3.jpg`);
          for (let view = 1; view <= 3; view++) {
            await expect(product.thumbImage(view)).toHaveAttribute('src', thumbnailSources[view - 1]);
          }
          await product.openZoom();
          await expect(product.zoomImage).toHaveAttribute('src', `assets/products/${id}-3.jpg`);
          await expect.poll(() => product.imageDecoded(product.zoomImage)).toBe(true);
          await product.closeZoom();
        }
      }
      await product.nextImage();
      await expect(product.galleryImage).toHaveAttribute('src', `assets/products/${id}-1.jpg`);
      await expect.poll(() => product.imageDecoded(product.galleryImage)).toBe(true);
      await product.previousImage();
      await expect(product.galleryImage).toHaveAttribute('src', `assets/products/${id}-3.jpg`);
      await expect.poll(() => product.imageDecoded(product.galleryImage)).toBe(true);
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
      const photoSource = await product.galleryImage.getAttribute('src');
      await product.select(configuration.unavailable);
      await expect(product.galleryImage).toHaveAttribute('src', photoSource);
      await expect(product.addButton).toBeDisabled();
      await expect(product.stock).toContainText('Variantă indisponibilă');
      await shop.language('en');
      await expect(product.addButton).toBeDisabled();
      await expect(product.stock).toContainText('Variant unavailable');
      await shop.language('ro');
      await product.select({ color: configuration.attributes.color });
      await expect(product.galleryImage).toHaveAttribute('src', photoSource);
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
