import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountClient, normalizePhone, validateProfile, serializeAddress, parseAddress } from '../dist/account-client.mjs';

const owner = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'owner@example.test' };
const requestId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const address = { street: 'Fictional Avenue', houseNumber: '10', city: 'Example City', postalCode: '000001', country: 'ro' };
const totals = { subtotalCents: 3999, shippingCents: 300, totalCents: 4299 };
function setup(options = {}) {
  const calls = []; let subscription; let configuration;
  const session = { user: owner, access_token: 'synthetic-owner-token', expires_at: Math.floor(Date.now() / 1000) + 3600 };
  const answer = data => Promise.resolve({ data, error: null });
  const client = createAccountClient({ url: 'https://account.example.test', publishableKey: 'sb_publishable_fictional',
    createClient: (url, key, settings) => {
      configuration = { url, key, settings };
      return {
        auth: {
          getSession: () => answer({ session: options.noSession ? null : session }),
          getUser: token => {
            calls.push({ type: 'verify-user', token });
            if (options.switchAfterVerify) {
              session.access_token = 'synthetic-other-owner-token';
              session.user = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', email: 'other@example.test' };
            }
            return answer({ user: options.noUser ? null : owner });
          },
          signUp: values => { calls.push({ type: 'signup', values }); return answer({ user: owner, session: options.confirmed ? session : null }); },
          signInWithPassword: values => { calls.push({ type: 'login', values }); return answer({ user: owner, session: options.noSession ? null : session }); },
          signOut: values => { calls.push({ type: 'logout', values }); return answer(null); },
          onAuthStateChange: callback => { subscription = callback; return { data: { subscription: { unsubscribe: () => calls.push({ type: 'unsubscribe' }) } } }; },
        },
        from: table => {
          const builder = {
            select: () => builder,
            setHeader: (name, value) => { calls.push({ type: 'protected-header', name, value }); return builder; },
            eq: (key, value) => { calls.push({ type: 'select', table, key, value }); return builder; },
            maybeSingle: () => answer(options.foreignProfile ? { user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } : null),
            upsert: values => { calls.push({ type: 'upsert', table, values }); return builder; },
            single: () => answer(calls.findLast(call => call.type === 'upsert').values),
          }; return builder;
        },
        rpc: (name, values) => {
          calls.push({ type: 'rpc', name, values });
          const response = options.rpcError ? Promise.resolve({ data: null, error: { message: 'Synthetic network failure', code: 'NETWORK' } }) :
            answer(options.result || { order_id: requestId, currency: 'EUR', subtotal_cents: 3999, shipping_cents: 300, total_cents: 4299 });
          response.setHeader = (name, value) => { calls.push({ type: 'protected-header', name, value }); return response; };
          return response;
        },
      };
    },
  });
  return { client, calls, configuration, emit: (event, value) => subscription(event, value) };
}
const order = overrides => ({ requestId, contact: { name: 'Synthetic Owner', phone: '+40 (123) 456-789', shippingAddress: address },
  items: [{ key: '6', qty: 1 }], expectedTotals: totals, ...overrides });

test('Phone/name validation normalizes valid values and rejects invalid shapes', () => {
  assert.equal(normalizePhone('+40 (123) 456-789'), '+40123456789');
  assert.deepEqual(validateProfile({ name: '  Synthetic Owner  ', phone: '1234567' }), { name: 'Synthetic Owner', phone: '1234567' });
  for (const value of ['', '123456', '1234567890123456', 'abc1234567', 1234567]) assert.throws(() => normalizePhone(value));
  for (const name of ['', 'A', ' '.repeat(10), 'A'.repeat(121), 12]) assert.throws(() => validateProfile({ name, phone: '1234567' }));
});
test('Structured addresses round-trip canonically and reject malformed/missing/type-invalid fields', () => {
  const canonical = serializeAddress({ ...address, street: ' Fictional Avenue ', ignored: 'discarded' });
  assert.deepEqual(parseAddress(canonical), { ...address, country: 'RO' });
  for (const value of [{}, { ...address, city: '' }, { ...address, houseNumber: 12 }, { ...address, country: 'Romania' }]) assert.throws(() => serializeAddress(value));
  for (const value of ['not-json', '{}', '[]']) assert.throws(() => parseAddress(value));
});
test('Only public keys and secure URLs are accepted by the browser client', () => {
  const createClient = () => ({});
  assert.throws(() => createAccountClient({ url: 'http://production.example.test', publishableKey: 'public', createClient }));
  assert.throws(() => createAccountClient({ url: 'https://account.example.test', publishableKey: 'sb_secret_example', createClient }));
  assert.throws(() => createAccountClient({ url: 'https://account.example.test', publishableKey: '  sb_secret_example  ', createClient }));
  assert.throws(() => createAccountClient({ url: 'https://account.example.test', publishableKey: '   ', createClient }));
  assert.throws(() => createAccountClient({ url: 'https://example:example@account.example.test', publishableKey: 'sb_publishable_fictional', createClient }));
  const service = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() => createAccountClient({ url: 'https://account.example.test', publishableKey: service, createClient }));
  const { configuration } = setup();
  assert.deepEqual(configuration.settings.auth, { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false });
});
test('Unconfirmed signup does not claim an authenticated session', async () => {
  const { client, calls } = setup();
  assert.deepEqual(await client.signup({ email: 'registration@example.test', password: 'SyntheticPassword123!', redirectTo: 'http://127.0.0.1:4173/' }), { user: owner, confirmationRequired: true });
  assert.equal(calls[0].values.options.emailRedirectTo, 'http://127.0.0.1:4173/');
  assert.equal((await setup({ confirmed: true }).client.signup({ email: 'a@example.test', password: 'SyntheticPassword123!' })).confirmationRequired, false);
});
test('Login requires a real returned session; logout remains local-scope', async () => {
  await assert.rejects(setup({ noSession: true }).client.login({ email: owner.email, password: 'SyntheticPassword123!' }), /No authenticated session/);
  const { client, calls } = setup();
  assert.deepEqual(await client.login({ email: owner.email, password: 'SyntheticPassword123!' }), { user: owner });
  await client.logout(); assert.deepEqual(calls.at(-1), { type: 'logout', values: { scope: 'local' } });
});
test('Auth events expose summarized sessions and subscriptions can be removed', () => {
  const { client, calls, emit } = setup(); const events = [];
  const unsubscribe = client.onAuthStateChange((event, session) => events.push([event, session]));
  emit('SIGNED_OUT', null); emit('TOKEN_REFRESHED', { user: owner, expires_at: 123, access_token: 'secret-not-returned' });
  assert.deepEqual(events, [['SIGNED_OUT', null], ['TOKEN_REFRESHED', { user: owner, expires_at: 123 }]]);
  unsubscribe(); assert.equal(calls.at(-1).type, 'unsubscribe');
});
test('Profile reads require verified Auth identity and reject a foreign owner', async () => {
  await assert.rejects(setup({ noUser: true }).client.profile(), /Sign in required/);
  await assert.rejects(setup({ foreignProfile: true }).client.profile(), /ownership/);
  const { client, calls } = setup(); assert.deepEqual(await client.profile(), { profile: null, address: null });
  assert.equal(calls.filter(call => call.type === 'select').every(call => call.value === owner.id), true);
  assert.equal(calls.filter(call => call.type === 'verify-user').every(call => call.token === 'synthetic-owner-token'), true);
  assert.equal(calls.filter(call => call.type === 'protected-header').every(call => call.value === 'Bearer synthetic-owner-token'), true);
});
test('Profile/address writes derive owner and validate canonical fields', async () => {
  const { client, calls } = setup();
  await client.saveProfile({ name: ' Synthetic Owner ', phone: '+40 (123) 456-789', user_id: 'spoof' });
  await client.saveAddress({ shippingAddress: address });
  const writes = calls.filter(call => call.type === 'upsert');
  assert.equal(writes[0].values.user_id, owner.id); assert.equal(writes[0].values.full_name, 'Synthetic Owner');
  assert.equal(writes[0].values.phone, '+40123456789'); assert.equal(writes[1].values.shipping_address, serializeAddress(address));
});
test('Order RPC strips client identity/prices/card data and reconciles integer cents', async () => {
  const { client, calls } = setup();
  await client.placeOrder(order({ contact: { ...order().contact, email: 'spoof@example.test', cardNumber: 'never-sent', expiry: 'never-sent', cvv: 'never-sent' }, items: [{ key: '6', qty: 1, price: 1 }] }));
  const payload = calls.find(call => call.type === 'rpc').values;
  assert.deepEqual(Object.keys(payload.p_contact), ['name', 'phone', 'shipping_address', 'billing_address']);
  assert.deepEqual(payload.p_items, [{ variant_key: '6', quantity: 1 }]);
  assert.equal(/never-sent|spoof|email|card|cvv|price/.test(JSON.stringify(payload)), false);
});
test('An account switch during identity verification cannot replace the order request token', async () => {
  const { client, calls } = setup({ switchAfterVerify: true });
  await client.placeOrder(order());
  assert.deepEqual(calls.filter(call => call.type === 'protected-header'), [
    { type: 'protected-header', name: 'Authorization', value: 'Bearer synthetic-owner-token' },
  ]);
});
test('Malformed or mismatched confirmations preserve explicit failure rather than success', async () => {
  for (const result of [
    { order_id: requestId, currency: 'EUR', subtotal_cents: 3999, shipping_cents: 300, total_cents: 4000 },
    { order_id: requestId, currency: 'EUR', subtotal_cents: 4000, shipping_cents: 300, total_cents: 4300 },
    { order_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', currency: 'EUR', subtotal_cents: 3999, shipping_cents: 300, total_cents: 4299 },
    { order_id: requestId, currency: 'USD', subtotal_cents: 3999, shipping_cents: 300, total_cents: 4299 },
  ]) await assert.rejects(setup({ result }).client.placeOrder(order()), /confirmation|prices changed/);
  await assert.rejects(setup({ rpcError: true }).client.placeOrder(order()), /Synthetic network failure/);
});
test('Invalid order UUID, quantity, duplicates or shipping fail before order RPC', async () => {
  for (const overrides of [{ requestId: 'bad' }, { shipping: 'free' }, { items: [{ key: '6', qty: 0 }] },
    { items: [{ key: '6', qty: 1 }, { key: '6', qty: 1 }] }, { items: [] }]) {
    const { client, calls } = setup(); await assert.rejects(client.placeOrder(order(overrides)));
    assert.equal(calls.some(call => call.type === 'rpc'), false);
  }
});
test('Analytics remains aggregate-only RPC and owner history requires authentication', async () => {
  const { client, calls } = setup(); await client.analytics({ source: 'all' }); await client.orders();
  assert.deepEqual(calls.filter(call => call.type === 'rpc').map(call => call.name), ['qa_demo_analytics_account', 'qa_demo_my_orders']);
  await assert.rejects(setup({ noUser: true }).client.orders(), /Sign in required/);
  await assert.rejects(client.analytics({ source: 'private' }), /Invalid analytics/);
});
