import { imageDecoded, imageFrameBounds } from './image.js';

export class ProductPage {
  constructor(page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="product-dialog"]');
    this.zoomDialog = page.locator('[data-testid="zoom-dialog"]');
  }

  get price() { return this.dialog.locator('[data-testid="product-price"]'); }
  get stock() { return this.dialog.locator('[data-testid="product-stock"]'); }
  get addButton() { return this.dialog.locator('[data-testid="add-to-cart"]'); }
  get quantity() { return this.dialog.locator('[data-testid="product-quantity"]'); }
  get error() { return this.dialog.locator('[data-testid="product-error"]'); }
  get selectOptionsButton() { return this.dialog.locator('[data-testid="select-options"]'); }
  get chooseButton() { return this.selectOptionsButton; }
  option(attribute) { return this.dialog.locator(`[data-testid="variant-${attribute}"]`); }
  variant(attribute) { return this.option(attribute); }
  swatch(color) { return this.dialog.locator(`[data-testid="swatch-${color}"]`); }
  get galleryImage() { return this.dialog.locator('[data-testid="gallery-image"]'); }
  get galleryMain() { return this.galleryImage; }
  thumbImage(view) { return this.dialog.locator(`[data-testid="gallery-thumb-${view}"] img`); }
  get zoomImage() { return this.zoomDialog.locator('img.zoom-image'); }

  async select(attributes) {
    for (const [attribute, value] of Object.entries(attributes)) {
      if (attribute === 'color') await this.swatch(value).check();
      else await this.option(attribute).selectOption(String(value));
    }
  }
  async setQuantity(quantity) { await this.quantity.fill(String(quantity)); }
  async add(quantity = 1) { await this.setQuantity(quantity); await this.addButton.click(); }
  async close() { await this.dialog.locator('[data-testid="product-close"]').click(); }
  async thumbnail(view) { await this.dialog.locator(`[data-testid="gallery-thumb-${view}"]`).click(); }
  async nextImage() { await this.dialog.locator('[data-testid="gallery-next"]').click(); }
  async previousImage() { await this.dialog.locator('[data-testid="gallery-prev"]').click(); }
  async openZoom() { await this.dialog.locator('[data-testid="gallery-zoom"]').click(); }
  async closeZoom() { await this.zoomDialog.locator('[data-testid="zoom-close"]').click(); }
  async chooseMissingOption() { await this.selectOptionsButton.click(); }
  async quantityValid() { return this.quantity.evaluate(input => input.validity.valid); }
  async quantityValidity() { return this.quantityValid(); }
  async imageDecoded(locator) { return imageDecoded(locator); }
  async imageReady(locator) { return this.imageDecoded(locator); }
  async imageFrameBounds(locator) { return imageFrameBounds(locator); }
  async imageBounds(locator) { return this.imageFrameBounds(locator); }
}
