export function getPostLoginPath(user?: { requiresPasswordChange?: boolean } | null) {
  return user?.requiresPasswordChange ? '/force-password' : '/';
}

export function shouldForcePasswordChange(password?: string | null) {
  return Boolean(password);
}
