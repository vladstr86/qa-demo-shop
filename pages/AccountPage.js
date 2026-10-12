export class AccountPage {
  constructor(page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="login-dialog"]');
  }

  field(id) { return this.dialog.locator(`[data-testid="${id}"]`); }
  get error() { return this.field('login-error'); }
  get loginButton() { return this.field('login-submit'); }
  get logoutButton() { return this.field('logout'); }
  get headerButton() { return this.page.locator('[data-testid="account-open"]'); }
  get rememberInput() { return this.field('login-remember'); }
  get advertisedAccountValues() { return this.dialog.locator('p b'); }
  get realMode() { return this.field('account-mode-real'); }
  get realLoginButton() { return this.field('real-login-submit'); }
  get realLogoutButton() { return this.field('account-logout'); }
  get authMessage() { return this.field('auth-message'); }
  get authError() { return this.field('auth-error'); }
  get configMessage() { return this.field('account-config-message'); }
  get profileError() { return this.field('profile-error'); }
  get profileStatus() { return this.field('profile-status'); }
  get profileForm() { return this.field('profile-form'); }
  get orderRows() { return this.field('account-orders').locator('[data-testid^="order-row-"]'); }
  orderRow(id) { return this.field(`order-row-${id}`); }
  get analyticsOutput() { return this.field('analytics-output'); }
  get analyticsRefresh() { return this.field('analytics-refresh'); }
  get analyticsOrderCount() { return this.field('analytics-order-count'); }
  get analyticsTotal() { return this.field('analytics-total'); }

  async open() { if (!(await this.dialog.isVisible())) await this.headerButton.click(); }
  async close() { await this.field('login-close').click(); }
  async demoAccount() {
    const wasOpen = await this.dialog.isVisible();
    try {
      await this.open();
      const values = (await this.advertisedAccountValues.allTextContents()).map(value => value.trim());
      if (values.length !== 2 || values.some(value => !value)) {
        throw new Error('The demo sign-in dialog must advertise an email and password.');
      }
      return Object.freeze({ email: values[0], password: values[1] });
    } finally {
      if (!wasOpen && await this.dialog.isVisible()) await this.close();
    }
  }
  async login(email, password, remember = false) {
    await this.open();
    await this.field('login-email').fill(email);
    await this.field('login-password').fill(password);
    await this.rememberInput.setChecked(remember);
    await this.loginButton.click();
  }
  async logout() { await this.open(); await this.logoutButton.click(); }
  async chooseReal() { await this.open(); await this.realMode.click(); }
  async chooseGuest() { await this.open(); await this.field('account-mode-guest').click(); }
  async realCredentials(email, password) {
    await this.field('real-login-email').fill(email);
    await this.field('real-login-password').fill(password);
  }
  async realLogin(email, password) {
    await this.chooseReal();
    if (await this.field('real-login-password').getAttribute('autocomplete') === 'new-password') await this.field('account-register').click();
    await this.realCredentials(email, password);
    await this.realLoginButton.click();
  }
  async register(email, password) {
    await this.chooseReal();
    if (await this.field('real-login-password').getAttribute('autocomplete') !== 'new-password') await this.field('account-register').click();
    await this.realCredentials(email, password);
    await this.realLoginButton.click();
  }
  async realLogout() { await this.open(); await this.realLogoutButton.click(); }
  async profileAddress(address, type = 'shipping') {
    for (const [key, value] of Object.entries(address)) {
      const field = key.replace(/[A-Z]/gu, letter => `-${letter.toLowerCase()}`);
      await this.field(`profile-${type}-${field}`).fill(value);
    }
  }
  async profile(contact, differentBilling = true) {
    await this.field('profile-name').fill(contact.name);
    await this.field('profile-phone').fill(contact.phone);
    await this.profileAddress(contact.shipping);
    await this.field('profile-same-billing').setChecked(!differentBilling);
    if (differentBilling) await this.profileAddress(contact.billing, 'billing');
  }
  async saveProfile() { await this.field('profile-save').click(); }
  async reloadAccount() { await this.field('account-reload').click(); }
  async expiredProfileResponse() {
    return this.page.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/qa_demo_profiles' && response.status() === 401);
  }
  async refreshAnalytics(source = 'observed') {
    await this.field('analytics-source').selectOption(source);
    await this.analyticsRefresh.click();
  }
  async authStorage() {
    return this.page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  }
  async storage() {
    return this.page.evaluate(() => ({
      local: localStorage.getItem('atelier-tech-auth'),
      session: sessionStorage.getItem('atelier-tech-auth'),
    }));
  }
}
