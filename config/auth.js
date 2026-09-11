// ─── MICROSOFT GRAPH API AUTH CONFIG ─────────────────────────────────────────
// Fill in your values after Azure AD app registration.
// Client ID and Tenant ID are safe to commit (not secrets).

export const AUTH = {
  clientId:   'YOUR_CLIENT_ID_HERE',    // Azure AD → App registrations → Application (client) ID
  tenantId:   'YOUR_TENANT_ID_HERE',    // Azure AD → App registrations → Directory (tenant) ID
  scopes:     ['Files.ReadWrite.All', 'Sites.ReadWrite.All', 'User.Read'],
}

export const SHAREPOINT = {
  siteUrl:    'https://YOUR_ORG.sharepoint.com/sites/YOUR_SITE',
  filePath:   '/sites/YOUR_SITE/Shared Documents/MASTER_WORKBOOK/CBG_Karnal_D1_D2_2026.xlsx',
}
