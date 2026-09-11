// ─── PURE CALCULATION FUNCTIONS ──────────────────────────────────────────────
// No column indices. No sheet names. No SharePoint.
// Change a formula here → portal + dashboard update automatically.

import { RATES } from '../config/rates.js'

// ── PM BPP seasonal rate ──────────────────────────────────────────────────────
function pmBppRate(month) {
  if ([11, 12, 1, 2, 3, 4].includes(month)) return RATES.PM.bpp.winter
  if (month === 5)                            return RATES.PM.bpp.may
  if ([6, 7, 8].includes(month))             return RATES.PM.bpp.summer
  return RATES.PM.bpp.monsoon   // Sep, Oct
}

// ── Default slurry height when operator hasn't entered ────────────────────────
function defaultSlurryHeight(month) {
  return [1, 2, 3].includes(month)
    ? RATES.DIGESTER.default_height.winter
    : RATES.DIGESTER.default_height.other
}

// ─── FORMULA REGISTRY ─────────────────────────────────────────────────────────
// Each function receives (inputs, lookups):
//   inputs  = { field: value } from the form (manual entries)
//   lookups = { working_vol, psa_hours, vs_kg, ... } (pre-computed dependencies)

export const FORMULAS = {

  bpp_cd: ({ cd_actual = 0 }) =>
    cd_actual * RATES.CD.bpp,

  bpp_pm: ({ pm_actual = 0, month }) =>
    pm_actual * pmBppRate(month),

  bpp_gs: ({ gs_actual = 0 }) =>
    gs_actual * RATES.GS.bpp,

  bpp_csl: ({ csl_actual = 0 }) =>
    csl_actual * RATES.CSL.bpp,

  working_volume: ({ slurry_height, month }) => {
    const h = (slurry_height && slurry_height > 0)
      ? slurry_height
      : defaultSlurryHeight(month)
    return Math.PI * Math.pow(RATES.DIGESTER.radius, 2) * h
  },

  olr: ({ vs_kg = 0 }, { working_vol = 0 }) =>
    working_vol > 0 ? vs_kg / working_vol : null,

  psa_efficiency: ({ cbg_produced = 0 }, { psa_hours = 0 }) => {
    const ideal = psa_hours * RATES.PSA.design_basis
    return ideal > 0 ? (cbg_produced / ideal) * 100 : null
  },

}

// ─── VS LOADING CALCULATOR (used for OLR) ────────────────────────────────────
// Requires Cal sheet lookup values (ts_pct, vs_pct) passed as lookups.
export function calcVsKg({ cd = 0, pm = 0, csl = 0, gs = 0 }, { cd_vs, pm_vs, csl_vs, gs_vs }) {
  let total = 0
  if (cd  > 0 && cd_vs)  total += cd  * (cd_vs.ts  / 100) * (cd_vs.vs  / 100) * 1000
  if (pm  > 0 && pm_vs)  total += pm  * (pm_vs.ts  / 100) * (pm_vs.vs  / 100) * 1000
  if (csl > 0 && csl_vs) total += csl * RATES.DENSITIES.CSL * (csl_vs.ts / 100) * (csl_vs.vs / 100) * 1000
  if (gs  > 0 && gs_vs)  total += gs  * RATES.DENSITIES.GS  * (gs_vs.ts  / 100) * (gs_vs.vs  / 100) * 1000
  return total
}
