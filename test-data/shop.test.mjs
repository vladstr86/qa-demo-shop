import test from 'node:test';
import assert from 'node:assert/strict';
import { account, card, customer, euroCents, money, pricesCents, shippingCents, variants } from './shop-data.js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadFixtureData } from './fixture-loader.js';

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

test('positive fixture data is immutable and negative copies do not change shared data', () => {
  for (const data of [customer, card, account, pricesCents, shippingCents, variants, ...Object.values(variants)]) {
    assert.equal(Object.isFrozen(data), true);
  }
  const originalEmail = customer.email;
  const invalid = { ...customer, email: 'invalid' };
  assert.equal(invalid.email, 'invalid');
  assert.equal(customer.email, originalEmail);
  assert.throws(() => { customer.name = 'Changed customer'; }, TypeError);
});

const fictional = JSON.parse(await readFile(new URL('./shop.example.json', import.meta.url), 'utf8'));

async function temporarySource(t, source) {
  const directory = await mkdtemp(join(tmpdir(), 'qa-fixture-unit-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const localFile = join(directory, 'private.mjs');
  if (source !== undefined) await writeFile(localFile, source);
  return localFile;
}

function localSource(groups) {
  return Object.entries(groups).map(([group, data]) => `export const ${group} = ${JSON.stringify(data)};`).join('\n');
}

test('missing private files fall back to fictional data with a blank advertised-account placeholder', async t => {
  const localFile = await temporarySource(t);
  const loaded = await loadFixtureData({ env: {}, localFile });
  assert.deepEqual(loaded, fictional);
  assert.deepEqual(loaded.account, { email: '', password: '' });
});

test('CI and explicit public mode skip a malformed private file', async t => {
  const localFile = await temporarySource(t, 'export const customer = ;');
  for (const env of [{ CI: 'true' }, { QA_USE_LOCAL_TEST_DATA: '0' }]) {
    assert.deepEqual(await loadFixtureData({ env, localFile }), fictional);
  }
});

test('local fixture groups merge with fictional defaults and explicit environment fields win', async t => {
  const localFile = await temporarySource(t, localSource({
    customer: { name: 'Private Example', email: 'private@example.test' },
    account: { email: 'account@example.test', password: 'ExamplePassword' },
  }) + '\nexport const publicPrice = 100;');
  const loaded = await loadFixtureData({ env: { QA_CUSTOMER_EMAIL: 'override@example.test' }, localFile });
  assert.deepEqual(loaded.customer, {
    ...fictional.customer, name: 'Private Example', email: 'override@example.test',
  });
  assert.deepEqual(loaded.card, fictional.card);
  assert.deepEqual(loaded.account, { email: 'account@example.test', password: 'ExamplePassword' });
  assert.equal(Object.isFrozen(loaded), true);
  for (const group of Object.values(loaded)) assert.equal(Object.isFrozen(group), true);
  assert.throws(() => { loaded.customer.email = 'changed@example.test'; }, TypeError);
  assert.deepEqual(fictional.account, { email: '', password: '' });
});

test('local JSON takes precedence over legacy ESM and missing JSON permits the legacy fallback', async t => {
  const localFile = await temporarySource(t, localSource({ customer: { name: 'Legacy Example' } }));
  const localJSONFile = join(localFile, '..', 'shop.local.json');
  assert.equal((await loadFixtureData({ env: {}, localFile })).customer.name, 'Legacy Example');
  await writeFile(localJSONFile, JSON.stringify({ customer: { name: 'JSON Example' } }));
  const loaded = await loadFixtureData({ env: {}, localFile });
  assert.equal(loaded.customer.name, 'JSON Example');
  assert.deepEqual(loaded.account, { email: '', password: '' });
  assert.equal((await loadFixtureData({ env: { QA_CUSTOMER_NAME: 'Environment Example' }, localFile })).customer.name,
    'Environment Example');
  await writeFile(localJSONFile, '{');
  await assert.rejects(loadFixtureData({ env: {}, localFile }), /local JSON test data file must contain valid JSON/);
  await writeFile(localJSONFile, 'null');
  await assert.rejects(loadFixtureData({ env: {}, localFile }), /Local test data must contain fixture groups/);
  assert.deepEqual(await loadFixtureData({ env: { CI: 'true' }, localFile }), fictional);
  assert.deepEqual(await loadFixtureData({ env: { QA_USE_LOCAL_TEST_DATA: '0' }, localFile }), fictional);
});

test('all environment fields are supported without a private file', async t => {
  const localFile = await temporarySource(t);
  const expected = {
    customer: { name: 'Override Customer', email: 'override@example.test', address: '30 Example Road', billing: '40 Sample Road' },
    account: { email: 'login@example.test', password: 'FictionalPassword' },
    card: { number: '4000 0000 0000 0002', expiry: '11/41', cvv: '456' },
  };
  const env = {
    QA_CUSTOMER_NAME: expected.customer.name, QA_CUSTOMER_EMAIL: expected.customer.email,
    QA_CUSTOMER_ADDRESS: expected.customer.address, QA_CUSTOMER_BILLING: expected.customer.billing,
    QA_LOGIN_EMAIL: expected.account.email, QA_LOGIN_PASSWORD: expected.account.password,
    QA_CARD_NUMBER: expected.card.number, QA_CARD_EXPIRY: expected.card.expiry, QA_CARD_CVV: expected.card.cvv,
  };
  assert.deepEqual(await loadFixtureData({ env, localFile }), expected);
});

test('login overrides require a complete pair and explicitly blank pairs use the advertised account', async t => {
  const localFile = await temporarySource(t);
  for (const env of [{ QA_LOGIN_EMAIL: 'login@example.test' }, { QA_LOGIN_PASSWORD: 'ExamplePassword' }]) {
    await assert.rejects(loadFixtureData({ env, localFile }), /Set both QA_LOGIN_EMAIL and QA_LOGIN_PASSWORD/);
  }
  assert.deepEqual((await loadFixtureData({ env: { QA_LOGIN_EMAIL: '', QA_LOGIN_PASSWORD: '' }, localFile })).account,
    { email: '', password: '' });
  assert.deepEqual((await loadFixtureData({ env: { QA_LOGIN_EMAIL: ' ', QA_LOGIN_PASSWORD: ' ' }, localFile })).account,
    { email: '', password: '' });
});

test('malformed existing private files and broken imports fail instead of silently falling back', async t => {
  for (const source of ['export const customer = ;', "import './missing-dependency.mjs'; export const customer = {};"]) {
    const localFile = await temporarySource(t, source);
    await assert.rejects(loadFixtureData({ env: {}, localFile }), /Unable to import the local test data file/);
  }
});

test('invalid local fixture shapes and unknown fields fail without exposing supplied values', async t => {
  const marker = 'PRIVATE_VALUE_MUST_NOT_APPEAR';
  for (const groups of [
    { customer: { email: [marker] } },
    { customer: { unexpected: marker } },
    { customer: marker },
    { customer: { name: '' } },
    { account: { email: marker, password: '' } },
  ]) {
    const localFile = await temporarySource(t, localSource(groups));
    await assert.rejects(loadFixtureData({ env: {}, localFile }), error => {
      assert.equal(error.message.includes(marker), false);
      return true;
    });
  }
  const localFile = await temporarySource(t);
  await assert.rejects(loadFixtureData({ env: { QA_CUSTOMER_NAME: [marker] }, localFile }), error => {
    assert.equal(error.message.includes(marker), false);
    return true;
  });
});

test('invalid examples reject unknown groups and malformed JSON', async t => {
  const localFile = await temporarySource(t);
  const exampleFile = join(localFile, '..', 'example.json');
  await writeFile(exampleFile, JSON.stringify({ ...fictional, unexpected: 'unused' }));
  await assert.rejects(loadFixtureData({ env: {}, localFile, exampleFile }), /unknown fixture group/);
  await writeFile(exampleFile, '{');
  await assert.rejects(loadFixtureData({ env: {}, localFile, exampleFile }), /valid JSON/);
});
