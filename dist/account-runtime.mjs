import { createClient } from './vendor/supabase.js';
import { createAccountClient } from './account-client.mjs';

async function readConfiguration(path) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

// Empty configuration keeps real Auth and stored orders disabled; mock checkout remains local.
export async function loadAccountClient() {
  const configuration = await readConfiguration('./account-config.local.json') ||
    await readConfiguration('./account-config.example.json');
  if (!configuration?.url || !configuration?.publishableKey) return null;
  try {
    return createAccountClient({ ...configuration, configuration, createClient });
  } catch {
    console.warn('Account configuration is invalid. Real account features are disabled.');
    return null;
  }
}
