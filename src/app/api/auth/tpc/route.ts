// TPC Auth OIDC callback. The Worker in front sends /login to TPC Auth's /oauth/authorize (with
// PKCE) and sets the tpc_oauth_state / tpc_oauth_verifier cookies; TPC Auth redirects the browser
// back here with ?code&state. This route exchanges the code, verifies the resulting access token,
// syncs the Umami user + team rows from the TPC identity (see @/lib/tpc-sync), and redirects
// through /sso so the browser picks up an Umami session token the same way every other Umami
// session is established.
import { oidc, verifyAccessToken, contextFromClaims } from '@/vendor/tpc-auth';
import { syncUmamiFromTpcContext } from '@/lib/tpc-sync';

export const dynamic = 'force-dynamic';

const ISSUER = (process.env.TPC_AUTH_ISSUER || 'https://auth.theportlandcompany.com').replace(/\/$/, '');
const CLIENT_ID = process.env.TPC_CLIENT_ID || 'tpc-analytics-umami';
const RESOURCE = (process.env.TPC_RESOURCE || 'https://analytics.theportlandcompany.com').replace(/\/$/, '');
// The container sees the Worker's internal URL, not the public one, so request.url's origin can't
// build the redirect_uri (TPC Auth matches it exactly against the one the Worker sent).
const PUBLIC_ORIGIN = new URL(process.env.TPC_PUBLIC_ORIGIN || RESOURCE).origin;

function readCookie(request: Request, name: string): string | null {
  const match = (request.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request, 'tpc_oauth_state');
  const verifier = readCookie(request, 'tpc_oauth_verifier');
  const next = readCookie(request, 'tpc_oauth_next') || '/';

  const clearedCookies = [
    clearCookie('tpc_oauth_state'),
    clearCookie('tpc_oauth_verifier'),
    clearCookie('tpc_oauth_next'),
  ];

  if (!code || !state || !verifier || !expectedState || state !== expectedState) {
    return new Response('TPC Auth sign-in failed: missing or mismatched state.', {
      status: 400,
      headers: buildHeaders(clearedCookies),
    });
  }

  let tokens;

  try {
    tokens = await oidc.exchangeCode({
      issuer: ISSUER,
      clientId: CLIENT_ID,
      redirectUri: `${PUBLIC_ORIGIN}/api/auth/tpc`,
      code,
      codeVerifier: verifier,
      resource: RESOURCE,
    });
  } catch (error) {
    console.error(JSON.stringify({ route: 'tpc-auth-callback', error: String(error) }));
    return new Response('TPC Auth sign-in failed: code exchange rejected.', {
      status: 401,
      headers: buildHeaders(clearedCookies),
    });
  }

  let ctx;

  try {
    const claims = await verifyAccessToken(tokens.access_token, { resource: RESOURCE, issuer: ISSUER });
    ctx = contextFromClaims(claims, 'jwt');
  } catch (error) {
    console.error(JSON.stringify({ route: 'tpc-auth-callback', error: String(error) }));
    return new Response('TPC Auth sign-in failed: token verification failed.', {
      status: 401,
      headers: buildHeaders(clearedCookies),
    });
  }

  const { token } = await syncUmamiFromTpcContext(ctx);

  const redirectUrl = new URL('/sso', PUBLIC_ORIGIN);
  redirectUrl.searchParams.set('token', token);
  redirectUrl.searchParams.set('next', next);

  return new Response(null, {
    status: 302,
    headers: buildHeaders(clearedCookies, redirectUrl.toString()),
  });
}

function buildHeaders(cookies: string[], location?: string) {
  const headers = new Headers({ 'cache-control': 'no-store' });
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  if (location) headers.set('location', location);
  return headers;
}
