import { euroCents } from '../test-data/shop-data.js';

export class Cart {
  constructor(page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="cart-dialog"]');
  }

  get rows() { return this.dialog.locator('[data-testid^="cart-row-"]'); }
  row(key) { return this.dialog.locator(`[data-testid="cart-row-${key}"]`); }
  quantity(key) { return this.row(key).locator(`[data-testid="cart-quantity-${key}"]`); }
  unitPrice(key) { return this.row(key).locator(`[data-testid="cart-unit-price-${key}"]`); }
  get total() { return this.dialog.locator('[data-testid="cart-total"]'); }
  get error() { return this.dialog.locator('#cart-error'); }
  get checkoutButton() { return this.dialog.locator('[data-testid="checkout-open"]'); }
  get shippingSummary() { return this.dialog.locator('.total + p'); }

  async open() { await this.page.locator('[data-testid="cart-open"]').click(); }
  async close() { await this.dialog.locator('[data-testid="cart-close"]').click(); }
  async changeQuantity(key, quantity) {
    await this.quantity(key).fill(String(quantity));
    await this.quantity(key).blur();
  }
  async remove(key) { await this.row(key).locator(`[data-testid="cart-remove-${key}"]`).click(); }
  async checkout() { await this.checkoutButton.click(); }

  async savedLines() {
    return this.page.evaluate(() => JSON.parse(localStorage.getItem('atelier-tech-cart-v2') || '[]'));
  }

  async readLines(language = 'ro') {
    const lines = [];
    for (const row of await this.rows.all()) {
      const key = (await row.getAttribute('data-testid')).replace('cart-row-', '');
      const unitPriceText = await row.locator('[data-testid^="cart-unit-price-"]').innerText();
      const unitPriceCents = euroCents(unitPriceText, language);
      const quantityText = await row.locator('[data-testid^="cart-quantity-"]').inputValue();
      const quantity = Number(quantityText);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        throw new Error(`Invalid quantity for ${key}: ${quantityText}; unit price: ${unitPriceText}`);
      }
      lines.push({ key, unitPriceText, unitPriceCents, quantity });
    }
    return lines;
  }

  async calculateSubtotalCents(language = 'ro') {
    const lines = await this.readLines(language);
    return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  }

  async snapshot(language = 'ro') {
    const lines = await this.readLines(language);
    const totalText = await this.total.innerText();
    return {
      lines,
      subtotalCents: lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
      totalText,
      totalCents: euroCents(totalText, language),
    };
  }
}
