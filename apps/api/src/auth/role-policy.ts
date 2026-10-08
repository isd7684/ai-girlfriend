export const protectedRoleCodes = new Set(['admin_owner', 'web_user'])

export function isProtectedRole(code: string) {
  return protectedRoleCodes.has(code)
}
