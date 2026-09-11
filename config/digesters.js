// ─── DIGESTER CONFIGURATION ──────────────────────────────────────────────────
// Add D3, D4 here — portal, dashboard, and calc engine update automatically.
// Only col indices differ between digesters. Formula functions are shared.

export const DIGESTERS = [
  {
    id: 'D1',
    label: 'Digester 1',
    sheet: 'D1',
    data_start_row: 3,
    cols: {
      // ── Manual inputs ──────────────────────────────────────────────────────
      date:           { col: 1,  type: 'manual',  label: 'Date',                  input: 'date' },
      cd_expected:    { col: 2,  type: 'manual',  label: 'CD Expected (MT)',       input: 'number' },
      pm_expected:    { col: 3,  type: 'manual',  label: 'PM Expected (MT)',       input: 'number' },
      poultry_exp:    { col: 4,  type: 'manual',  label: 'Poultry Expected (KL)',  input: 'number' },
      csl_expected:   { col: 5,  type: 'manual',  label: 'CSL Expected (KL)',      input: 'number' },
      cd_actual:      { col: 15, type: 'manual',  label: 'CD Actual (MT)',         input: 'number' },
      pm_actual:      { col: 16, type: 'manual',  label: 'PM Actual (MT)',         input: 'number' },
      poultry_actual: { col: 17, type: 'manual',  label: 'Poultry Actual (cu.m)', input: 'number' },
      csl_actual:     { col: 18, type: 'manual',  label: 'CSL Actual (KL)',        input: 'number' },
      fw_actual:      { col: 27, type: 'manual',  label: 'Fresh Water (m³)',       input: 'number' },
      rs_actual:      { col: 28, type: 'manual',  label: 'Recycle Slurry (m³)',    input: 'number' },
      flow_meter:     { col: 29, type: 'manual',  label: 'Flow Meter (m³)',        input: 'number' },
      actual_drain:   { col: 31, type: 'manual',  label: 'Actual Drain',           input: 'number' },
      rbg_psa:        { col: 33, type: 'manual',  label: 'RBG at PSA (m³)',        input: 'number' },
      rbg_vent:       { col: 34, type: 'manual',  label: 'RBG Vent (m³)',          input: 'number' },
      cbg_produced:   { col: 36, type: 'manual',  label: 'CBG Produced (kg)',      input: 'number' },
      cbg_vent:       { col: 37, type: 'manual',  label: 'CBG Vent (kg)',          input: 'number' },
      slurry_height:  { col: 48, type: 'manual',  label: 'Slurry Height (m)',      input: 'number' },

      // ── Auto-calculated (shown as read-only amber fields in portal) ────────
      cd_bpp:         { col: 43, type: 'calc', fn: 'bpp_cd',         label: 'CD BPP (m³)' },
      pm_bpp:         { col: 44, type: 'calc', fn: 'bpp_pm',         label: 'PM BPP (m³)' },
      gs_bpp:         { col: 45, type: 'calc', fn: 'bpp_gs',         label: 'GS BPP (m³)' },
      csl_bpp:        { col: 46, type: 'calc', fn: 'bpp_csl',        label: 'CSL BPP (m³)' },
      working_vol:    { col: 47, type: 'calc', fn: 'working_volume', label: 'Working Volume (m³)' },
      olr:            { col: 49, type: 'calc', fn: 'olr',            label: 'OLR (kg VS/m³/day)' },
      psa_eff:        { col: 50, type: 'calc', fn: 'psa_efficiency', label: 'PSA Efficiency (%)' },
    },
  },

  {
    id: 'D2',
    label: 'Digester 2',
    sheet: 'D2',
    data_start_row: 3,
    cols: {
      // ── Manual inputs ──────────────────────────────────────────────────────
      date:           { col: 1,  type: 'manual',  label: 'Date',                  input: 'date' },
      cd_expected:    { col: 2,  type: 'manual',  label: 'CD Expected (MT)',       input: 'number' },
      pm_expected:    { col: 3,  type: 'manual',  label: 'PM Expected (MT)',       input: 'number' },
      poultry_exp:    { col: 4,  type: 'manual',  label: 'Poultry Expected (KL)',  input: 'number' },
      csl_expected:   { col: 5,  type: 'manual',  label: 'CSL Expected (KL)',      input: 'number' },
      cd_actual:      { col: 15, type: 'manual',  label: 'CD Actual (MT)',         input: 'number' },
      pm_actual:      { col: 16, type: 'manual',  label: 'PM Actual (MT)',         input: 'number' },
      poultry_actual: { col: 17, type: 'manual',  label: 'Poultry Actual (cu.m)', input: 'number' },
      csl_actual:     { col: 18, type: 'manual',  label: 'CSL Actual (KL)',        input: 'number' },
      fw_actual:      { col: 27, type: 'manual',  label: 'Fresh Water (m³)',       input: 'number' },
      rs_actual:      { col: 28, type: 'manual',  label: 'Recycle Slurry (m³)',    input: 'number' },
      flow_meter:     { col: 29, type: 'manual',  label: 'Flow Meter (m³)',        input: 'number' },
      actual_drain:   { col: 31, type: 'manual',  label: 'Actual Drain',           input: 'number' },
      rbg_psa:        { col: 33, type: 'manual',  label: 'RBG at PSA (m³)',        input: 'number' },
      rbg_vent:       { col: 34, type: 'manual',  label: 'RBG Vent (m³)',          input: 'number' },
      cbg_produced:   { col: 36, type: 'manual',  label: 'CBG Produced (kg)',      input: 'number' },
      cbg_vent:       { col: 37, type: 'manual',  label: 'CBG Vent (kg)',          input: 'number' },
      slurry_height:  { col: 49, type: 'manual',  label: 'Slurry Height (m)',      input: 'number' },

      // ── Auto-calculated ────────────────────────────────────────────────────
      cd_bpp:         { col: 44, type: 'calc', fn: 'bpp_cd',         label: 'CD BPP (m³)' },
      pm_bpp:         { col: 45, type: 'calc', fn: 'bpp_pm',         label: 'PM BPP (m³)' },
      gs_bpp:         { col: 46, type: 'calc', fn: 'bpp_gs',         label: 'GS BPP (m³)' },
      csl_bpp:        { col: 47, type: 'calc', fn: 'bpp_csl',        label: 'CSL BPP (m³)' },
      working_vol:    { col: 48, type: 'calc', fn: 'working_volume', label: 'Working Volume (m³)' },
      olr:            { col: 50, type: 'calc', fn: 'olr',            label: 'OLR (kg VS/m³/day)' },
      psa_eff:        { col: 51, type: 'calc', fn: 'psa_efficiency', label: 'PSA Efficiency (%)' },
    },
  },

  // ── Add D3, D4 here when new digesters are commissioned ──────────────────
  // { id: 'D3', label: 'Digester 3', sheet: 'D3', data_start_row: 3, cols: { ...same structure } },
]
