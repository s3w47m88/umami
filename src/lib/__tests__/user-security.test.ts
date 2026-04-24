import { getPostLoginPath, shouldForcePasswordChange } from '@/lib/user-security';

describe('user security helpers', () => {
  test('routes temporary-password users to forced password change', () => {
    expect(getPostLoginPath({ requiresPasswordChange: true })).toBe('/force-password');
  });

  test('routes normal users to the app root', () => {
    expect(getPostLoginPath({ requiresPasswordChange: false })).toBe('/');
    expect(getPostLoginPath()).toBe('/');
  });

  test('forces password change when an admin sets a password', () => {
    expect(shouldForcePasswordChange('temp-password')).toBe(true);
    expect(shouldForcePasswordChange('')).toBe(false);
    expect(shouldForcePasswordChange()).toBe(false);
  });
});
