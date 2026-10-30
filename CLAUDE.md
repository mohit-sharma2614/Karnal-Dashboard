# CBG Karnal Dashboard — Architecture Reference

> This file is loaded automatically by Claude Code at session start. It is the authoritative source for architectural decisions, naming conventions, and security constraints for this project.

---

## Project Overview

- **Portal:** https://mohit-sharma2614.github.io/Karnal-Dashboard/portal/index.html
- **Dashboard:** https://mohit-sharma2614.github.io/Karnal-Dashboard/dashboard/CBG_Karnal_Dashboard.html
- **Repo (local):** `Z:\CBG_KARNAL\Karnal-Dashboard\`
- **Master Workbook:** `Z:\CBG_KARNAL\MASTER_WORKBOOK\CBG_Karnal_D1_D2_2026.xlsx`
- **Input Workbooks:** `Z:\CBG_KARNAL\INPUT_WORKBOOKS\` (7 files — operator-facing source)
- **Scripts:** `Z:\CBG_KARNAL\SCRIPTS\`

---

## SECURITY — NEVER TOUCH

```
Employee Master  → veryHidden sheet, password: 2614
Salary Ledger    → veryHidden sheet, password: 2614
```

**Do not reference, read, write, migrate, or script against these sheets in any tool, portal, script, or dashboard. Ever.**

---

## Rule: Column Names Only — No Hardcoded Indices

**All Excel column references MUST use column header names, never hardcoded column indices or letters.**

Use the `COLUMN_NAME_MAP` + `getColByName()` pattern in `portal/index.html`:

```js
// CORRECT
const col = await getColByName(sheetName, hrow, 'Header Name Here')

// WRONG — never do this
const col = 5
rowData[4] = value
```

`getColByName(sheetName, hrow, spec)`:
- Fetches headers from Graph API, uses `_hdrCache` to avoid repeated fetches
- `spec='Name~N'` for Nth occurrence of a repeated header
- Returns 1-based column number

**Every new sheet, every new column reference — use `COLUMN_NAME_MAP` + `getColByName`. No exceptions.**

---

## Portal Architecture (`portal/index.html`)

### Key Data Structures

**`SHEETS` array** — 23 entries, each with:
```js
{ id, label, group, sheet, hasDate, track, sections[] }
```
- `sheet`: exact Excel tab name (use underscores if tab has them, e.g. `'Feed_and_Balance'`)
- `track: true/false` — must be set explicitly on every entry
  - `track:true` = included in sidebar audit ring, date pill %, missing-entry alerts
  - `track:false` = excluded from tracking UI
- When adding a new sheet, set `track` explicitly at definition time

**`COLUMN_NAME_MAP`** — maps `{ sheetId: { fieldKey: 'Exact Excel Header String' } }`

**`SHEET_META`** — maps `{ sheetId: { masterSheet: 'Tab Name', hrow: N } }`

**`allTracked`** = `SHEETS.filter(s => s.track)` — used in `buildSidebar()`, `renderHome()`, `renderAudit()`

**`CONFIG`** — single `fileId` pointing to Master Workbook. Input Workbook fileIds are pending (not yet added).

### Sheet IDs (23 total)
| ID | Sheet Tab | Track |
|---|---|---|
| D1 | D1 | true |
| D2 | D2 | true |
| PSA | PSA Production | true |
| PH | Digester pH | true |
| TEMP | Digester Temp | true |
| TSVS | Digester TS-VS | true |
| IAPA | Digester IA-PA | true |
| FS | Feedstock Supply | true | ⚠️ Tab does NOT exist in master — form saves will 404 |
| FB | Feed_and_Balance | true | FS and FB share this same Excel tab |
| PMCAL | Pressmud Cal. | true |
| CDCAL | Cow Dung Cal. | true |
| GSCAL | Rice Grain Syrup Cal. | true |
| CSLCAL | CSL Cal. | true |
| SGCAL | Dry Spent Grain Cal | true |
| APPCAL | Apple Pomace Cal. | true |
| MANURE | Manure Sales | true |
| SALES | Sales Detail | true |
| MAINT | Maintenance | true |
| REVCOST | Daily Revenue & Costs | true |
| FIXED | Monthly Fixed Costs | false |
| EMI | EMI Tracker | false |
| CBGEXP | CBG Expected | false |
| PLANNER | Daily Planner | false |

### Graph API Pattern
```
/drives/{driveId}/items/{fileId}/workbook/worksheets('Tab%20Name')/range(address='A1:Z100')
```
- Drive ID: `b!lwSJs3g0SU-eJPxpXLyBQY-LeEFYrGxFj8s5iYGGS57bRR6p1guPRb0ucPoLeK4c`
- Master File ID: `017HLDFZY5WPVD5W73ORDJHMBRYCXS4A5O`

### Append vs. Overwrite Sheets
- **Append sheets** (Cal. sheets, MANURE, MAINT, SALES, etc.): Date in column A (col 1), `dataStart` from UPL_CFG
- **Overwrite sheets** (D1, D2, PSA, PH, TEMP, TSVS, IAPA, FB): Date-keyed row lookup

---

## Input Workbooks Architecture

Operators fill Input Workbooks daily. Portal should read/write Input Workbooks (not Master directly). Master Workbook is the aggregated store.

| Workbook | Sheets |
|---|---|
| `Production_RBG_Workbook.xlsx` | D1, D2 |
| `CBG_Production_Compressor_Workbook.xlsx` | PSA Production |
| `Digester_Health_Workbook.xlsx` | Digester pH, Digester TS-VS, Digester Temp, Digester IA-PA |
| `Feed_Cost_Procurement_Balance_Workbook.xlsx` | Feed_and_Balance, Copy of Sheet1 |
| `Lab_Workbook.xlsx` | Pressmud Cal., CSL Cal., Cow Dung Cal., Rice Grain Syrup Cal., Dry Spent Grain Cal, Apple Pomace Cal. |
| `Sales_Finance_Workbook.xlsx` | Sales Detail, Manure Sales, Daily Revenue & Costs, Monthly Fixed Costs, Maintenance, EMI Tracker, Salary Ledger |
| `Admin_Workbook.xlsx` | Daily Planner, Employee Master, Submission Log, CBG Expected |

**All 18 sheet header pairs match as of Oct 2026.** Input Workbook fileIds not yet in CONFIG — pending implementation.

---

## Schema Verification — Last Run: 2026-10-29

Verified by running `verify_schema.py` against live Master Workbook.
**Result: 263 fields verified OK | 0 MISSING | 0 WRONG OCCURRENCE | 0 SHEET ERRORS**

| Portal ID | Master Sheet | Input Workbook | Fields | Result |
|---|---|---|---|---|
| D1 | D1 | `Production_RBG_Workbook.xlsx` | 53 | PASS |
| D2 | D2 | `Production_RBG_Workbook.xlsx` | 53 | PASS |
| PSA | PSA Production | `CBG_Production_Compressor_Workbook.xlsx` | 26 | PASS |
| PH | Digester pH | `Digester_Health_Workbook.xlsx` | 7 | PASS |
| TEMP | Digester Temp | `Digester_Health_Workbook.xlsx` | 7 | PASS |
| TSVS | Digester TS-VS | `Digester_Health_Workbook.xlsx` | 13 | PASS |
| IAPA | Digester IA-PA | `Digester_Health_Workbook.xlsx` | 17 | PASS |
| PMCAL | Pressmud Cal. | `Lab_Workbook.xlsx` | 8 | PASS |
| CDCAL | Cow Dung Cal. | `Lab_Workbook.xlsx` | 8 | PASS |
| GSCAL | Rice Grain Syrup Cal. | `Lab_Workbook.xlsx` | 7 | PASS |
| CSLCAL | CSL Cal. | `Lab_Workbook.xlsx` | 8 | PASS |
| SGCAL | Dry Spent Grain Cal | `Lab_Workbook.xlsx` | 8 | PASS |
| APPCAL | Apple Pomace Cal. | `Lab_Workbook.xlsx` | 8 | PASS |
| FB | Feed_and_Balance | `Feed_Cost_Procurement_Balance_Workbook.xlsx` | 10 | PASS |
| FS | Feed_and_Balance | `Feed_Cost_Procurement_Balance_Workbook.xlsx` (Copy of Sheet1) | — | TAB MISSING |
| SALES | Sales Detail | `Sales_Finance_Workbook.xlsx` | 10 | PASS |
| MANURE | Manure Sales | `Sales_Finance_Workbook.xlsx` | 5 | PASS |
| MAINT | Maintenance | `Sales_Finance_Workbook.xlsx` | 7 | PASS |
| REVCOST | Daily Revenue & Costs | `Sales_Finance_Workbook.xlsx` | 8 | PASS |

**FS (Feedstock Supply)** — skipped, tab does not exist in Master Workbook.

**Feed_and_Balance extra columns found in actual sheet (not in FB COLUMN_NAME_MAP):**
- col 85: `Apple pomace` (Fed section — not mapped in FB, portal doesn't write it yet)
- col 71/74: `Shreeji` (Grain Syrup vendor — not in FS map)
- col 76/78: `Aaditya Solar` (vendor — not in FS map)
- Received/cost columns (col 87–92): `Cow Dung`, `Pressmud`, `CSL`, `Grain Syrup`, `Spent grain`, `Apple pomace` — these are formula cells, intentionally not written by portal

---

## Known Issues / Pending Work

1. **Input Workbook fileIds**: Add each workbook's SharePoint fileId to `CONFIG`
2. **FS sheet**: `Feedstock Supply` tab does NOT exist in master workbook — portal FS form will 404 until tab is created. Source: `Z:\CBG_KARNAL\SOURCE_DATA\Feedstock Supply Sheet_LREKPL.xlsx` (184 rows). `FS` and `FB` both use `Feed_and_Balance` tab in SHEET_META.
3. **Oct 2026 data migration**: D1, D2, Feed & Balance, PSA not yet migrated
4. **Dashboard column-name migration**: Not started — dashboard still uses hardcoded indices
5. **Feedstock Supply tab**: Must create tab in master + migrate 184 rows before FS form works

## Completed
- Fix 9+10: `COLUMN_MAP` eliminated — `buildCmFromHeaders()` introduced, all upload/preview/wizard code migrated to `COLUMN_NAME_MAP` ✅

---

## Azure AD Config

| Item | Value |
|---|---|
| Client ID | cca66a21-2c5b-455c-bff6-009f2877849c |
| Tenant ID | f7dda424-934f-4492-91d0-9eff9f6b4ff3 |
| Allowed users | it@elanenergy.in, ekas@elanenergy.in, shikha@elanenergy.in, ea@elanenergy.in, ceo@elanenergy.in |

---

## BPP / OLR Rates (from memory)

| Feedstock | Rate |
|---|---|
| Cow Dung (CD) | 45 |
| Grain Syrup (GS) | 220 |
| CSL | 270 |
| Spent Grain (SG) | 130 |
| Pressmud (PM) | 95/85/70/50 |
