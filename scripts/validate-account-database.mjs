import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { serializeAddress } from '../dist/account-client.mjs';

// No connection URL exists in this harness: all statements run in disposable memory.
const database = new PGlite();
let passed = 0;
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const address = serializeAddress({ street: 'Fictional Avenue', houseNumber: '10', city: 'Example City', postalCode: '000001', country: 'RO' });
const contact = { name: 'Synthetic Owner A', phone: '+40123456789', email: 'spoof@example.test',
  user_id: b, shipping_address: address, billing_address: address };
const items = [{ variant_key: '1-black-32-1024', quantity: 2, price: 1 }, { variant_key: '3-black-wired', quantity: 1 }];
const query = (text, values = []) => database.query(text, values);
const role = async (name, owner = '') => {
  await database.exec(`reset role; set role ${name}`);
  await query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
};
async function order(requestId = id, details = contact, lines = items, shipping = 'express') {
  return (await query('select public.qa_demo_place_authenticated_order($1,$2::jsonb,$3::jsonb,$4) as data',
    [requestId, JSON.stringify(details), JSON.stringify(lines), shipping])).rows[0].data;
}
const count = async table => (await query(`select count(*)::integer as n from qa_demo.${table}`)).rows[0].n;

try {
  await database.exec(await readFile(new URL('../database/test-baseline.sql', import.meta.url), 'utf8'));
  await query('insert into auth.users values($1,$2),($3,$4)', [a, 'owner-a@example.test', b, 'owner-b@example.test']);
  const historical = (await query('select * from qa_demo.orders order by id')).rows;
  const migration = await readFile(new URL('../database/migrations/001-account-orders.sql', import.meta.url), 'utf8');
  await check('Migration applies twice and preserves existing seed/observed records', async () => {
    await database.exec(migration); await database.exec(migration);
    const rows = (await query('select * from qa_demo.orders order by id')).rows;
    for (let index = 0; index < rows.length; index++) {
      for (const [key, value] of Object.entries(historical[index])) assert.deepEqual(rows[index][key], value);
      assert.equal(rows[index].auth_user_id, null);
    }
    assert.equal(rows.length, historical.length);
  });
  await check('All 27 current browser variant keys/prices/availability match the isolated catalog', async () => {
    const application = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
    const products = application.match(/const products=(\[.*?\]);/s)?.[1];
    const variant = application.match(/function variant\(p,v=\{\}\)\{.*?return \{complete,priceCents,stock,key:.*?\};\}/s)?.[0];
    assert.ok(products && variant, 'Current catalog parser requires review after catalog structure changes.');
    const browser = vm.runInNewContext(`const products=${products};${variant};({products,variant})`);
    const expected = [];
    function permutations(options, selected = {}) {
      const key = Object.keys(options).find(field => !(field in selected));
      if (!key) return [selected];
      return options[key].flatMap(value => permutations(options, { ...selected, [key]: value }));
    }
    for (const product of browser.products) for (const selected of permutations(product.options || {})) {
      const data = browser.variant(product, selected);
      expected.push({ variant_key: data.key, unit_price_cents: data.priceCents, available: data.stock });
    }
    const actual = (await query('select * from qa_demo.catalog order by variant_key')).rows;
    expected.sort((left, right) => left.variant_key.localeCompare(right.variant_key));
    assert.deepEqual(actual, expected); assert.equal(actual.length, 27);
  });
  await check('Anonymous clients cannot use profiles, history, authenticated/legacy order RPCs or raw orders', async () => {
    await role('anon');
    await assert.rejects(query('select public.qa_demo_my_orders()'), /permission denied/);
    await assert.rejects(order(), /permission denied/);
    await assert.rejects(query('select public.qa_demo_place_order(null,null,null)'), /permission denied/);
    await assert.rejects(query('select * from public.qa_demo_profiles'), /permission denied/);
    await assert.rejects(query('select * from qa_demo.orders'), /permission denied/);
  });
  await check('Authenticated role without an Auth identity cannot place or list orders', async () => {
    await role('authenticated');
    await assert.rejects(order(), /Sign in/);
    await assert.rejects(query('select public.qa_demo_my_orders()'), /Sign in/);
  });
  await check('Profile/address RLS allows own values and rejects cross-owner inserts', async () => {
    await role('authenticated', a);
    await query('insert into public.qa_demo_profiles(user_id,full_name,phone) values($1,$2,$3)', [a, 'Synthetic Owner A', '+40123456789']);
    await query('insert into public.qa_demo_addresses(user_id,shipping_address,billing_address) values($1,$2,$2)', [a, address]);
    await assert.rejects(query('insert into public.qa_demo_profiles(user_id,full_name,phone) values($1,$2,$3)', [b, 'Synthetic Owner B', '+40123456789']), /row-level security/);
    await assert.rejects(query('insert into public.qa_demo_addresses(user_id,shipping_address,billing_address) values($1,$2,$2)', [b, address]), /row-level security/);
  });
  await check('Server rejects missing, mistyped, invalid phone and structured address fields', async () => {
    for (const phone of ['', '123456', '1234567890123456', 'bad+401234567']) {
      await assert.rejects(query('update public.qa_demo_profiles set phone=$1 where user_id=$2', [phone, a]), /check constraint/);
      await assert.rejects(order(id, { ...contact, phone }), /Invalid contact/);
    }
    for (const value of ['not JSON', '{}', '[]', JSON.stringify({ street: 12 }), JSON.stringify({ ...JSON.parse(address), country: 'Romania' }), JSON.stringify({ ...JSON.parse(address), city: '' })]) {
      await assert.rejects(query('update public.qa_demo_addresses set shipping_address=$1 where user_id=$2', [value, a]), /check constraint/);
      await assert.rejects(order(id, { ...contact, shipping_address: value }), /Invalid contact/);
    }
    await assert.rejects(order(id, { ...contact, shipping_address: JSON.stringify({ ...JSON.parse(address), card_number: 'explicit-payment-data-must-not-be-stored' }) }), /Invalid contact/);
    await assert.rejects(query('update public.qa_demo_addresses set shipping_address=$1 where user_id=$2', [JSON.stringify({ ...JSON.parse(address), cvv: 'explicit-payment-data-must-not-be-stored' }), a]), /check constraint/);
    for (const value of [{ ...contact, name: 12 }, { ...contact, phone: 12345678 }, { ...contact, shipping_address: {} }]) {
      await assert.rejects(order(id, value), /contact object/);
    }
  });
  let saved;
  await check('Server owns identity/email/prices and derives EUR totals with transactional item writes', async () => {
    saved = await order();
    assert.deepEqual(saved, { order_id: id, currency: 'EUR', subtotal_cents: 203895, shipping_cents: 650, total_cents: 204545 });
    const own = (await query('select public.qa_demo_my_orders() as data')).rows[0].data;
    assert.equal(own.length, 1); assert.equal(own[0].contact_snapshot.email, 'owner-a@example.test');
    assert.equal(own[0].items.length, 2); assert.equal(own[0].items[0].unit_price_cents, 95950);
    assert.equal(own[0].items[1].unit_price_cents, 11995);
  });
  await check('Identical retries return one order and changed data is rejected', async () => {
    assert.deepEqual(await order(), saved);
    const queued = await Promise.all([order(), order()]);
    assert.deepEqual(queued, [saved, saved]);
    await assert.rejects(order(id, contact, items, 'standard'), /already used/);
    await assert.rejects(order(id, { ...contact, name: 'Changed Owner' }), /already used/);
    await assert.rejects(order(id, contact, [...items].reverse()), /already used/);
  });
  await check('Owner B cannot read/update A profile/address or receive A order by guessed UUID', async () => {
    await role('authenticated', b);
    assert.equal((await query('select * from public.qa_demo_profiles')).rows.length, 0);
    assert.equal((await query('select * from public.qa_demo_addresses')).rows.length, 0);
    assert.equal((await query('update public.qa_demo_profiles set full_name=$1 where user_id=$2 returning *', ['Changed Owner', a])).rows.length, 0);
    assert.equal((await query('update public.qa_demo_addresses set shipping_address=$1 where user_id=$2 returning *', [address, a])).rows.length, 0);
    assert.deepEqual((await query('select public.qa_demo_my_orders() as data')).rows[0].data, []);
    await assert.rejects(order(), /already used/);
    await assert.rejects(query('select * from qa_demo.orders where id=$1', [id]), /permission denied/);
    await assert.rejects(query('select public.qa_demo_place_order(null,null,null)'), /permission denied/);
    await role('authenticated', a);
  });
  await check('Unavailable/unknown/duplicate variants, quantity bounds and oversized arrays cannot write', async () => {
    const request = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    for (const lines of [
      [{ variant_key: '5', quantity: 1 }], [{ variant_key: 'unknown', quantity: 1 }],
      [{ variant_key: '1-red-32-1024', quantity: 1 }], [{ variant_key: '2-black-32', quantity: 1 }],
      [{ variant_key: '3-purple-wired', quantity: 1 }], [{ variant_key: '6', quantity: 0 }],
      [{ variant_key: '6', quantity: 11 }], [{ variant_key: '6', quantity: 1.5 }],
      [{ variant_key: '6', quantity: 1 }, { variant_key: '6', quantity: 2 }],
      Array.from({ length: 51 }, () => ({ variant_key: '6', quantity: 1 })), [],
    ]) await assert.rejects(order(request, contact, lines), /unavailable|quantity|Duplicate|Invalid items/);
    await assert.rejects(order(request, contact, items, 'free'), /Invalid shipping/);
    await assert.rejects(query('select public.qa_demo_my_orders(0)'), /Invalid limit/);
  });
  await check('Failed item insertion rolls back customer/header/lines atomically', async () => {
    await database.exec('reset role');
    const before = { customers: await count('customers'), orders: await count('orders'), items: await count('order_items') };
    await database.exec(`create function qa_demo.reject_test_item() returns trigger language plpgsql as $$begin raise exception 'Synthetic item failure'; end;$$;
      create trigger reject_test_item before insert on qa_demo.order_items for each row execute function qa_demo.reject_test_item();`);
    await role('authenticated', b);
    await assert.rejects(order('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', contact, [{ variant_key: '6', quantity: 1 }]), /Synthetic item failure/);
    await database.exec('reset role; drop trigger reject_test_item on qa_demo.order_items; drop function qa_demo.reject_test_item();');
    assert.deepEqual({ customers: await count('customers'), orders: await count('orders'), items: await count('order_items') }, before);
  });
  await check('New orders join observed/all analytics while seed filters and privacy remain intact', async () => {
    const raw = (await query('select * from qa_demo.orders where id=$1', [id])).rows[0];
    assert.equal(raw.auth_user_id, a); assert.equal(raw.source, 'observed');
    assert.equal(await count('orders'), 3);
    await role('anon');
    for (const [source, orders, total] of [['seed', 1, 4299], ['observed', 2, 209835], ['live', 2, 209835], ['all', 3, 214134]]) {
      const data = (await query('select public.qa_demo_analytics_account(30,$1) as data', [source])).rows[0].data;
      assert.deepEqual(data, { source, summary: { orders, total_cents: total } });
      assert.equal(/owner|@|phone|Fictional Avenue|shipping_address|contact_snapshot/.test(JSON.stringify(data)), false);
    }
    await assert.rejects(query("select public.qa_demo_analytics_account(30,'private')"), /Invalid analytics/);
  });
  console.log(`Local database checks: ${passed} passed; 0 failed. Disposable compatibility harness, not live Supabase validation.`);
  console.log('Limitation: PGlite queues requests in one connection; multi-connection PostgreSQL concurrency and production baseline remain unverified.');
} finally { await database.close(); }
