import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fields = Object.freeze({
  customer: Object.freeze({
    name: 'QA_CUSTOMER_NAME',
    email: 'QA_CUSTOMER_EMAIL',
    address: 'QA_CUSTOMER_ADDRESS',
    billing: 'QA_CUSTOMER_BILLING',
  }),
  account: Object.freeze({ email: 'QA_LOGIN_EMAIL', password: 'QA_LOGIN_PASSWORD' }),
  card: Object.freeze({ number: 'QA_CARD_NUMBER', expiry: 'QA_CARD_EXPIRY', cvv: 'QA_CARD_CVV' }),
});

function validateSource(source, label, partial = false) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error(`${label} must contain fixture groups.`);
  }
  for (const group of Object.keys(source)) {
    if (!Object.hasOwn(fields, group)) throw new Error(`${label} contains an unknown fixture group.`);
  }
  for (const [group, groupFields] of Object.entries(fields)) {
    if (!Object.hasOwn(source, group)) {
      if (partial) continue;
      throw new Error(`${label} is missing the ${group} group.`);
    }
    const data = source[group];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`${label} ${group} must be an object.`);
    }
    for (const key of Object.keys(data)) {
      if (!Object.hasOwn(groupFields, key)) throw new Error(`${label} ${group} contains an unknown field.`);
    }
    for (const key of Object.keys(groupFields)) {
      if (!Object.hasOwn(data, key) && partial) continue;
      if (typeof data[key] !== 'string') throw new Error(`${label} ${group}.${key} must be a string.`);
    }
  }
}

function validateComplete(data) {
  for (const [group, groupFields] of Object.entries(fields)) {
    for (const key of Object.keys(groupFields)) {
      if (typeof data[group][key] !== 'string') throw new Error(`Fixture ${group}.${key} must be a string.`);
      if (group !== 'account' && !data[group][key].trim()) {
        throw new Error(`Fixture ${group}.${key} must not be empty.`);
      }
    }
  }
  const emailSet = Boolean(data.account.email.trim());
  const passwordSet = Boolean(data.account.password.trim());
  if (emailSet !== passwordSet) throw new Error('Set both QA_LOGIN_EMAIL and QA_LOGIN_PASSWORD, or leave both empty.');
  if (!emailSet) data.account = { email: '', password: '' };
}

async function readExample(exampleFile) {
  const source = await readFile(exampleFile, 'utf8');
  try {
    return JSON.parse(source);
  } catch {
    throw new Error('The fictional test data example must contain valid JSON.');
  }
}

async function readLocal(localFile) {
  try {
    await stat(localFile);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error('Unable to inspect the local test data file.');
  }
  const fileURL = localFile instanceof URL ? localFile : pathToFileURL(resolve(localFile));
  let source;
  try {
    source = await import(fileURL.href);
  } catch {
    throw new Error('Unable to import the local test data file. Check its JavaScript ESM syntax and imports.');
  }
  // The legacy private file also exports public price and formatting helpers.
  const groups = Object.fromEntries(Object.keys(fields)
    .filter(group => Object.hasOwn(source, group))
    .map(group => [group, source[group]]));
  if (!Object.keys(groups).length) throw new Error('The local test data file must export at least one fixture group.');
  return groups;
}

async function readLocalJSON(localJSONFile) {
  let source;
  try {
    source = await readFile(localJSONFile, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw new Error('Unable to read the local JSON test data file.');
  }
  try {
    return JSON.parse(source);
  } catch {
    throw new Error('The local JSON test data file must contain valid JSON.');
  }
}

export async function loadFixtureData({
  env = process.env,
  exampleFile = new URL('./shop.example.json', import.meta.url),
  localFile = new URL('./shop.js', import.meta.url),
  localJSONFile = localFile instanceof URL
    ? new URL('./shop.local.json', localFile) : join(dirname(localFile), 'shop.local.json'),
} = {}) {
  const example = await readExample(exampleFile);
  validateSource(example, 'Fictional test data');
  let local = {};
  if (!env.CI && env.QA_USE_LOCAL_TEST_DATA !== '0') {
    const json = await readLocalJSON(localJSONFile);
    local = json === undefined ? await readLocal(localFile) : json;
  }
  validateSource(local, 'Local test data', true);
  const merged = {};
  for (const [group, groupFields] of Object.entries(fields)) {
    merged[group] = { ...example[group], ...local[group] };
    for (const [key, variable] of Object.entries(groupFields)) {
      if (Object.hasOwn(env, variable)) merged[group][key] = env[variable];
    }
  }
  validateComplete(merged);
  return Object.freeze(Object.fromEntries(Object.entries(merged)
    .map(([group, data]) => [group, Object.freeze(data)])));
}
