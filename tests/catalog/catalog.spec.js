import { test, expect } from '../../fixtures/shop.js';
import { imageDecoded } from '../../pages/image.js';
import { euroCents, pricesCents } from '../../test-data/shop.js';

test('catalog combines filters, shows bilingual EUR prices and loads every product asset', async ({ shop, product }) => {
  const catalogPrices = [pricesCents.atlas, pricesCents.horizon, pricesCents.pulseWired, pricesCents.wave, pricesCents.keyboard, pricesCents.mouse];

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

  await test.step('all 45 local product files have successful PNG responses and signatures', async () => {
    let checkedFiles = 0;
    for (let id = 1; id <= 6; id++) {
      for (let view = 1; view <= 3; view++) {
        for (const suffix of ['', ...(id <= 3 ? ['-red', '-purple', '-black'] : [])]) {
          const filename = `${id}-${view}${suffix}.png`;
          const response = await shop.asset(id, view, suffix);
          expect(response.ok(), filename).toBe(true);
          expect(response.headers()['content-type'], filename).toContain('image/png');
          expect((await response.body()).subarray(0, 8).toString('hex'), filename).toBe('89504e470d0a1a0a');
          checkedFiles++;
        }
      }
    }
    expect(checkedFiles).toBe(45);
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
