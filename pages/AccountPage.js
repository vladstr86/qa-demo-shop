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
  async storage() {
    return this.page.evaluate(() => ({
      local: localStorage.getItem('atelier-tech-auth'),
      session: sessionStorage.getItem('atelier-tech-auth'),
    }));
  }
}
