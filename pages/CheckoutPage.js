import { card as dummyCard, customer } from '../test-data/shop.js';

export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="checkout-dialog"]');
  }

  field(id) { return this.dialog.locator(`[data-testid="${id}"]`); }
  get step() { return this.field('checkout-step'); }
  get total() { return this.field('review-total'); }
  get error() { return this.field('checkout-error'); }
  get confirmation() { return this.field('order-confirmation'); }
  get orderTotal() { return this.field('order-total'); }
  get orderNumber() { return this.field('order-number'); }
  get review() { return this.dialog.locator('.review'); }
  shippingInput(type) { return this.field(`shipping-${type}`); }
  shippingLabel(type) { return this.dialog.locator(`label:has([data-testid="shipping-${type}"])`); }
  paymentInput(type) { return this.field(`payment-${type}`); }

  async address(data = customer) {
    await this.field('customer-name').fill(data.name);
    await this.field('customer-email').fill(data.email);
    await this.field('customer-address').fill(data.address);
  }
  async billing(address = customer.billing, same = false) {
    await this.sameBilling(same);
    if (!same) await this.field('billing-address').fill(address);
  }
  async sameBilling(checked) { await this.field('same-billing').setChecked(checked); }
  async newsletter(checked) { await this.field('newsletter').setChecked(checked); }
  async next() { await this.field('checkout-next').click(); }
  async back() { await this.field('checkout-back').click(); }
  async shipping(type) { await this.shippingInput(type).check(); }
  async payment(type) { await this.paymentInput(type).check(); }
  async card(data = dummyCard) {
    await this.field('card-number').fill(data.number);
    await this.field('card-expiry').fill(data.expiry);
    await this.field('card-cvv').fill(data.cvv);
  }
  async terms(checked) { await this.field('terms').setChecked(checked); }
  async place(acceptTerms = true) { await this.terms(acceptTerms); await this.field('place-order').click(); }
  async close() { await this.field('checkout-close').click(); }
}
