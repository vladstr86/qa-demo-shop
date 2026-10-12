// Adapted from the supplied account/orders reference using the official Supabase SDK.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADDRESS_LIMITS = { street: [2, 120], houseNumber: [1, 20], city: [2, 80], postalCode: [2, 20] };
const characterCount = value => [...value].length;

function invalid(message, code = 'VALIDATION_ERROR') {
  return Object.assign(new Error(message), { code });
}

export function normalizePhone(value) {
  if (typeof value !== 'string') throw invalid('A phone number is required.');
  const phone = value.replace(/[\s().-]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(phone)) throw invalid('Use 7–15 phone digits with an optional leading +.');
  return phone;
}

export function validateProfile({ name, phone } = {}) {
  if (typeof name !== 'string' || characterCount(name.trim()) < 2 || characterCount(name.trim()) > 120) {
    throw invalid('Use a full name between 2 and 120 characters.');
  }
  return { name: name.trim(), phone: normalizePhone(phone) };
}

export function serializeAddress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('An address object is required.');
  const address = {};
  for (const [field, [minimum, maximum]] of Object.entries(ADDRESS_LIMITS)) {
    if (typeof value[field] !== 'string') throw invalid(`The ${field} field is required.`);
    address[field] = value[field].trim();
    if (characterCount(address[field]) < minimum || characterCount(address[field]) > maximum) throw invalid(`Invalid ${field} length.`);
  }
  if (typeof value.country !== 'string' || !/^[a-z]{2}$/i.test(value.country.trim())) {
    throw invalid('Use a two-letter country code.');
  }
  address.country = value.country.trim().toUpperCase();
  const serialized = JSON.stringify(address);
  if (characterCount(serialized) > 500) throw invalid('The complete address must be at most 500 characters.');
  return serialized;
}

export function parseAddress(value) {
  if (typeof value !== 'string') throw invalid('A serialized address is required.');
  let parsed;
  try { parsed = JSON.parse(value); } catch { throw invalid('Invalid serialized address.'); }
  return JSON.parse(serializeAddress(parsed));
}

const canonicalAddress = value => serializeAddress(typeof value === 'string' ? parseAddress(value) : value);

export function createAccountClient({ url, publishableKey, createClient, configuration = {} }) {
  let target;
  try { target = new URL(url); } catch { throw invalid('A Supabase URL is required.', 'CONFIGURATION_ERROR'); }
  const local = ['localhost', '127.0.0.1'].includes(target.hostname);
  if (target.username || target.password ||
      (target.protocol !== 'https:' && !(target.protocol === 'http:' && local)) ||
      !publishableKey || typeof publishableKey !== 'string' || typeof createClient !== 'function') {
    throw invalid('A secure Supabase URL, publishable key and SDK are required.', 'CONFIGURATION_ERROR');
  }
  publishableKey = publishableKey.trim();
  if (!publishableKey || publishableKey.startsWith('sb_secret_')) throw invalid('Only public keys can be used in the browser.', 'CONFIGURATION_ERROR');
  if (publishableKey.split('.').length === 3) {
    let payload;
    try { payload = JSON.parse(atob(publishableKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch {}
    if (payload?.role !== 'anon') throw invalid('Only public anonymous JWT keys are supported.', 'CONFIGURATION_ERROR');
  }
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const checked = async promise => {
    const { data, error, status } = await promise;
    if (error) throw Object.assign(new Error(error.message || 'The account request failed.'), {
      code: error.code || 'ACCOUNT_REQUEST_FAILED', status: error.status || status,
    });
    return data;
  };
  const sessionSummary = session => session?.user ? { user: session.user, expires_at: session.expires_at } : null;
  async function currentSession() { return sessionSummary((await checked(client.auth.getSession())).session); }
  async function currentActor() {
    const { session } = await checked(client.auth.getSession());
    if (!session?.access_token || !session.user?.id) throw invalid('Sign in required.', 'AUTH_REQUIRED');
    const token = session.access_token, expectedOwner = session.user.id;
    const data = await checked(client.auth.getUser(token));
    if (!data?.user?.id || data.user.id !== expectedOwner) throw invalid('Sign in required.', 'AUTH_REQUIRED');
    return { user: data.user, token };
  }
  // Pin every protected query to its verified session, even if another account signs in
  // while SDK fetch awaits a refreshed token. Tokens stay in memory and out of UI data.
  const protectedQuery = (query, token) => query.setHeader('Authorization', `Bearer ${token}`);
  async function signup({ email, password, redirectTo = configuration.emailRedirectTo }) {
    const data = await checked(client.auth.signUp({ email, password,
      ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}) }));
    return { user: data.user || null, confirmationRequired: !data.session };
  }
  async function login({ email, password }) {
    const data = await checked(client.auth.signInWithPassword({ email, password }));
    if (!data?.session || !data?.user?.id) throw invalid('No authenticated session was returned.', 'AUTH_REQUIRED');
    return { user: data.user };
  }
  async function logout() { await checked(client.auth.signOut({ scope: 'local' })); }
  function onAuthStateChange(callback) {
    const { data } = client.auth.onAuthStateChange((event, session) => callback(event, sessionSummary(session)));
    return () => data.subscription.unsubscribe();
  }
  async function profile() {
    const { user, token } = await currentActor();
    const [profile, address] = await Promise.all([
      checked(protectedQuery(client.from('qa_demo_profiles').select('user_id,full_name,phone,updated_at').eq('user_id', user.id), token).maybeSingle()),
      checked(protectedQuery(client.from('qa_demo_addresses').select('user_id,shipping_address,billing_address,updated_at').eq('user_id', user.id), token).maybeSingle()),
    ]);
    if ((profile && profile.user_id !== user.id) || (address && address.user_id !== user.id)) {
      throw invalid('Profile ownership does not match the session.', 'OWNERSHIP_MISMATCH');
    }
    return { profile, address };
  }
  async function saveProfile(value) {
    const { user, token } = await currentActor();
    const { name, phone } = validateProfile(value);
    return checked(protectedQuery(client.from('qa_demo_profiles').upsert({
      user_id: user.id, full_name: name, phone, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select(), token).single());
  }
  async function saveAddress({ shippingAddress, billingAddress = shippingAddress }) {
    const { user, token } = await currentActor();
    return checked(protectedQuery(client.from('qa_demo_addresses').upsert({
      user_id: user.id, shipping_address: canonicalAddress(shippingAddress),
      billing_address: canonicalAddress(billingAddress), updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select(), token).single());
  }
  async function placeOrder({ requestId, contact, items, shipping = 'standard', expectedTotals }) {
    const { token } = await currentActor();
    if (!UUID.test(requestId || '')) throw invalid('A request UUID is required.');
    const { name, phone } = validateProfile(contact);
    if (!Array.isArray(items) || !items.length || items.length > 50) throw invalid('Use 1–50 order lines.');
    const keys = new Set();
    const lines = items.map(item => {
      if (typeof item.key !== 'string' || !/^[1-6](?:-[a-z0-9]+)*$/.test(item.key) ||
          !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10 || keys.has(item.key)) throw invalid('Invalid order lines.');
      keys.add(item.key);
      return { variant_key: item.key, quantity: item.qty };
    });
    if (!['standard', 'express'].includes(shipping)) throw invalid('Invalid shipping method.');
    const result = await checked(protectedQuery(client.rpc('qa_demo_place_authenticated_order', {
      p_request_id: requestId,
      p_contact: { name, phone, shipping_address: canonicalAddress(contact.shippingAddress),
        billing_address: canonicalAddress(contact.billingAddress || contact.shippingAddress) },
      p_items: lines, p_shipping: shipping,
    }), token));
    if (!result?.order_id || String(result.order_id).toLowerCase() !== requestId.toLowerCase() || result.currency !== 'EUR' ||
        ![result.subtotal_cents, result.shipping_cents, result.total_cents].every(Number.isSafeInteger) ||
        result.subtotal_cents <= 0 || result.shipping_cents !== (shipping === 'express' ? 650 : 300) ||
        result.total_cents !== result.subtotal_cents + result.shipping_cents) {
      throw invalid('Invalid order confirmation. Retry using the same request ID.', 'INVALID_CONFIRMATION');
    }
    if (expectedTotals && (result.subtotal_cents !== expectedTotals.subtotalCents ||
        result.shipping_cents !== expectedTotals.shippingCents || result.total_cents !== expectedTotals.totalCents)) {
      throw invalid('Catalog prices changed. Keep the cart and reconcile this request before retrying.', 'PRICE_MISMATCH');
    }
    return result;
  }
  async function orders(limit = 25) {
    const { token } = await currentActor();
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw invalid('Invalid order history limit.');
    return checked(protectedQuery(client.rpc('qa_demo_my_orders', { p_limit: limit }), token));
  }
  async function analytics({ days = 30, source = 'observed' } = {}) {
    if (!Number.isInteger(days) || days < 1 || days > 365 || !['seed', 'live', 'observed', 'all'].includes(source)) {
      throw invalid('Invalid analytics filter.');
    }
    return checked(client.rpc('qa_demo_analytics_account', { p_days: days, p_source: source }));
  }
  return { signup, login, logout, currentSession, onAuthStateChange, profile,
    saveProfile, saveAddress, placeOrder, orders, analytics, configuration: Object.freeze({ ...configuration }) };
}
