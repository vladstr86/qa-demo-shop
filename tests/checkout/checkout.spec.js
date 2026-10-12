import { test, expect } from '../../fixtures/shop.js';
import { card, customer, variants, pricesCents, shippingCents, money, euroCents } from '../../test-data/shop-data.js';
import { accountContact, realAccounts } from '../../fixtures/account-api.js';

async function expectSubtotal(cart, language, expectedLines, expectedSubtotal) {
  const lines = await cart.readLines(language);
  const subtotal = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const displayed = euroCents(await cart.total.innerText(), language);
  const diagnostic = `${language} cart: ${lines.map(line => `${line.key}: ${line.unitPriceText} (${line.unitPriceCents} cents) × ${line.quantity}`).join('; ')}; expected ${expectedSubtotal}, calculated ${subtotal}, displayed ${displayed} cents`;
  expect(lines.map(line => ({ key: line.key, price: line.unitPriceCents, quantity: line.quantity })), diagnostic).toEqual(expectedLines);
  expect(subtotal, diagnostic).toBe(expectedSubtotal);
  expect(displayed, diagnostic).toBe(subtotal);
  await expect(cart.total).toHaveText(money(subtotal, language));
  return subtotal;
}

async function expectTotal(checkout, language, subtotal, shipping) {
  const expected = subtotal + shippingCents[shipping];
  const actual = euroCents(await checkout.total.innerText(), language);
  expect(actual, `Checkout ${language}: displayed unit prices × quantities = ${subtotal}; ${shipping} shipping = ${shippingCents[shipping]}; expected ${expected}, displayed ${actual} cents`).toBe(expected);
  await expect(checkout.total).toHaveText(money(expected, language));
  return expected;
}

async function expectAddress(checkout) {
  await expect(checkout.field('customer-name')).toHaveValue(customer.name);
  await expect(checkout.field('customer-email')).toHaveValue(customer.email);
  await expect(checkout.field('customer-address')).toHaveValue(customer.address);
  await expect(checkout.field('same-billing')).not.toBeChecked();
  await expect(checkout.field('billing-address')).toHaveValue(customer.billing);
}

async function expectCard(checkout) {
  await expect(checkout.field('card-number')).toHaveValue(card.number);
  await expect(checkout.field('card-expiry')).toHaveValue(card.expiry);
  await expect(checkout.field('card-cvv')).toHaveValue(card.cvv);
}

test('guest checkout preserves fixed data and calculates shipping without accumulation in RO and EN', async ({ shop, product, checkout, accountApi }) => {
  let subtotal;
  const lines = [
    { key: '1-black-16-512', price: pricesCents.atlas, quantity: 2 },
    { key: '3-black-wireless', price: pricesCents.pulseWireless, quantity: 3 },
  ];
  await test.step('Read the two-product subtotal from displayed unit prices and quantities', async () => {
    await shop.language('ro');
    await shop.product(1);
    await product.select(variants.atlas);
    await product.add(2);
    await shop.product(3);
    await product.select(variants.pulseWireless);
    await product.add(3);
    await shop.cart.open();
    subtotal = await expectSubtotal(shop.cart, 'ro', lines, 201785);
    await shop.language('en');
    await expectSubtotal(shop.cart, 'en', lines, subtotal);
    await shop.language('ro');
    await shop.cart.checkout();
    await expect(checkout.step).toHaveText('1 / 3');
    await expect(checkout.field('same-billing')).toBeChecked();
    await expect(checkout.field('billing-address')).not.toBeVisible();
    await expectTotal(checkout, 'ro', subtotal, 'standard');
  });

  await test.step('Keep shipping, separate billing and newsletter data across language changes and Back', async () => {
    await checkout.address(customer);
    await checkout.billing(customer.billing);
    await expect(checkout.field('billing-address')).toBeVisible();
    await checkout.sameBilling(true);
    await expect(checkout.field('billing-address')).not.toBeVisible();
    await expect(checkout.field('billing-address')).toHaveValue(customer.billing);
    await checkout.sameBilling(false);
    await expect(checkout.field('billing-address')).toBeVisible();
    await expect(checkout.field('billing-address')).toHaveValue(customer.billing);
    await checkout.newsletter(true);
    for (const language of ['en', 'ro']) {
      await shop.language(language);
      await expectAddress(checkout);
      await expect(checkout.field('newsletter')).toBeChecked();
      await expectTotal(checkout, language, subtotal, 'standard');
    }
    await checkout.next();
    await expect(checkout.step).toHaveText('2 / 3');
    await checkout.back();
    await expect(checkout.step).toHaveText('1 / 3');
    await expectAddress(checkout);
    await expect(checkout.field('newsletter')).toBeChecked();
    await checkout.next();
  });

  for (const language of ['ro', 'en']) {
    await test.step(`Replace Standard with Express and restore Standard in ${language}`, async () => {
      await shop.language(language);
      await expect(checkout.shippingLabel('standard')).toContainText(money(shippingCents.standard, language));
      await expect(checkout.shippingLabel('express')).toContainText(money(shippingCents.express, language));
      for (const shipping of ['standard', 'express', 'standard']) {
        await checkout.shipping(shipping);
        await expect(checkout.shippingInput(shipping)).toBeChecked();
        const total = await expectTotal(checkout, language, subtotal, shipping);
        expect(total).toBe(shipping === 'express' ? 202435 : 202085);
      }
    });
  }

  await test.step('Preserve the fixed dummy card across languages and review', async () => {
    await checkout.payment('card');
    await checkout.card();
    await shop.language('ro');
    await expectCard(checkout);
    await expect(checkout.paymentInput('card')).toBeChecked();
    await expect(checkout.shippingInput('standard')).toBeChecked();
    await checkout.next();
    await expect(checkout.step).toHaveText('3 / 3');
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      for (const value of [customer.name, customer.email, customer.address, customer.billing]) {
        await expect(checkout.review).toContainText(value);
      }
      await expect(checkout.review).toContainText('Atlas 14 × 2');
      await expect(checkout.review).toContainText(/Pulse Pro(?: Headphones)? × 3/);
      await expect(checkout.review).toContainText(language === 'ro' ? 'Newsletter: Da' : 'Newsletter: Yes');
      await expectTotal(checkout, language, subtotal, 'standard');
    }
    await checkout.back();
    await expectCard(checkout);
    await expect(checkout.paymentInput('card')).toBeChecked();
    await expect(checkout.shippingInput('standard')).toBeChecked();
    await checkout.next();
    await checkout.terms(true);
    await shop.language('ro');
    await expect(checkout.field('terms')).toBeChecked();
    await checkout.place();
  });

  await test.step('Confirm the saved order total and independently verify the emptied cart', async () => {
    await expect(checkout.confirmation).toBeVisible();
    await expect(checkout.orderNumber).toHaveText('DEMO-0001');
    expect(await shop.cart.savedLines(), 'The completed guest order clears the persisted cart').toEqual([]);
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      const displayed = euroCents(await checkout.orderTotal.innerText(), language);
      expect(displayed, `Saved order: ${subtotal} + ${shippingCents.standard} = 202085 cents; displayed ${displayed}`).toBe(202085);
      await expect(checkout.orderTotal).toHaveText(money(subtotal + shippingCents.standard, language));
    }
    await checkout.close();
    await shop.cart.open();
    await expectSubtotal(shop.cart, 'en', [], 0);
    await expect(shop.cart.rows).toHaveCount(0);
    await expect(shop.cart.checkoutButton).toBeDisabled();
    expect(await shop.cart.calculateSubtotalCents('en')).toBe(0);
    expect(euroCents(await checkout.orderTotal.innerText(), 'en'), 'The saved confirmation total survives an empty cart').toBe(202085);
    expect(accountApi.writeCalls, 'Guest orders remain local and never call Supabase or the legacy RPC').toEqual([]);
  });
});

test('checkout validates guest fields and saves account orders only after reconciled, idempotent confirmation', async ({ shop, product, checkout, accountPage, accountApi }) => {
  test.setTimeout(60000);
  const lines = [{ key: '6', price: pricesCents.mouse, quantity: 1 }];
  await shop.language('ro');
  await shop.product(6);
  await product.add();
  await shop.cart.open();
  const subtotal = await expectSubtotal(shop.cart, 'ro', lines, 3999);
  const savedCart = await shop.cart.savedLines();
  expect(savedCart, 'The seeded persisted cart contains exactly one Mouse Precision').toEqual([
    { id: 6, key: '6', options: {}, qty: 1 },
  ]);
  await shop.cart.checkout();

  const errors = {
    required: {
      ro: 'Completează toate câmpurile obligatorii.',
      en: 'Complete all required fields.',
    },
    email: { ro: 'Introdu un email valid.', en: 'Enter a valid email.' },
    card: {
      ro: 'Completează cardul fictiv: 16 cifre, MM/YY și CVV 3 cifre.',
      en: 'Complete the dummy card: 16 digits, MM/YY and 3-digit CVV.',
    },
    terms: { ro: 'Acceptă termenii pentru a continua.', en: 'Accept the terms to continue.' },
  };

  async function expectRejected(language, step, shipping, reason) {
    await expect(checkout.error).toHaveText(errors[reason][language]);
    await expect(checkout.step).toHaveText(`${step} / 3`);
    await expect(checkout.confirmation).toHaveCount(0);
    expect(await shop.cart.savedLines(), `Rejected ${reason} in ${language} preserves the persisted Mouse × 1 cart`).toEqual(savedCart);
    // The closed cart retains its last rendered language until it is reopened.
    await expectSubtotal(shop.cart, 'ro', lines, subtotal);
    await expectTotal(checkout, language, subtotal, shipping);
  }

  for (const language of ['ro', 'en']) {
    await test.step(`Reject invalid customer and billing data in ${language}`, async () => {
      await shop.language(language);
      await checkout.address(customer);
      await checkout.billing(customer.billing);
      const invalidFields = [
        { field: 'name', value: '' },
        { field: 'email', value: 'invalid-email' },
        { field: 'address', value: '' },
        { field: 'billing', value: '' },
      ];
      for (const { field, value } of invalidFields) {
        await test.step(`Reject invalid ${field} and restore the valid customer`, async () => {
          const invalidCustomer = { ...customer, [field]: value };
          await checkout.address(invalidCustomer);
          await checkout.billing(invalidCustomer.billing);
          await checkout.next();
          await expectRejected(language, 1, 'standard', field === 'email' ? 'email' : 'required');
          await checkout.address(customer);
          await checkout.billing(customer.billing);
          await expectAddress(checkout);
        });
      }
      await checkout.next();
      await expect(checkout.step).toHaveText('2 / 3');
      expect(await expectTotal(checkout, language, subtotal, 'standard')).toBe(4299);
    });

    await test.step(`Reject invalid dummy card fields while preserving Express total in ${language}`, async () => {
      await checkout.shipping('express');
      expect(await expectTotal(checkout, language, subtotal, 'express')).toBe(4649);
      await checkout.payment('card');
      const invalidFields = [
        { field: 'number', value: '4111' },
        { field: 'expiry', value: '13/39' },
        { field: 'cvv', value: '36' },
      ];
      for (const { field, value } of invalidFields) {
        await test.step(`Reject invalid card ${field} and restore the dummy card`, async () => {
          await checkout.card({ ...card, [field]: value });
          await checkout.next();
          await expectRejected(language, 2, 'express', 'card');
          await checkout.card();
          await expectCard(checkout);
        });
      }
      await checkout.shipping('standard');
      expect(await expectTotal(checkout, language, subtotal, 'standard')).toBe(4299);
      await checkout.next();
      await expect(checkout.step).toHaveText('3 / 3');
    });

    await test.step(`Reject unchecked terms and restore acceptance in ${language}`, async () => {
      await checkout.terms(false);
      await checkout.place(false);
      await expectRejected(language, 3, 'standard', 'terms');
      await checkout.terms(true);
      await expect(checkout.field('terms')).toBeChecked();
      if (language === 'ro') {
        await checkout.back();
        await expectCard(checkout);
        await checkout.back();
        await expectAddress(checkout);
      }
    });
  }

  await test.step('Allow the valid restored checkout to complete', async () => {
    await checkout.place();
    await expect(checkout.confirmation).toBeVisible();
    expect(await shop.cart.savedLines(), 'The restored valid checkout clears the persisted cart').toEqual([]);
    await expect(checkout.orderTotal).toHaveText(money(subtotal + shippingCents.standard, 'en'));
    expect(euroCents(await checkout.orderTotal.innerText(), 'en')).toBe(4299);
    await checkout.close();
    await shop.cart.open();
    await expectSubtotal(shop.cart, 'en', [], 0);
    await expect(shop.cart.rows).toHaveCount(0);
    await expect(shop.cart.checkoutButton).toBeDisabled();
    expect(accountApi.writeCalls, 'The restored guest checkout must not create database records').toEqual([]);
  });

  await shop.cart.close();
  accountApi.enabled = true;
  await shop.reload();
  await accountPage.realLogin(realAccounts.a.email, realAccounts.a.password);
  await expect(accountPage.profileForm).toBeVisible();
  await accountPage.refreshAnalytics('observed');
  await expect(accountPage.analyticsOrderCount).toHaveText('0');
  await accountPage.close();
  await shop.product(6);
  await product.add();
  await shop.cart.open();
  const accountSubtotal = await expectSubtotal(shop.cart, 'en', lines, 3999);
  const accountCart = await shop.cart.savedLines();
  await shop.cart.checkout();
  await checkout.selectMode('account');
  const override = { ...accountContact.shipping, street: 'Checkout Override Street' };

  await test.step('Owner profile prefills structured contact fields; edits, language and terms remain usable', async () => {
    await expect(checkout.field('customer-name')).toHaveValue(accountContact.name);
    await expect(checkout.field('customer-email')).toHaveValue(realAccounts.a.email);
    await expect(checkout.field('customer-email')).toHaveAttribute('readonly', '');
    await expect(checkout.field('customer-phone')).toHaveValue('+40700123456');
    await expect(checkout.field('shipping-street')).toHaveValue(accountContact.shipping.street);
    await checkout.contactPhone('123');
    await checkout.next();
    await expect(checkout.error).not.toHaveText('');
    await expect(checkout.step).toHaveText('1 / 3');
    expect(accountApi.orderCalls).toHaveLength(0);
    await checkout.contactPhone(accountContact.phone);
    await checkout.structuredAddress(override);
    await checkout.sameBilling(false);
    await checkout.structuredAddress(accountContact.billing, 'billing');
    await checkout.newsletter(true);
    for (const language of ['ro', 'en']) {
      await shop.language(language);
      await expect(checkout.field('shipping-street')).toHaveValue(override.street);
      await expect(checkout.field('billing-street')).toHaveValue(accountContact.billing.street);
      await expect(checkout.field('customer-phone')).toHaveValue(accountContact.phone);
      await expect(checkout.field('newsletter')).toBeChecked();
      expect(await shop.fitsViewport(), `${language} account checkout fits the viewport`).toBe(true);
    }
    await checkout.next();
    await checkout.shipping('express');
    await checkout.payment('card');
    await checkout.card({ number: '4111111111111111', expiry: '12/39', cvv: '123' });
    await checkout.next();
    await expect(checkout.step).toHaveText('3 / 3');
    expect(euroCents(await checkout.total.innerText(), 'en')).toBe(accountSubtotal + shippingCents.express);
    await checkout.place(false);
    await expect(checkout.error).toHaveText(errors.terms.en);
    expect(accountApi.orderCalls).toHaveLength(0);
    expect(await shop.cart.savedLines()).toEqual(accountCart);
  });

  await test.step('Lost responses and mismatched totals preserve cart/details and reuse the exact request', async () => {
    accountApi.orderOutcomes.push('commit-then-network', 'mismatch', 'hold');
    await checkout.place();
    await expect(checkout.error).not.toHaveText('');
    expect(accountApi.orderCalls).toHaveLength(1);
    await expect(checkout.confirmation).toHaveCount(0);
    expect(await shop.cart.savedLines()).toEqual(accountCart);
    const request = accountApi.orderCalls[0].body;
    expect(request.p_request_id).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u);
    expect(request.p_items).toEqual([{ variant_key: '6', quantity: 1 }]);
    expect(request.p_contact).toEqual({ name: accountContact.name, phone: '+40700123456', shipping_address: JSON.stringify(override), billing_address: JSON.stringify(accountContact.billing) });
    expect(Object.keys(request).sort()).toEqual(['p_contact', 'p_items', 'p_request_id', 'p_shipping']);
    expect(JSON.stringify(request)).not.toMatch(/card|expiry|cvv|4111111111111111|owner_id|user_id|email/u);
    await checkout.place();
    await expect(checkout.error).not.toHaveText('');
    expect(accountApi.orderCalls).toHaveLength(2);
    expect(accountApi.orderCalls[1].body).toEqual(request);
    await expect(checkout.confirmation).toHaveCount(0);
    expect(await shop.cart.savedLines()).toEqual(accountCart);
    await expect(checkout.review).toContainText(override.street);
    await checkout.place();
    await expect.poll(() => accountApi.orderCalls.length).toBe(3);
    await expect(checkout.placeButton).toBeDisabled();
    await checkout.repeatSubmission();
    expect(accountApi.orderCalls).toHaveLength(3);
    expect(accountApi.orderCalls[2].body).toEqual(request);
    accountApi.releaseOrder();
    await expect(checkout.confirmation).toBeVisible();
    await expect(checkout.orderNumber).toHaveText(request.p_request_id);
    expect(euroCents(await checkout.orderTotal.innerText(), 'en')).toBe(4649);
    expect(await shop.cart.savedLines()).toEqual([]);
    expect(accountApi.orderRecords.size).toBe(1);
    expect(JSON.parse(accountApi.addresses.get(realAccounts.a.id).shipping_address)).toEqual(accountContact.shipping);
    await checkout.close();
  });

  await test.step('Stored orders retain immutable snapshots and refresh aggregate-only analytics with seed filters', async () => {
    await accountPage.open();
    await expect(accountPage.orderRows).toHaveCount(1);
    for (const source of ['observed', 'all', 'seed']) {
      await accountPage.refreshAnalytics(source);
      await expect(accountPage.analyticsOrderCount).toHaveText(source === 'observed' ? '1' : source === 'all' ? '3' : '2');
      expect(euroCents(await accountPage.analyticsTotal.innerText(), 'en')).toBe(source === 'observed' ? 4649 : source === 'all' ? 14649 : 10000);
      const output = await accountPage.analyticsOutput.innerText();
      for (const value of [realAccounts.a.email, accountContact.name, accountContact.phone, override.street]) expect(output).not.toContain(value);
      expect(accountApi.analyticsCalls.at(-1).body.p_source).toBe(source);
    }
    const requestId = accountApi.orderCalls[0].body.p_request_id;
    const snapshot = structuredClone(accountApi.orderRecords.get(requestId).history.contact_snapshot);
    await accountPage.profile({ ...accountContact, shipping: { ...accountContact.shipping, street: 'Later Saved Street' } });
    await accountPage.saveProfile();
    await expect(accountPage.profileStatus).not.toHaveText('');
    expect(accountApi.orderRecords.get(requestId).history.contact_snapshot).toEqual(snapshot);
    await accountPage.realLogout();
    await expect(accountPage.orderRows).toHaveCount(0);
  });
});
