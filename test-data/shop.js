export const customer = Object.freeze({
  name: 'Vlad Strut',
  email: 'strutv@gmail.com',
  address: 'Damrak, 70, Amsterdam, NL',
  billing: '221B Baker St, London, UK',
});

export const account = Object.freeze({ email: 'demo@atelier.test', password: 'Demo123!' });
export const card = Object.freeze({ number: '4111 1111 1111 1111', expiry: '12/39', cvv: '369' });

export const variants = Object.freeze({
  atlas: Object.freeze({ color: 'black', ram: '16', ssd: '512' }),
  atlasUpgrade: Object.freeze({ color: 'black', ram: '32', ssd: '1024' }),
  horizon: Object.freeze({ color: 'red', ram: '16' }),
  horizonUpgrade: Object.freeze({ color: 'red', ram: '32' }),
  pulseWireless: Object.freeze({ color: 'black', connection: 'wireless' }),
  pulseWired: Object.freeze({ color: 'black', connection: 'wired' }),
});

export const pricesCents = Object.freeze({
  atlas: 79900,
  atlasUpgrade: 95950,
  horizon: 109950,
  horizonUpgrade: 121975,
  pulseWireless: 13995,
  pulseWired: 11995,
  wave: 4990,
  keyboard: 6900,
  mouse: 3999,
});
export const shippingCents = Object.freeze({ standard: 300, express: 650 });

function checkLanguage(language) {
  if (!['ro', 'en'].includes(language)) throw new Error(`Unsupported language: ${language}`);
}

// Format fixture cents independently of the application's Intl formatter.
export function money(cents, language = 'ro') {
  checkLanguage(language);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error(`Invalid EUR cents: ${cents}`);
  const grouping = language === 'ro' ? '.' : ',';
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, grouping);
  const fraction = String(cents % 100).padStart(2, '0');
  return language === 'ro' ? `${whole},${fraction} €` : `€${whole}.${fraction}`;
}

// Validate symbol placement, grouping and precision before reading whole/fraction cents.
export function euroCents(text, language = 'ro') {
  checkLanguage(language);
  const normalized = String(text).replace(/[\s\u00a0\u202f]/g, '');
  const pattern = language === 'ro'
    ? /^(\d{1,3}(?:\.\d{3})*),(\d{2})€$/
    : /^€(\d{1,3}(?:,\d{3})*)\.(\d{2})$/;
  const match = normalized.match(pattern);
  if (!match) throw new Error(`Invalid ${language.toUpperCase()} EUR amount: ${text}`);
  const whole = match[1].replace(/[.,]/g, '');
  const cents = Number(whole) * 100 + Number(match[2]);
  if (!Number.isSafeInteger(cents)) throw new Error(`EUR amount exceeds safe integer cents: ${text}`);
  return cents;
}
