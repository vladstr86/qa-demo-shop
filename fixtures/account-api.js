const API_ORIGIN = 'https://account-mock.example.test';

export const realAccounts = Object.freeze({
  a: Object.freeze({ id: '11111111-1111-4111-8111-111111111111', email: 'owner-a@example.test', password: 'Fictional-Password-42!' }),
  b: Object.freeze({ id: '22222222-2222-4222-8222-222222222222', email: 'owner-b@example.test', password: 'Fictional-Password-42!' }),
});

export const accountContact = Object.freeze({
  name: 'Fictional Account Owner', phone: '+40 700 123 456',
  shipping: Object.freeze({ street: 'Example Street', houseNumber: '42', city: 'Example City', postalCode: '123456', country: 'RO' }),
  billing: Object.freeze({ street: 'Fictional Avenue', houseNumber: '7', city: 'Example City', postalCode: '654321', country: 'RO' }),
});

const unitPrices = Object.freeze({ '1-black-16-512': 79900, '3-black-wireless': 13995, '4': 4990, '6': 3999 });
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const authUser = account => ({ id: account.id, aud: 'authenticated', role: 'authenticated', email: account.email,
  email_confirmed_at: '2026-01-01T00:00:00Z', identities: [], app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });

// Every browser test intercepts configuration before navigation. No real project is contacted.
export class AccountApi {
  constructor(context) {
    this.context = context;
    this.enabled = false;
    this.calls = [];
    this.blocked = [];
    this.orderOutcomes = [];
    this.orderRecords = new Map();
    this.profiles = new Map();
    this.addresses = new Map();
    this.tokens = new Map();
    this.revoked = new Set();
    this.loginOutcome = null;
    this.logoutOutcome = null;
    this.signupOutcome = 'confirmation';
    this.releaseOrder = null;
    this.delayedProfileOwner = null;
    this.releaseProfileRead = null;
    for (const account of Object.values(realAccounts)) this.seedProfile(account);
  }

  seedProfile(account, contact = accountContact) {
    this.profiles.set(account.id, { user_id: account.id, full_name: contact.name,
      phone: contact.phone.replace(/[\s().-]/gu, ''), updated_at: '2026-01-01T00:00:00Z' });
    this.addresses.set(account.id, { user_id: account.id, shipping_address: JSON.stringify(contact.shipping),
      billing_address: JSON.stringify(contact.billing), updated_at: '2026-01-01T00:00:00Z' });
  }

  token(account) {
    const payload = Buffer.from(JSON.stringify({ sub: account.id, role: 'authenticated', aud: 'authenticated', jti: `fictional-${this.tokens.size + 1}`, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.fictional-signature`;
    this.tokens.set(token, account);
    return token;
  }

  get orderCalls() { return this.calls.filter(call => call.path === '/rest/v1/rpc/qa_demo_place_authenticated_order'); }
  get writeCalls() { return this.calls.filter(call => call.method !== 'GET' && !call.path.startsWith('/auth/') && !call.path.includes('qa_demo_my_orders') && !call.path.includes('qa_demo_analytics_account')); }
  get analyticsCalls() { return this.calls.filter(call => call.path === '/rest/v1/rpc/qa_demo_analytics_account'); }

  async install() {
    await this.context.route(url => /^\/account-config\.(?:local|example)\.json$/u.test(url.pathname), route => json(route,
      this.enabled ? { url: API_ORIGIN, publishableKey: 'sb_publishable_test_mock', confirmationPolicy: 'email-confirmation-required', emailRedirectTo: '' }
        : { url: '', publishableKey: '', confirmationPolicy: 'email-confirmation-required', emailRedirectTo: '' }));
    await this.context.route(url => url.origin === API_ORIGIN || /(?:^|\.)supabase\.(?:co|in)$/u.test(url.hostname), async route => {
      if (new URL(route.request().url()).origin !== API_ORIGIN) {
        this.blocked.push(new URL(route.request().url()).origin);
        return json(route, { message: 'Live Supabase requests are prohibited in routine tests.' }, 503);
      }
      await this.handle(route);
    });
  }

  async handle(route) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    const body = request.postDataJSON() ?? null;
    const token = (request.headers().authorization || '').replace(/^Bearer /u, '');
    const account = this.revoked.has(token) ? null : this.tokens.get(token);
    this.calls.push({ path: url.pathname, method, body: structuredClone(body), owner: account?.id ?? null });

    if (url.pathname === '/auth/v1/signup') {
      if (this.signupOutcome === 'error') return json(route, { msg: 'Registration unavailable.', error_code: 'over_email_send_rate_limit' }, 429);
      return json(route, { user: { ...authUser(realAccounts.a), email: body.email, email_confirmed_at: undefined, identities: this.signupOutcome === 'duplicate' ? [] : [{ identity_id: 'fictional-registration' }] }, session: null });
    }
    if (url.pathname === '/auth/v1/token') {
      if (this.loginOutcome === 'network') { this.loginOutcome = null; return route.abort('failed'); }
      const selected = Object.values(realAccounts).find(item => item.email === body.email && item.password === body.password);
      if (!selected || this.loginOutcome === 'invalid') return json(route, { msg: 'Invalid login credentials', error_code: 'invalid_credentials' }, 400);
      return json(route, { access_token: this.token(selected), refresh_token: `fictional-refresh-${selected.id}`, token_type: 'bearer', expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600, user: authUser(selected) });
    }
    if (url.pathname === '/auth/v1/user') return account ? json(route, authUser(account)) : json(route, { msg: 'Session expired.', error_code: 'bad_jwt' }, 401);
    if (url.pathname === '/auth/v1/logout') {
      if (this.logoutOutcome === 'network') { this.logoutOutcome = null; return route.abort('failed'); }
      this.revoked.add(token);
      return json(route, {});
    }
    if (url.pathname === '/rest/v1/rpc/qa_demo_analytics_account') {
      const source = body.p_source;
      const observed = this.orderRecords.size;
      const records = [...this.orderRecords.values()];
      return json(route, { source, days: body.p_days, summary: { orders: source === 'seed' ? 2 : source === 'all' ? observed + 2 : observed,
        total_cents: (source === 'seed' ? 0 : records.reduce((sum, item) => sum + item.result.total_cents, 0)) + (['seed', 'all'].includes(source) ? 10000 : 0) }, daily: [], products: [] });
    }
    if (!account) return json(route, { message: 'Sign in required.', code: '42501' }, 403);

    if (['/rest/v1/qa_demo_profiles', '/rest/v1/qa_demo_addresses'].includes(url.pathname)) {
      const table = url.pathname.endsWith('profiles') ? this.profiles : this.addresses;
      if (method === 'GET') {
        if (url.pathname.endsWith('profiles') && this.delayedProfileOwner === account.id) {
          this.delayedProfileOwner = null;
          await new Promise(resolve => { this.releaseProfileRead = resolve; });
          return json(route, { message: 'The previous account session expired.', code: 'PGRST301' }, 401);
        }
        if (url.searchParams.get('user_id') !== `eq.${account.id}`) return json(route, null);
        return json(route, table.get(account.id) ?? null);
      }
      if (body.user_id !== account.id) return json(route, { message: 'Row violates owner policy.', code: '42501' }, 403);
      table.set(account.id, structuredClone(body));
      return json(route, body);
    }
    if (url.pathname === '/rest/v1/rpc/qa_demo_my_orders') {
      return json(route, [...this.orderRecords.values()].filter(record => record.owner === account.id).map(record => record.history));
    }
    if (url.pathname === '/rest/v1/rpc/qa_demo_place_authenticated_order') {
      const outcome = this.orderOutcomes.shift() ?? 'success';
      if (outcome === 'hold') await new Promise(resolve => { this.releaseOrder = resolve; });
      const existing = this.orderRecords.get(body.p_request_id);
      if (existing && (existing.owner !== account.id || JSON.stringify(existing.body) !== JSON.stringify(body))) {
        return json(route, { message: 'Request ID already used with different data.', code: '22023' }, 400);
      }
      let record = existing;
      if (!record) {
        const subtotal = body.p_items.reduce((sum, line) => sum + (unitPrices[line.variant_key] ?? 0) * line.quantity, 0);
        if (!subtotal || body.p_items.some(line => !unitPrices[line.variant_key] || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10)) {
          return json(route, { message: 'Unavailable variant or invalid quantity.', code: '22023' }, 400);
        }
        const shipping = body.p_shipping === 'express' ? 650 : 300;
        const result = { order_id: body.p_request_id, currency: 'EUR', subtotal_cents: subtotal, shipping_cents: shipping, total_cents: subtotal + shipping };
        record = { owner: account.id, body: structuredClone(body), result,
          history: { id: result.order_id, created_at: '2026-10-12T12:00:00Z', ...result,
            contact_snapshot: { ...body.p_contact, email: account.email },
            items: body.p_items.map(line => ({ ...line, unit_price_cents: unitPrices[line.variant_key] })) } };
        if (outcome !== 'mismatch') this.orderRecords.set(body.p_request_id, record);
      }
      if (outcome === 'commit-then-network') return route.abort('failed');
      if (outcome === 'mismatch') return json(route, { ...record.result, subtotal_cents: record.result.subtotal_cents + 1, total_cents: record.result.total_cents + 1 });
      return json(route, record.result);
    }
    this.blocked.push(url.pathname);
    return json(route, { message: 'Unexpected account API request.' }, 501);
  }

  async requestAs(page, account, path, { method = 'GET', body } = {}) {
    const token = this.token(account);
    return page.evaluate(async ({ url, token, method, body }) => {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, data: await response.json() };
    }, { url: `${API_ORIGIN}${path}`, token, method, body });
  }
}
