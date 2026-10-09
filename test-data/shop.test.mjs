import test from 'node:test';
import assert from 'node:assert/strict';
import { account, card, customer, euroCents, money, pricesCents, shippingCents, variants } from './shop.js';

test('EUR parsing handles cents, grouping, localized symbol placement and Unicode whitespace', () => {
  for (const [text, language, cents] of [
    ['0,00 €', 'ro', 0], ['€0.00', 'en', 0],
    ['799,00\u00a0€', 'ro', 79900], ['€799.00', 'en', 79900],
    ['139,95\u202f€', 'ro', 13995], ['€139.95', 'en', 13995],
    ['2.017,85 €', 'ro', 201785], ['€2,017.85', 'en', 201785],
    ['1.234.567,89 €', 'ro', 123456789], ['€1,234,567.89', 'en', 123456789],
    ['3,00 €', 'ro', 300], ['€6.50', 'en', 650],
  ]) {
    assert.equal(euroCents(text, language), cents, `${language}: ${text}`);
  }
});

test('EUR parsing rejects wrong currency, locale, precision, grouping and unsafe amounts', () => {
  for (const [text, language] of [
    ['799,00 lei', 'ro'], ['$799.00', 'en'], ['€799,00', 'ro'], ['799.00 €', 'en'],
    ['799.00 €', 'ro'], ['€799,00', 'en'], ['799,0 €', 'ro'], ['€799.000', 'en'],
    ['2.01,85 €', 'ro'], ['€20,17.85', 'en'], ['2017,85 €', 'ro'], ['€2017.85', 'en'],
    ['-1,00 €', 'ro'], ['€1.00 extra', 'en'], ['€90,071,992,547,409.92', 'en'],
  ]) assert.throws(() => euroCents(text, language), Error, `${language}: ${text}`);
  assert.throws(() => euroCents('€1.00', 'fr'), /Unsupported language/);
});

test('fixture formatting uses integer cents and exact independent RO/EN examples', () => {
  assert.equal(money(79900, 'ro'), '799,00 €');
  assert.equal(money(13995, 'en'), '€139.95');
  assert.equal(money(201785, 'ro'), '2.017,85 €');
  assert.equal(money(201785, 'en'), '€2,017.85');
  assert.throws(() => money(799.5), /Invalid EUR cents/);
  assert.throws(() => money(-1), /Invalid EUR cents/);
});

test('positive fixture data is immutable and separate from mock login', () => {
  assert.deepEqual(customer, {
    name: 'Vlad Strut', email: 'strutv@gmail.com',
    address: 'Damrak, 70, Amsterdam, NL', billing: '221B Baker St, London, UK',
  });
  assert.deepEqual(card, { number: '4111 1111 1111 1111', expiry: '12/39', cvv: '369' });
  assert.equal(account.email, 'demo@atelier.test');
  for (const data of [customer, card, account, pricesCents, shippingCents, variants, ...Object.values(variants)]) {
    assert.equal(Object.isFrozen(data), true);
  }
  const invalid = { ...customer, email: 'invalid' };
  assert.equal(invalid.email, 'invalid');
  assert.equal(customer.email, 'strutv@gmail.com');
});
