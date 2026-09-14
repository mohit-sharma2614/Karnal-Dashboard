// ─── MICROSOFT GRAPH API AUTH CONFIG ─────────────────────────────────────────
// Client ID and Tenant ID are safe to commit (not secrets — no client secret used).
// Delegated auth only: user signs in, tokens are scoped to their own permissions.

export const AUTH = {
  clientId: 'cca66a21-2c5b-455c-bff6-009f2877849c',
  tenantId: 'f7dda424-934f-4492-91d0-9eff9f6b4ff3',
  scopes:   ['Files.ReadWrite.All', 'Sites.ReadWrite.All', 'User.Read'],
}

export const SHAREPOINT = {
  // driveId + fileId — more reliable than file path (no URL encoding issues)
  driveId: 'b!lwSJs3g0SU-eJPxpXLyBQY-LeEFYrGxFj8s5iYGGS57bRR6p1guPRb0ucPoLeK4c',
  fileId:  '017HLDFZY5WPVD5W73ORDJHMBRYCXS4A5O',
}
