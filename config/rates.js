// ─── ALL RATES & CONSTANTS ───────────────────────────────────────────────────
// This is the ONLY file to change when rates or constants are updated.
// Portal and dashboard read from here automatically.

export const RATES = {
  CD:  { bpp: 45 },          // m³/MT — fixed
  GS:  { bpp: 220 },         // m³/KL
  CSL: { bpp: 270, density: 1.15 },  // m³/KL, density MT/KL
  PM: {
    bpp: {
      winter:  95,   // Nov, Dec, Jan, Feb, Mar, Apr
      may:     85,
      summer:  70,   // Jun, Jul, Aug
      monsoon: 50,   // Sep, Oct
    },
    vs_stored_as_fraction: true,  // Pressmud VS% stored as 0.5059 not 50.59
  },
  DIGESTER: {
    radius:         15,    // metres
    default_height: {
      winter: 7.8,   // Jan–Mar
      other:  7.5,   // Apr–Dec
    },
  },
  PSA: {
    design_basis: 275,   // kg CBG per hour at 100% efficiency
  },
  DENSITIES: {
    CSL: 1.15,   // MT/KL
    GS:  1.30,   // MT/KL
  },
}
