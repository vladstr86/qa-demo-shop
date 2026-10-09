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

  async open() { if (!(await this.dialog.isVisible())) await this.headerButton.click(); }
  async close() { await this.field('login-close').click(); }
  async login(email, password, remember = false) {
    await this.open();
    await this.field('login-email').fill(email);
    await this.field('login-password').fill(password);
    await this.rememberInput.setChecked(remember);
    await this.loginButton.click();
  }
  async logout() { await this.open(); await this.logoutButton.click(); }
  async storage() {
    return this.page.evaluate(() => ({
      local: localStorage.getItem('atelier-tech-auth'),
      session: sessionStorage.getItem('atelier-tech-auth'),
    }));
  }
}
