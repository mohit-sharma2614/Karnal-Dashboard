# CBG Karnal — Data Portal + Dashboard

Data entry portal and live dashboard for CBG Karnal plant.

## Structure

```
config/
  rates.js       ← All BPP rates, constants (edit here to change formulas)
  digesters.js   ← Digester column maps (add D3/D4 here)
  auth.js        ← SharePoint + Azure AD credentials (fill before deploy)

js/
  formulas.js    ← Pure calculation functions
  calc-engine.js ← Runs calcs from digester config
  graph-api.js   ← SharePoint read/write via Microsoft Graph

portal/          ← Data entry forms (one per sheet)
dashboard/       ← Live charts and KPIs
assets/          ← Logos, icons
```

## To change a formula
Edit `js/formulas.js` only. Portal and dashboard update automatically.

## To change a rate (e.g. PM BPP winter rate)
Edit `config/rates.js` only.

## To add a new digester
Add one entry to `config/digesters.js`. Everything else is automatic.

## Setup
1. Fill `config/auth.js` with your Azure AD Client ID, Tenant ID, SharePoint URL
2. Push to GitHub → Netlify auto-deploys
