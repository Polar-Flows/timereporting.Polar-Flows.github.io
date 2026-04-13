// auth.js - MSAL.js v3 helpers
//
// Depends on the global `msal` object loaded via:
// <script src="https://cdn.jsdelivr.net/npm/@azure/msal-browser@3/dist/msal-browser.min.js"></script>

import { config } from './config.js';

const STORAGE_SCOPES = ['https://storage.azure.com/user_impersonation'];

let _client = null;

async function getClient() {
  if (_client) return _client;

  _client = new msal.PublicClientApplication({
    auth: {
      clientId: config.auth.clientId,
      authority: `https://login.microsoftonline.com/${config.auth.tenantId}`,
      redirectUri: config.auth.redirectUri,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  });

  // Required before any other MSAL API call in v3
  await _client.initialize();
  return _client;
}

// Call on every page load.
// Handles the post-login redirect if present, then returns the active account or null.
export async function handleRedirectAndGetAccount() {
  const client = await getClient();
  await client.handleRedirectPromise();
  const accounts = client.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

// Redirects the user to the Microsoft login page.
export async function login() {
  const client = await getClient();
  await client.loginRedirect({ scopes: STORAGE_SCOPES });
}

// Redirects the user to Microsoft logout.
export function logout() {
  getClient().then(client => client.logoutRedirect());
}

// Returns the current user as { name, email }, or null if not signed in.
export async function getCurrentUser() {
  const client = await getClient();
  const accounts = client.getAllAccounts();
  if (!accounts.length) return null;
  const a = accounts[0];
  return { name: a.name, email: a.username };
}

// Returns a Bearer token for Azure Storage. Throws if not authenticated.
// Falls back to an interactive redirect if the silent refresh fails.
export async function getToken() {
  const client = await getClient();
  const accounts = client.getAllAccounts();
  if (!accounts.length) throw new Error('Not authenticated');

  try {
    const result = await client.acquireTokenSilent({
      scopes: STORAGE_SCOPES,
      account: accounts[0],
    });
    return result.accessToken;
  } catch {
    // Silent acquisition failed (token expired, consent needed, etc.)
    // Trigger an interactive redirect - this navigates away and does not return.
    await client.acquireTokenRedirect({ scopes: STORAGE_SCOPES, account: accounts[0] });
    return null;
  }
}
