import { loadAccountClient } from './account-runtime.mjs';
import { normalizePhone, validateProfile, serializeAddress, parseAddress } from './account-client.mjs';

const emptyAddress = () => ({ street: '', houseNumber: '', city: '', postalCode: '', country: '' });
const addressKeys = Object.freeze({ street: 'street', houseNumber: 'house-number', city: 'city', postalCode: 'postal-code', country: 'country' });
const addressLimits = Object.freeze({ street: [2, 120], houseNumber: [1, 20], city: [2, 80], postalCode: [2, 20], country: [2, 2] });

export function addressInputs({ prefix, address = emptyAddress(), t, esc }) {
  const labels = { street: t('Stradă', 'Street'), houseNumber: t('Număr', 'House number'), city: t('Oraș', 'City'), postalCode: t('Cod poștal', 'Postal code'), country: t('Țară (cod de două litere)', 'Country (two-letter code)') };
  return `<div class="address-fields">${Object.entries(addressKeys).map(([key, suffix]) => `<label>${labels[key]}<input data-testid="${prefix}-${suffix}" name="${prefix}-${key}" value="${esc(address[key] || '')}" minlength="${addressLimits[key][0]}" maxlength="${addressLimits[key][1]}" ${key === 'country' ? 'pattern="[A-Za-z]{2}" autocapitalize="characters"' : ''} required></label>`).join('')}</div>`;
}

export function readAddress(root, prefix) {
  return Object.fromEntries(Object.entries(addressKeys).map(([key, suffix]) => [key, root.querySelector(`[data-testid="${prefix}-${suffix}"]`)?.value || '']));
}

export function validateContact(contact) {
  const profile = validateProfile({ name: contact.name, phone: contact.phone });
  return { ...profile, shippingAddress: serializeAddress(contact.shippingAddress), billingAddress: serializeAddress(contact.sameBilling ? contact.shippingAddress : contact.billingAddress) };
}

export function createAccountUI({ t, esc, closeButton, money, onStateChange }) {
  const state = { ready: false, client: null, session: null, mode: 'guest', profile: null, orders: [], draft: null, busy: false, authAction: 'login', authEmail: '', authPassword: '', authMessage: '', authError: '', profileMessage: '', profileError: '', analytics: null, analyticsSource: 'observed', analyticsError: '', loadError: '' };
  let generation = 0;
  let analyticsRequest = 0;
  let unsubscribe;
  let activeDialog;
  let renderMock;
  const userId = () => state.session?.user?.id || null;
  const signedIn = () => Boolean(userId());
  const contextMatches = (owner, version) => owner === userId() && version === generation;
  const message = (ro, en) => ({ ro, en });
  const localized = value => value ? t(value.ro, value.en) : '';
  const refreshView = () => {
    if (activeDialog?.open && state.mode === 'real') render(activeDialog, renderMock);
    else {
      const button = activeDialog?.querySelector('[data-testid="account-mode-real"]');
      if (button) { button.disabled = !state.ready || state.busy; button.dataset.ready = String(state.ready); }
    }
    onStateChange?.();
  };
  const clearProtected = () => {
    generation++;
    analyticsRequest++;
    state.profile = null; state.orders = []; state.draft = null; state.profileMessage = ''; state.profileError = ''; state.analytics = null;
    state.authPassword = ''; state.busy = false;
  };
  async function handleAuthFailure(error, expectedOwner, expectedVersion) {
    // A delayed failure belongs to the session that sent it, never a later account.
    if (!contextMatches(expectedOwner, expectedVersion)) return false;
    const expired = error?.status === 401 || ['PGRST301', 'JWT_EXPIRED', 'refresh_token_not_found', 'refresh_token_already_used'].includes(error?.code) || /sign in required|session expired/i.test(error?.message || '');
    if (!expired || !signedIn()) return false;
    state.session = null; clearProtected(); state.busy = true;
    state.authMessage = message('Sesiunea a expirat. Autentifică-te din nou. Coșul și limba sunt păstrate.', 'Your session expired. Sign in again. Your cart and language are kept.');
    refreshView();
    try { await state.client.logout(); } catch {}
    state.busy = false; refreshView();
    return true;
  }
  const defaults = () => {
    const profile = state.profile?.profile;
    const address = state.profile?.address;
    let shippingAddress = emptyAddress(), billingAddress = emptyAddress();
    try { if (address?.shipping_address) shippingAddress = parseAddress(address.shipping_address); } catch {}
    try { if (address?.billing_address) billingAddress = parseAddress(address.billing_address); } catch {}
    return { name: profile?.full_name || '', email: state.session?.user?.email || '', phone: profile?.phone || '', shippingAddress, billingAddress, sameBilling: !address?.billing_address || address.billing_address === address.shipping_address };
  };
  async function loadProtected() {
    if (!state.client || !signedIn()) return false;
    const owner = userId(), version = generation;
    try {
      const [profile, orders] = await Promise.all([state.client.profile(), state.client.orders()]);
      if (!contextMatches(owner, version)) return false;
      state.profile = profile;
      state.orders = Array.isArray(orders) ? orders : [];
      if (!state.draft) state.draft = defaults();
      state.loadError = '';
      return true;
    } catch (error) {
      if (!contextMatches(owner, version)) return false;
      if (await handleAuthFailure(error, owner, version)) return false;
      if (!contextMatches(owner, version)) return false;
      state.loadError = message('Datele contului nu au putut fi încărcate. Încearcă din nou.', 'Account data could not be loaded. Try again.');
      return true;
    }
  }
  async function refreshAnalytics() {
    if (!state.client) return;
    const source = state.analyticsSource, owner = userId(), version = generation, request = ++analyticsRequest;
    const isCurrent = () => contextMatches(owner, version) && request === analyticsRequest && source === state.analyticsSource;
    try {
      const result = await state.client.analytics({ days: 30, source });
      if (!isCurrent()) return;
      const summary = result?.summary;
      if (!Number.isSafeInteger(summary?.orders) || summary.orders < 0 || !Number.isSafeInteger(summary?.total_cents) || summary.total_cents < 0) throw new Error('Invalid aggregate response.');
      // Only aggregate counters are rendered. Contact records never reach this view.
      state.analytics = { orders: summary.orders, totalCents: summary.total_cents };
      state.analyticsError = '';
    } catch (error) {
      if (!isCurrent()) return;
      if (await handleAuthFailure(error, owner, version)) return;
      if (!isCurrent()) return;
      state.analyticsError = message('Statisticile nu au putut fi actualizate.', 'Analytics could not be refreshed.');
    }
    refreshView();
  }
  async function init() {
    try {
      state.client = await loadAccountClient();
      if (state.client) {
        state.session = await state.client.currentSession();
        if (state.session?.expires_at && state.session.expires_at * 1000 <= Date.now()) state.session = null;
        unsubscribe = state.client.onAuthStateChange((event, session) => {
          const oldOwner = userId();
          const nextSession = session?.expires_at && session.expires_at * 1000 <= Date.now() ? null : session;
          if (oldOwner && oldOwner === nextSession?.user?.id) collect();
          state.session = nextSession;
          if (oldOwner !== userId() || !signedIn()) clearProtected();
          const owner = userId(), version = generation;
          queueMicrotask(async () => {
            if (!contextMatches(owner, version)) return;
            if (signedIn() && !(await loadProtected())) return;
            if (contextMatches(owner, version)) refreshView();
          });
        });
        await loadProtected();
      }
    } catch { state.client = null; state.session = null; clearProtected(); }
    state.ready = true;
    refreshView();
  }
  function collect() {
    if (!activeDialog || state.mode !== 'real') return;
    const root = activeDialog;
    const email = root.querySelector('[data-testid="real-login-email"]');
    if (email) { state.authEmail = email.value; state.authPassword = root.querySelector('[data-testid="real-login-password"]').value; }
    if (root.querySelector('[data-testid="profile-name"]')) {
      state.draft = { name: root.querySelector('[data-testid="profile-name"]').value, email: state.session?.user?.email || '', phone: root.querySelector('[data-testid="profile-phone"]').value, shippingAddress: readAddress(root, 'profile-shipping'), billingAddress: readAddress(root, 'profile-billing'), sameBilling: root.querySelector('[data-testid="profile-same-billing"]').checked };
    }
  }
  function analyticsMarkup() {
    return `<section class="account-analytics" aria-label="${t('Statistici agregate', 'Aggregate analytics')}"><h3>${t('Statistici agregate', 'Aggregate analytics')}</h3><p>${t('Doar numărul și totalul comenzilor din ultimele 30 de zile. Fără date personale.', 'Order count and totals for the last 30 days only. No personal data.')}</p><label>${t('Sursă', 'Source')}<select data-testid="analytics-source">${[['observed', t('Comenzi observate', 'Observed orders')], ['seed', t('Date inițiale', 'Seed data')], ['all', t('Toate', 'All')]].map(([value, label]) => `<option value="${value}" ${value === state.analyticsSource ? 'selected' : ''}>${label}</option>`).join('')}</select></label><button type="button" data-testid="analytics-refresh" ${state.client ? '' : 'disabled'}>${t('Actualizează statisticile', 'Refresh analytics')}</button><div data-testid="analytics-output" role="status">${state.analytics ? `${t('Comenzi', 'Orders')}: <span data-testid="analytics-order-count">${state.analytics.orders}</span> · ${t('Total', 'Total')}: <span data-testid="analytics-total">${money(state.analytics.totalCents)}</span>` : t('Apasă Actualizează pentru datele serverului.', 'Select Refresh to fetch server data.')}</div><p class="error" data-testid="analytics-error" role="alert">${localized(state.analyticsError)}</p></section>`;
  }
  function authMarkup() {
    const registering = state.authAction === 'register';
    return `<h2>${registering ? t('Înregistrare cont', 'Create account') : t('Autentificare cont', 'Account sign in')}</h2><p>${t('Supabase Auth · cont separat de autentificarea demo. Comenzile rămân simulate, fără plată sau livrare reală.', 'Supabase Auth · a separate account from demo sign in. Orders remain simulated, with no real payment or delivery.')}</p>${!state.client ? `<p class="account-notice" data-testid="account-config-message">${state.ready ? t('Conturile Supabase nu sunt configurate. Modul demo rămâne disponibil. Configurația necesită revizuire înainte de activare.', 'Supabase accounts are not configured. Demo mode remains available. Configuration requires review before activation.') : t('Se verifică configurația conturilor…', 'Checking account configuration…')}</p>` : ''}<form data-testid="real-login-form" id="real-login-form" novalidate><label>Email<input data-testid="real-login-email" type="email" value="${esc(state.authEmail)}" autocomplete="username" maxlength="254" required></label><label>${t('Parolă', 'Password')}<input data-testid="real-login-password" type="password" value="${esc(state.authPassword)}" autocomplete="${registering ? 'new-password' : 'current-password'}" ${registering ? 'minlength="8"' : ''} required></label><div class="error" data-testid="auth-error" role="alert">${localized(state.authError)}</div><div class="account-notice" data-testid="auth-message" role="status">${localized(state.authMessage)}</div><button class="primary wide" data-testid="real-login-submit" ${!state.client || state.busy ? 'disabled' : ''}>${state.busy ? t('Se procesează…', 'Working…') : registering ? t('Creează cont', 'Create account') : t('Autentificare cont', 'Account sign in')}</button></form><button type="button" data-testid="account-register" ${state.busy ? 'disabled' : ''}>${registering ? t('Ai deja cont? Autentifică-te', 'Already registered? Sign in') : t('Creează un cont nou', 'Create a new account')}</button>`;
  }
  function profileMarkup() {
    const draft = state.draft || defaults();
    return `<h2>${t('Contul meu Supabase', 'My Supabase account')}</h2><p data-testid="account-owner-email">${esc(state.session.user.email || '')}</p><p>${t('Comenzi demo salvate în cont. Nu se procesează plăți și nu se livrează produse.', 'Demo orders saved to your account. No payments are processed and no products are shipped.')}</p><button type="button" data-testid="account-logout" ${state.busy ? 'disabled' : ''}>${t('Deconectare cont', 'Sign out of account')}</button><p class="error" data-testid="account-load-error" role="alert">${localized(state.loadError)}</p><button type="button" data-testid="account-reload">${t('Reîncarcă datele contului', 'Reload account data')}</button><form data-testid="profile-form" id="profile-form" novalidate><h3>${t('Contact și adrese', 'Contact and addresses')}</h3><label>${t('Nume complet', 'Full name')}<input data-testid="profile-name" value="${esc(draft.name)}" minlength="2" maxlength="120" required></label><label>${t('Email din cont', 'Account email')}<input data-testid="profile-email" type="email" value="${esc(state.session.user.email || '')}" readonly></label><label>${t('Telefon', 'Phone')}<input data-testid="profile-phone" type="tel" value="${esc(draft.phone)}" maxlength="40" required></label><fieldset><legend>${t('Adresă de livrare', 'Shipping address')}</legend>${addressInputs({ prefix: 'profile-shipping', address: draft.shippingAddress, t, esc })}</fieldset><label class="check"><input data-testid="profile-same-billing" type="checkbox" ${draft.sameBilling ? 'checked' : ''}>${t('Aceeași adresă de facturare', 'Use the same billing address')}</label><fieldset data-testid="profile-billing-fields" ${draft.sameBilling ? 'hidden' : ''}><legend>${t('Adresă de facturare', 'Billing address')}</legend>${addressInputs({ prefix: 'profile-billing', address: draft.billingAddress, t, esc })}</fieldset><div class="error" data-testid="profile-error" role="alert">${localized(state.profileError)}</div><div class="account-notice" data-testid="profile-status" role="status">${localized(state.profileMessage)}</div><button class="primary wide" data-testid="profile-save" ${state.busy ? 'disabled' : ''}>${state.busy ? t('Se salvează…', 'Saving…') : t('Salvează contactul și adresele', 'Save contact and addresses')}</button></form><section data-testid="account-orders"><h3>${t('Comenzile mele demo', 'My demo orders')}</h3>${state.orders.length ? state.orders.map(order => `<article class="account-order" data-testid="order-row-${esc(order.id)}"><b>${esc(order.id)}</b><p>${money(Number.isSafeInteger(order.total_cents) ? order.total_cents : 0)} · ${esc(order.currency || 'EUR')}</p><p>${esc(order.created_at || '')}</p></article>`).join('') : `<p>${t('Nu există comenzi salvate în acest cont.', 'No orders are saved to this account.')}</p>`}</section>`;
  }
  function render(dialog, mockRenderer) {
    activeDialog = dialog; renderMock = mockRenderer;
    const switcher = `<div class="account-modes" role="group" aria-label="${t('Mod de autentificare', 'Sign-in mode')}"><button type="button" data-testid="account-mode-guest" ${state.busy ? 'disabled' : ''} aria-pressed="${state.mode === 'guest'}">${t('Demo local (simulat)', 'Local demo (mock)')}</button><button type="button" data-testid="account-mode-real" data-ready="${state.ready}" ${state.ready && !state.busy ? '' : 'disabled'} aria-pressed="${state.mode === 'real'}">${t('Cont Supabase', 'Supabase account')}</button></div>`;
    if (state.mode === 'guest') { mockRenderer(); dialog.querySelector('.dialog-language').insertAdjacentHTML('afterend', switcher); }
    else dialog.innerHTML = `${closeButton('login-close')}${switcher}${signedIn() ? profileMarkup() : authMarkup()}${analyticsMarkup()}`;
    dialog.querySelector('[data-testid="account-mode-guest"]').onclick = () => { collect(); state.mode = 'guest'; render(dialog, mockRenderer); };
    dialog.querySelector('[data-testid="account-mode-real"]').onclick = () => { state.mode = 'real'; render(dialog, mockRenderer); };
    if (state.mode !== 'real') return;
    dialog.querySelector('[data-testid="account-register"]')?.addEventListener('click', () => { collect(); state.authAction = state.authAction === 'login' ? 'register' : 'login'; state.authError = ''; state.authMessage = ''; render(dialog, mockRenderer); });
    dialog.querySelector('#real-login-form')?.addEventListener('submit', signIn);
    dialog.querySelector('#profile-form')?.addEventListener('submit', saveProfile);
    dialog.querySelector('[data-testid="profile-same-billing"]')?.addEventListener('change', () => { collect(); dialog.querySelector('[data-testid="profile-billing-fields"]').hidden = state.draft.sameBilling; });
    dialog.querySelector('[data-testid="account-logout"]')?.addEventListener('click', signOut);
    dialog.querySelector('[data-testid="account-reload"]')?.addEventListener('click', async () => {
      const owner = userId(), version = generation;
      state.draft = null;
      if (await loadProtected() && contextMatches(owner, version)) refreshView();
    });
    dialog.querySelector('[data-testid="analytics-refresh"]').onclick = () => { collect(); refreshAnalytics(); };
    dialog.querySelector('[data-testid="analytics-source"]').onchange = event => { collect(); state.analyticsSource = event.target.value; state.analytics = null; refreshAnalytics(); };
    if (state.busy) dialog.querySelectorAll('[data-testid="profile-form"] input,[data-testid="account-reload"]').forEach(control => { control.disabled = true; });
  }
  async function signIn(event) {
    event.preventDefault();
    if (!state.client || state.busy) return;
    collect(); state.authMessage = ''; state.authError = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.authEmail.trim()) || !state.authPassword || (state.authAction === 'register' && state.authPassword.length < 8)) {
      state.authError = message('Introdu un email valid și o parolă (minimum 8 caractere la înregistrare).', 'Enter a valid email and password (at least 8 characters for registration).'); refreshView(); return;
    }
    state.busy = true; refreshView();
    try {
      if (state.authAction === 'register') {
        const result = await state.client.signup({ email: state.authEmail.trim(), password: state.authPassword });
        if (result.confirmationRequired) {
          state.session = null; clearProtected();
          state.authMessage = message('Verifică emailul pentru confirmare, apoi autentifică-te. Contul nu este încă autentificat.', 'Check your email for confirmation, then sign in. This account is not signed in yet.');
        } else { state.session = await state.client.currentSession(); await loadProtected(); }
      } else { await state.client.login({ email: state.authEmail.trim(), password: state.authPassword }); state.session = await state.client.currentSession(); await loadProtected(); }
      state.authPassword = '';
    } catch {
      state.authError = state.authAction === 'register' ? message('Înregistrarea nu a putut fi finalizată. Verifică datele sau încearcă mai târziu; existența unui cont nu este confirmată.', 'Registration could not be completed. Check the details or try later; account existence is not confirmed.') : message('Autentificarea a eșuat. Verifică datele sau conexiunea și încearcă din nou.', 'Sign in failed. Check your details or connection and try again.');
      state.authPassword = '';
    } finally { state.busy = false; refreshView(); }
  }
  async function saveProfile(event) {
    event.preventDefault(); if (!state.client || !signedIn() || state.busy) return;
    collect(); state.profileMessage = ''; state.profileError = '';
    let contact;
    try { contact = validateContact(state.draft); }
    catch { state.profileError = message('Completează numele (2–120 caractere), telefonul (7–15 cifre) și toate câmpurile adresei. Țara necesită două litere.', 'Complete the name (2–120 characters), phone (7–15 digits), and all address fields. Country requires two letters.'); refreshView(); return; }
    state.busy = true; refreshView();
    const owner = userId(), version = generation;
    let profileSaved = false;
    try {
      await state.client.saveProfile({ name: contact.name, phone: normalizePhone(contact.phone) }); profileSaved = true;
      if (owner !== userId() || version !== generation) return;
      await state.client.saveAddress({ shippingAddress: contact.shippingAddress, billingAddress: contact.billingAddress });
      if (owner !== userId() || version !== generation) return;
      state.profileMessage = message('Contactul și adresele au fost salvate.', 'Contact and addresses saved.');
      state.draft = null; await loadProtected();
    } catch (error) {
      if (!contextMatches(owner, version)) return;
      if (await handleAuthFailure(error, owner, version)) return;
      if (!contextMatches(owner, version)) return;
      state.profileError = profileSaved ? message('Contactul a fost salvat, dar adresele nu au fost salvate. Verifică și încearcă din nou.', 'Contact was saved, but addresses were not saved. Check and retry.') : message('Contactul nu a putut fi salvat. Datele introduse au fost păstrate; încearcă din nou.', 'Contact could not be saved. Your entered details were kept; retry.');
      await loadProtected();
    } finally { if (owner === userId() && version === generation) { state.busy = false; refreshView(); } }
  }
  async function signOut() {
    if (!state.client || state.busy) return false;
    collect(); state.busy = true; refreshView();
    try { await state.client.logout(); state.session = null; clearProtected(); state.authMessage = message('Te-ai deconectat. Coșul și limba au fost păstrate.', 'Signed out. Your cart and language were kept.'); state.authError = ''; return true; }
    catch {
      if (!signedIn()) {
        // The official SDK clears its local session even when remote sign-out fails.
        clearProtected();
        state.authError = message('Deconectarea locală este finalizată, dar revocarea pe server nu a putut fi confirmată. Coșul și limba sunt păstrate; resetarea nu a fost aplicată.', 'Local sign out is complete, but server revocation could not be confirmed. Your cart and language are kept; reset was not applied.');
        state.authMessage = message('Autentifică-te din nou pentru acces la cont. Poți reîncerca resetarea pentru a goli coșul.', 'Sign in again to access your account. You can retry reset to clear the cart.');
      } else state.loadError = message('Deconectarea nu a putut fi confirmată. Încearcă din nou.', 'Sign out could not be confirmed. Try again.');
      return false;
    }
    finally { state.busy = false; refreshView(); }
  }
  return { state, init, collect, render, signedIn, defaults, refreshAnalytics,
    sessionVersion() { return generation; },
    async placeOrder(payload) {
      if (!state.client || !signedIn()) throw new Error('Sign in required.');
      const owner = userId(), version = generation;
      try { return await state.client.placeOrder(payload); }
      catch (error) { if (contextMatches(owner, version)) await handleAuthFailure(error, owner, version); throw error; }
    },
    async refreshAfterOrder() {
      const owner = userId(), version = generation;
      await loadProtected();
      if (contextMatches(owner, version)) await refreshAnalytics();
    },
    async reset() {
      if (state.client && signedIn() && !(await signOut())) return false;
      state.session = null; clearProtected(); state.mode = 'guest'; state.authEmail = ''; state.authMessage = ''; state.authError = '';
      return true;
    },
    dispose() { unsubscribe?.(); }
  };
}
