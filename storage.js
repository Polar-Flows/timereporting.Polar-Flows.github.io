// storage.js - Microsoft Graph API helpers for SharePoint file storage
//
// Reads and writes JSON files stored in a SharePoint document library.
// Uses the Microsoft Graph API via fetch + an AD Bearer token.
// No SDK dependency needed. Graph API supports browser CORS natively.

import { config } from './config.js';
import { getToken } from './auth.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function authHeaders(extra = {}) {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

// Build a Graph API URL for a file path inside the configured drive.
// filePath is relative to the rootPath (e.g. 'config/projects.json').
function fileUrl(filePath) {
  const { siteId, driveId, rootPath } = config.sharePoint;
  const fullPath = rootPath ? `${rootPath}/${filePath}` : filePath;
  return `${GRAPH_BASE}/sites/${siteId}/drives/${driveId}/root:/${fullPath}`;
}

// Build a Graph API URL for listing the children of a folder path.
function folderChildrenUrl(folderPath) {
  const { siteId, driveId, rootPath } = config.sharePoint;
  const fullPath = rootPath ? `${rootPath}/${folderPath}` : folderPath;
  return `${GRAPH_BASE}/sites/${siteId}/drives/${driveId}/root:/${fullPath}:/children`;
}

// ---- Config folder (read-only for employees, read-write for admin) ----

// Reads and parses a JSON file from the config folder.
// Returns null if the file does not exist (404). Throws on other errors.
export async function adminRead(fileName) {
  const res = await fetch(`${fileUrl(`config/${fileName}`)}:/content`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`adminRead(${fileName}): HTTP ${res.status}`);
  return res.json();
}

// Writes a JSON file to the config folder. Throws 403 if the caller lacks write access.
export async function adminWrite(fileName, data) {
  const body = JSON.stringify(data, null, 2);
  const res = await fetch(`${fileUrl(`config/${fileName}`)}:/content`, {
    method: 'PUT',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body,
  });
  if (!res.ok) throw new Error(`adminWrite(${fileName}): HTTP ${res.status}`);
}

// ---- Entries folder (read-write for all employees) ----

// Reads and parses a JSON file from the entries folder.
// filePath must include the 'entries/' prefix, e.g. 'entries/alice@co.com/2026-04.json'.
// Returns null if the file does not exist (404). Throws on other errors.
export async function dataRead(filePath) {
  const res = await fetch(`${fileUrl(filePath)}:/content`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`dataRead(${filePath}): HTTP ${res.status}`);
  return res.json();
}

// Writes a JSON file to the entries folder.
// filePath must include the 'entries/' prefix, e.g. 'entries/alice@co.com/2026-04.json'.
export async function dataWrite(filePath, data) {
  const body = JSON.stringify(data, null, 2);
  const res = await fetch(`${fileUrl(filePath)}:/content`, {
    method: 'PUT',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body,
  });
  if (!res.ok) throw new Error(`dataWrite(${filePath}): HTTP ${res.status}`);
}

// Lists file paths under a prefix in the entries folder.
//
// Behaviour:
//   dataList('')                    - lists all users' files recursively
//   dataList('entries/alice@co.com/') - lists one user's month files
//
// Returns full relative paths, e.g. ['entries/alice@co.com/2026-04.json'].
export async function dataList(prefix) {
  const headers = await authHeaders();

  if (!prefix) {
    // List top-level email folders under entries/
    const res = await fetch(folderChildrenUrl('entries'), { headers });
    if (!res.ok) throw new Error(`dataList(): HTTP ${res.status}`);
    const data = await res.json();
    const folders = (data.value || []).filter(i => i.folder).map(i => i.name);

    // For each user folder, list its month files and return full relative paths
    const paths = [];
    await Promise.all(folders.map(async folder => {
      const r2 = await fetch(folderChildrenUrl(`entries/${folder}`), { headers });
      if (!r2.ok) return;
      const d2 = await r2.json();
      (d2.value || []).filter(i => !i.folder).forEach(i => {
        paths.push(`entries/${folder}/${i.name}`);
      });
    }));
    return paths;
  }

  // prefix is e.g. 'entries/alice@co.com/' - list files inside that folder
  const folderPath = prefix.replace(/\/$/, ''); // e.g. 'entries/alice@co.com'
  const res = await fetch(folderChildrenUrl(folderPath), { headers });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`dataList(${prefix}): HTTP ${res.status}`);
  const data = await res.json();
  return (data.value || []).filter(i => !i.folder).map(i => `${folderPath}/${i.name}`);
}

// Returns true if the current user has write access to the config folder.
// Used to determine whether to show the admin UI.
export async function canWriteAdmin() {
  try {
    await adminWrite('.access-check', { ok: true });
    return true;
  } catch {
    return false;
  }
}
