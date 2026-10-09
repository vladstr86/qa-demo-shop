import { test, expect } from '../../fixtures/shop.js';
import { euroCents, pricesCents } from '../../test-data/shop-data.js';

test('catalog combines filters, shows bilingual EUR prices and loads every product asset', async ({ shop, product }) => {
  const catalogPrices = [pricesCents.atlas, pricesCents.horizon, pricesCents.pulseWired, pricesCents.wave, pricesCents.keyboard, pricesCents.mouse];

  await test.step('the bilingual Studio hero opens Atlas with keyboard input and the fixed EUR price', async () => {
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      await expect(shop.heroButton).toHaveAccessibleName('Laptop Atlas 14');
      await expect(shop.heroPhoto).toHaveAttribute('alt', language === 'ro'
        ? 'Fotografie ilustrativă de laptop' : 'Illustrative laptop photograph');
      await expect(shop.heroPhoto).toHaveAttribute('src', 'assets/products/1-1.jpg');
      await expect.poll(() => shop.imageDecoded(shop.heroPhoto)).toBe(true);
      expect(euroCents(await shop.heroPrice.innerText(), language)).toBe(pricesCents.atlas);
      await expect(shop.heroFallback).not.toBeVisible();
      await shop.focusHero();
      await expect(shop.heroButton).toBeFocused();
      await shop.openHeroWithKeyboard();
      await expect(product.dialog).toBeVisible();
      await expect(product.title).toHaveText('Laptop Atlas 14');
      expect(euroCents(await product.price.innerText(), language)).toBe(pricesCents.atlas);
      await product.close();
      expect(await shop.fitsViewport(), `${language} Studio hero fits the viewport`).toBe(true);
    }
    await shop.language('ro');
  });

  await test.step('all six cards show the fixed starting prices in Romanian and English', async () => {
    await expect(shop.cards).toHaveCount(6);
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      for (let id = 1; id <= 6; id++) {
        await expect(shop.card(id)).toBeVisible();
        const text = await shop.cardPrice(id).innerText();
        if (id <= 3) expect(text).toMatch(language === 'ro' ? /^De la\s/u : /^From\s/u);
        const amount = text.replace(/^(?:De la|From)\s+/u, '');
        expect(euroCents(amount, language), `Product ${id}, ${language}: ${text}`).toBe(catalogPrices[id - 1]);
      }
    }
    await shop.language('ro');
  });

  await test.step('catalog images decode and cover their frames without gaps', async () => {
    for (let id = 1; id <= 6; id++) {
      const image = shop.cardImage(id);
      await expect(image).toBeVisible();
      await expect.poll(() => product.imageDecoded(image), { message: `Catalog image ${id} decodes` }).toBe(true);
      await expect(image).toHaveCSS('object-fit', 'cover');
      const { image: bounds, frame } = await product.imageFrameBounds(image);
      for (const dimension of ['x', 'y', 'width', 'height']) {
        expect(Math.abs(bounds[dimension] - frame[dimension]), `Product ${id}: ${dimension} fills the frame`).toBeLessThanOrEqual(1);
      }
    }
  });

  await test.step('all 18 real photographs have successful JPEG responses and signatures', async () => {
    let checkedFiles = 0;
    for (let id = 1; id <= 6; id++) {
      for (let view = 1; view <= 3; view++) {
        const filename = `${id}-${view}.jpg`;
        const response = await shop.asset(id, view);
        expect(response.ok(), filename).toBe(true);
        expect(response.headers()['content-type'], filename).toContain('image/jpeg');
        const bytes = await response.body();
        expect(bytes.subarray(0, 2).toString('hex'), filename).toBe('ffd8');
        expect(bytes.subarray(-2).toString('hex'), filename).toBe('ffd9');
        checkedFiles++;
      }
    }
    expect(checkedFiles).toBe(18);
  });

  await test.step('a failed hero photograph has a useful bilingual fallback and retains the Atlas action', async () => {
    await shop.simulateHeroImageFailure();
    try {
      for (const language of ['ro', 'en']) {
        await shop.language(language);
        await expect(shop.heroFallback).toBeVisible();
        await expect(shop.heroFallback).toHaveText(language === 'ro'
          ? 'Fotografia nu este disponibilă. Deschide Laptop Atlas 14 pentru detalii.'
          : 'The photograph is unavailable. Open Laptop Atlas 14 for product details.');
        await expect(shop.heroButton).toHaveAccessibleName('Laptop Atlas 14');
        await shop.focusHero();
        await shop.openHeroWithKeyboard();
        await expect(product.title).toHaveText('Laptop Atlas 14');
        await product.close();
      }
    } finally {
      await shop.restoreHeroImage();
    }
    await expect.poll(() => shop.imageDecoded(shop.heroPhoto)).toBe(true);
    await expect(shop.heroFallback).not.toBeVisible();
    await shop.language('ro');
  });

  await test.step('search is case insensitive and combines with category, including empty results', async () => {
    await shop.category('audio');
    await expect(shop.cards).toHaveCount(2);
    await expect(shop.card(3)).toBeVisible();
    await expect(shop.card(4)).toBeVisible();
    await shop.search('pulse');
    await expect(shop.cards).toHaveCount(1);
    await expect(shop.card(3)).toBeVisible();
    await shop.search('ATLAS');
    await expect(shop.cards).toHaveCount(0);
    await expect(shop.emptyState).toContainText('Nu am găsit produse');
    await shop.reset();
    await shop.search('ATLAS');
    await expect(shop.cards).toHaveCount(1);
    await expect(shop.card(1)).toBeVisible();
    await shop.reset();
  });

  await test.step('brand checkboxes use OR, category uses AND, stock filtering and reset preserve the contract', async () => {
    await shop.brand('atlas');
    await shop.brand('wave');
    await expect(shop.cards).toHaveCount(2);
    await expect(shop.card(1)).toBeVisible();
    await expect(shop.card(4)).toBeVisible();
    await expect(shop.card(2)).toHaveCount(0);
    await expect(shop.card(3)).toHaveCount(0);
    await shop.category('audio');
    await expect(shop.cards).toHaveCount(1);
    await expect(shop.card(4)).toBeVisible();
    await shop.inStock();
    await expect(shop.stockOnly).toBeChecked();
    await expect(shop.card(4)).toContainText('În stoc');
    await shop.brand('wave', false);
    await expect(shop.cards).toHaveCount(0);
    await shop.reset();
    await expect(shop.brandInput('atlas')).not.toBeChecked();
    await expect(shop.brandInput('wave')).not.toBeChecked();
    await expect(shop.stockOnly).not.toBeChecked();
    await expect(shop.searchInput).toHaveValue('');
    await expect(shop.categoryInput).toHaveValue('');
    await expect(shop.cards).toHaveCount(6);
    await expect(shop.card(5)).toBeVisible();
    await shop.inStock();
    await expect(shop.cards).toHaveCount(5);
    await expect(shop.card(5)).toHaveCount(0);
    await expect(shop.card(6)).toBeVisible();
    await shop.inStock(false);
    await expect(shop.cards).toHaveCount(6);
  });
});
