import { Cart } from '../components/Cart.js';
import { imageDecoded, imageFrameBounds } from './image.js';

export class ShopPage {
  constructor(page) {
    this.page = page;
    this.catalog = page.locator('#catalog');
    this.cart = new Cart(page);
  }

  get html() { return this.page.locator('html'); }
  get cards() { return this.catalog.locator('[data-testid^="product-card-"]'); }
  card(id) { return this.catalog.locator(`[data-testid="product-card-${id}"]`); }
  cardPrice(id) { return this.card(id).locator('.price-row b'); }
  cardImage(id) { return this.card(id).locator('[data-product-image]'); }
  brandInput(brand) { return this.catalog.locator(`[data-testid="brand-${brand.toLowerCase()}"]`); }
  get stockOnly() { return this.catalog.locator('[data-testid="stock-only"]'); }
  get emptyState() { return this.catalog.locator('#products .empty'); }
  get cartButton() { return this.page.locator('[data-testid="cart-open"]'); }
  get searchInput() { return this.catalog.locator('[data-testid="search-input"]'); }
  get categoryInput() { return this.catalog.locator('[data-testid="category-filter"]'); }

  async goto(url = '/') { await this.page.goto(url); }
  async reload() { await this.page.reload(); }
  async clearStorage() { await this.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); }
  async ensureVisible(locator) { await locator.scrollIntoViewIfNeeded(); }
  async search(query) { await this.searchInput.fill(query); }
  async category(value) { await this.categoryInput.selectOption(value); }
  async brand(name, checked = true) { await this.brandInput(name).setChecked(checked); }
  async inStock(checked = true) { await this.stockOnly.setChecked(checked); }
  async product(id) { await this.card(id).locator(`[data-testid="product-open-${id}"]`).click(); }

  async openProductAtIndex(targetIndex, verifyProduct) {
    if (!Number.isInteger(targetIndex) || targetIndex < 0) throw new Error(`Invalid catalog index: ${targetIndex}`);
    const count = await this.cards.count();
    let product;
    for (let index = 0; index < count; index++) {
      if (index !== targetIndex) continue;
      const card = this.cards.nth(index);
      const id = Number((await card.getAttribute('data-testid')).replace('product-card-', ''));
      const name = await card.locator('h3').innerText();
      product = { index, name, id };
      if (verifyProduct) await verifyProduct(product);
      await card.locator(`[data-testid="product-open-${id}"]`).click();
      break;
    }
    if (!product) throw new Error(`Catalog index ${targetIndex} is outside ${count} visible cards`);
    return product;
  }

  async language(language) {
    const activeDialog = this.page.locator('dialog[open]').last();
    if (await activeDialog.count()) {
      await activeDialog.locator(`[data-testid="dialog-language-${language}"]`).click();
    } else {
      await this.page.locator(`[data-testid="language-${language}"]`).click();
    }
  }
  async reset() { await this.page.locator('[data-testid="reset-demo"]').click(); }
  async fitsViewport() {
    return this.page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth);
  }
  async asset(id, view, suffix = '') { return this.page.request.get(`/assets/products/${id}-${view}${suffix}.png`); }
  async imageDecoded(locator) { return imageDecoded(locator); }
  async imageReady(locator) { return this.imageDecoded(locator); }
  async imageFrameBounds(locator) { return imageFrameBounds(locator); }
  async imageBounds(locator) { return this.imageFrameBounds(locator); }
}
