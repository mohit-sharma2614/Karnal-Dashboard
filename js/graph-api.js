// ─── SHAREPOINT READ / WRITE VIA MICROSOFT GRAPH API ─────────────────────────
// All SharePoint communication goes through here.
// Changing file path or site URL → edit config/auth.js only.

import { AUTH, SHAREPOINT } from '../config/auth.js'

let _msalInstance = null
let _accessToken  = null

// ── Initialise MSAL (call once on page load) ──────────────────────────────────
export async function initAuth() {
  const { PublicClientApplication } = window.msal
  _msalInstance = new PublicClientApplication({
    auth: {
      clientId:    AUTH.clientId,
      tenantId:    AUTH.tenantId,
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: 'sessionStorage' },
  })
  await _msalInstance.initialize()

  // Handle redirect response
  const result = await _msalInstance.handleRedirectPromise()
  if (result) _accessToken = result.accessToken
}

// ── Sign in ───────────────────────────────────────────────────────────────────
export async function signIn() {
  await _msalInstance.loginRedirect({ scopes: AUTH.scopes })
}

// ── Get access token (silent, falls back to redirect) ────────────────────────
async function getToken() {
  if (_accessToken) return _accessToken
  const accounts = _msalInstance.getAllAccounts()
  if (!accounts.length) { await signIn(); return null }
  try {
    const res = await _msalInstance.acquireTokenSilent({ scopes: AUTH.scopes, account: accounts[0] })
    return res.accessToken
  } catch {
    await _msalInstance.acquireTokenRedirect({ scopes: AUTH.scopes })
    return null
  }
}

// ── Get Excel workbook session ID ─────────────────────────────────────────────
async function getSessionId(token) {
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(SHAREPOINT.siteUrl)}`
    + `/drives/root:${SHAREPOINT.filePath}:/workbook/createSession`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ persistChanges: true }),
  })
  const data = await res.json()
  return data.id
}

// ── Read a sheet range ────────────────────────────────────────────────────────
export async function readRange(sheetName, range) {
  const token = await getToken()
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(SHAREPOINT.siteUrl)}`
    + `/drives/root:${SHAREPOINT.filePath}:/workbook/worksheets('${sheetName}')/range(address='${range}')`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

// ── Write a single row to a sheet ─────────────────────────────────────────────
// rowData = { col_number: value, ... } (1-based column numbers)
// Finds the row by date match, then updates it.
export async function writeRow(sheetName, rowNumber, rowData, maxCol = 60) {
  const token = await getToken()
  const sessionId = await getSessionId(token)

  // Build values array (1-based → 0-based array)
  const values = Array(maxCol).fill(null)
  for (const [col, val] of Object.entries(rowData)) {
    values[parseInt(col) - 1] = val ?? null
  }

  const range = `A${rowNumber}:${colLetter(maxCol)}${rowNumber}`
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(SHAREPOINT.siteUrl)}`
    + `/drives/root:${SHAREPOINT.filePath}:/workbook/worksheets('${sheetName}')/range(address='${range}')`

  await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization:       `Bearer ${token}`,
      'Content-Type':      'application/json',
      'workbook-session-id': sessionId,
    },
    body: JSON.stringify({ values: [values] }),
  })
}

// ── Find row number for a given date in a sheet ───────────────────────────────
export async function findRowByDate(sheetName, dateStr, dataStartRow = 3) {
  const token = await getToken()
  // Read column A (dates) — first 400 rows
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(SHAREPOINT.siteUrl)}`
    + `/drives/root:${SHAREPOINT.filePath}:/workbook/worksheets('${sheetName}')/range(address='A${dataStartRow}:A400')`
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  const rows = data.values || []

  const target = new Date(dateStr).toDateString()
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0]
    if (cell && new Date(cell).toDateString() === target) {
      return dataStartRow + i
    }
  }
  return null   // date not found
}

// ── Read a full row by date (for pre-filling the form) ────────────────────────
export async function readRowByDate(sheetName, dateStr, dataStartRow = 3, maxCol = 60) {
  const rowNum = await findRowByDate(sheetName, dateStr, dataStartRow)
  if (!rowNum) return null
  const data = await readRange(sheetName, `A${rowNum}:${colLetter(maxCol)}${rowNum}`)
  return { rowNum, values: data.values?.[0] || [] }
}

// ── Helper: column number → letter (1→A, 26→Z, 27→AA …) ─────────────────────
function colLetter(n) {
  let s = ''
  while (n > 0) {
    n--
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

// ── Get signed-in user display name ──────────────────────────────────────────
export function getCurrentUser() {
  const accounts = _msalInstance?.getAllAccounts() || []
  return accounts[0]?.name || accounts[0]?.username || 'Unknown'
}
