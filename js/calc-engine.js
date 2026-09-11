// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────
// Runs all calc columns for any digester using its config.
// Never defines formula logic — imports from formulas.js.

import { FORMULAS, calcVsKg } from './formulas.js'

/**
 * Run all calc columns for a digester.
 * @param {object} digesterConfig  — one entry from DIGESTERS array
 * @param {object} inputs          — { field: value } from form
 * @param {object} lookups         — { psa_hours, cd_vs, pm_vs, csl_vs, gs_vs }
 * @returns {object}               — { field: calculated_value }
 */
export function runCalcs(digesterConfig, inputs, lookups = {}) {
  const month = inputs.date ? new Date(inputs.date).getMonth() + 1 : new Date().getMonth() + 1

  // Pre-compute working volume (OLR depends on it)
  const working_vol = FORMULAS.working_volume({ ...inputs, month })

  // Pre-compute VS kg (OLR depends on it)
  const vs_kg = calcVsKg(
    { cd: inputs.cd_actual, pm: inputs.pm_actual, csl: inputs.csl_actual, gs: inputs.gs_actual },
    lookups
  )

  const enrichedLookups = { ...lookups, working_vol, vs_kg }

  const results = {}
  for (const [field, def] of Object.entries(digesterConfig.cols)) {
    if (def.type !== 'calc') continue
    const fn = FORMULAS[def.fn]
    if (!fn) { console.warn(`Formula not found: ${def.fn}`); continue }
    const val = fn({ ...inputs, month, vs_kg }, enrichedLookups)
    results[field] = val !== null && val !== undefined ? Math.round(val * 10000) / 10000 : null
  }

  return results
}

/**
 * Build the complete Excel row object: { col_number: value }
 * Merges manual inputs + calculated results using digester col map.
 */
export function buildExcelRow(digesterConfig, inputs, calcs) {
  const row = {}
  for (const [field, def] of Object.entries(digesterConfig.cols)) {
    const val = def.type === 'manual' ? inputs[field] : calcs[field]
    if (val !== undefined && val !== null && val !== '') {
      row[def.col] = val
    }
  }
  return row
}
