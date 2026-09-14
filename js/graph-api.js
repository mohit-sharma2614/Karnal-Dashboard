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

// ── Base URL for all workbook operations ──────────────────────────────────────
// driveId + fileId is locale-proof and doesn't require URL-encoding file paths.
function workbookUrl() {
  return `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT.driveId}/items/${SHAREPOINT.fileId}/workbook`
}

// ── Get Excel workbook session ID ─────────────────────────────────────────────
async function getSessionId(token) {
  const res = await fetch(`${workbookUrl()}/createSession`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ persistChanges: true }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(`createSession failed: ${JSON.stringify(data)}`)
  return data.id
}

// ── Read a sheet range ────────────────────────────────────────────────────────
export async function readRange(sheetName, range) {
  const token = await getToken()
  const url = `${workbookUrl()}/worksheets('${encodeURIComponent(sheetName)}')/range(address='${range}')`
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
  const url = `${workbookUrl()}/worksheets('${encodeURIComponent(sheetName)}')/range(address='${range}')`

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

// ── Append a new row (for Cal sheets — multiple samples per day, never overwrite) ──
// Finds the last non-empty row in column A, writes to the row after it.
export async function appendRow(sheetName, rowData, dataStartRow = 3, maxCol = 60) {
  const token = await getToken()

  const url = `${workbookUrl()}/worksheets('${encodeURIComponent(sheetName)}')/range(address='A${dataStartRow}:A500')`
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  const rows = data.values || []

  // Find last filled row (iterate from end)
  let lastFilled = dataStartRow - 1
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i][0] !== null && rows[i][0] !== '') {
      lastFilled = dataStartRow + i
      break
    }
  }
  const nextRow = lastFilled + 1
  await writeRow(sheetName, nextRow, rowData, maxCol)
  return nextRow
}

// ── Parse a date cell returned by Graph API ───────────────────────────────────
// Graph API can return: Excel serial number (number), ISO string, or formatted string.
// Always returns a JS Date in local midnight, or null on failure.
function parseGraphDate(cell) {
  if (cell === null || cell === undefined || cell === '') return null

  // Case 1: Excel serial number (e.g. 46000)
  if (typeof cell === 'number') {
    // Excel epoch: Jan 0 1900; Unix epoch: Jan 1 1970.
    // 25569 = days between 1900-01-01 and 1970-01-01 (with Excel's leap-year bug baked in)
    const ms = (cell - 25569) * 86400 * 1000
    const d = new Date(ms)
    // Re-parse as local midnight to strip any UTC offset
    return new Date(`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}T00:00:00`)
  }

  if (typeof cell === 'string') {
    // Case 2: ISO string "2026-09-14T00:00:00" or "2026-09-14"
    const iso = cell.match(/^(\d{4}-\d{2}-\d{2})/)
    if (iso) return new Date(iso[1] + 'T00:00:00')

    // Case 3: DD-MM-YYYY (master workbook standard)
    const dmy = cell.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (dmy) return new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00`)

    // Case 4: DD/MM/YYYY
    const dmy2 = cell.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dmy2) return new Date(`${dmy2[3]}-${dmy2[2]}-${dmy2[1]}T00:00:00`)

    // Case 5: DD-Mon-YYYY (e.g. "14-Sep-2026") — PSA Production sheet format
    const monNames = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                      Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'}
    const dMonY = cell.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/)
    if (dMonY) {
      const mo = monNames[dMonY[2]] || monNames[dMonY[2].charAt(0).toUpperCase()+dMonY[2].slice(1).toLowerCase()]
      if (mo) return new Date(`${dMonY[3]}-${mo}-${dMonY[1]}T00:00:00`)
    }
  }

  return null
}

// ── Convert Date → YYYY-MM-DD ISO string (locale-proof) ──────────────────────
function toISODate(d) {
  if (!d || isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── Find row number for a given date in a sheet ───────────────────────────────
export async function findRowByDate(sheetName, dateStr, dataStartRow = 3) {
  const token = await getToken()
  const url = `${workbookUrl()}/worksheets('${encodeURIComponent(sheetName)}')/range(address='A${dataStartRow}:A400')`
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  const rows = data.values || []

  // Parse target using T00:00:00 to prevent UTC-to-IST shift
  const targetISO = toISODate(new Date(dateStr + 'T00:00:00'))

  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0]
    const d = parseGraphDate(cell)
    if (d && toISODate(d) === targetISO) return dataStartRow + i
  }
  return null
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

// ── Convert YYYY-MM-DD → Excel serial number ─────────────────────────────────
// Use this for every date value written to Excel via Graph API.
// Excel serial is a plain integer — no locale parsing, no day/month swap possible.
// The cell's DD-MM-YYYY number format controls display; the value itself is unambiguous.
//
// Excel epoch = Dec 30 1899 (accounts for Lotus 1-2-3 leap-year bug).
// Example: 2026-09-14 → 46088
export function toExcelSerial(dateStr) {
  // dateStr must be "YYYY-MM-DD" — always use T00:00:00 to avoid UTC offset
  const d     = new Date(dateStr + 'T00:00:00')
  const epoch = new Date('1899-12-30T00:00:00')
  return Math.round((d - epoch) / 86400000)
}

// ── Get signed-in user display name ──────────────────────────────────────────
export function getCurrentUser() {
  const accounts = _msalInstance?.getAllAccounts() || []
  return accounts[0]?.name || accounts[0]?.username || 'Unknown'
}
