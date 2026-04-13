// storage.js - Azure Blob Storage REST API helpers
//
// Uses the Azure Storage REST API directly via fetch + an AD Bearer token.
// No SDK dependency needed.

import { config } from './config.js';
import { getToken } from './auth.js';

const API_VERSION = '2023-01-03';

async function authHeaders(extra = {}) {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'x-ms-version': API_VERSION,
    ...extra,
  };
}

function adminBlobUrl(blobName) {
  const { accountName, containerName } = config.adminStorage;
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
}

function dataBlobUrl(blobPath) {
  const { accountName, containerName } = config.dataStorage;
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobPath}`;
}

// ---- Admin storage (read-only for employees, read-write for admin) ----

// Reads and parses a JSON blob from admin storage.
export async function adminRead(blobName) {
  const res = await fetch(adminBlobUrl(blobName), {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`adminRead(${blobName}): HTTP ${res.status}`);
  return res.json();
}

// Writes a JSON blob to admin storage. Throws 403 if the caller lacks write access.
export async function adminWrite(blobName, data) {
  const body = JSON.stringify(data, null, 2);
  const res = await fetch(adminBlobUrl(blobName), {
    method: 'PUT',
    headers: await authHeaders({
      'Content-Type': 'application/json',
      'x-ms-blob-type': 'BlockBlob',
    }),
    body,
  });
  if (!res.ok) throw new Error(`adminWrite(${blobName}): HTTP ${res.status}`);
}

// ---- Data storage (read-write for all employees) ----

// Reads and parses a JSON blob from data storage.
// Returns null if the blob does not exist (404). Throws on other errors.
export async function dataRead(blobPath) {
  const res = await fetch(dataBlobUrl(blobPath), {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`dataRead(${blobPath}): HTTP ${res.status}`);
  return res.json();
}

// Writes a JSON blob to data storage.
export async function dataWrite(blobPath, data) {
  const body = JSON.stringify(data, null, 2);
  const res = await fetch(dataBlobUrl(blobPath), {
    method: 'PUT',
    headers: await authHeaders({
      'Content-Type': 'application/json',
      'x-ms-blob-type': 'BlockBlob',
    }),
    body,
  });
  if (!res.ok) throw new Error(`dataWrite(${blobPath}): HTTP ${res.status}`);
}

// Lists blob names under a path prefix in the data container.
// e.g. dataList('entries/alice@co.com/') returns all monthly files for Alice.
export async function dataList(prefix) {
  const { accountName, containerName } = config.dataStorage;
  const url = new URL(`https://${accountName}.blob.core.windows.net/${containerName}`);
  url.searchParams.set('restype', 'container');
  url.searchParams.set('comp', 'list');
  if (prefix) url.searchParams.set('prefix', prefix);

  const res = await fetch(url.toString(), { headers: await authHeaders() });
  if (!res.ok) throw new Error(`dataList(${prefix}): HTTP ${res.status}`);

  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  return Array.from(doc.querySelectorAll('Blob > Name')).map(el => el.textContent);
}

// Returns true if the current user has write access to admin storage.
// Used to determine whether to show the admin UI.
export async function canWriteAdmin() {
  const testBlob = '.access-check';
  try {
    await adminWrite(testBlob, { ok: true });
    // Best-effort cleanup - failure here does not matter
    const { accountName, containerName } = config.adminStorage;
    fetch(`https://${accountName}.blob.core.windows.net/${containerName}/${testBlob}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
