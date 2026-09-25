// Service-credential path for the admin scripts under scripts/*.mjs. These used to log in with
// UMAMI_ADMIN_USERNAME/UMAMI_ADMIN_PASSWORD; that admin account is deleted along with every other
// password-based identity. In its place: a TPC personal access token for a designated TPC Auth
// service account (TPC_SERVICE_PAT), exchanged here for an Umami session token via the same
// user/team sync path the browser flow uses.
import { authenticate, unauthorized } from '@/vendor/tpc-auth';
import { syncUmamiFromTpcContext } from '@/lib/tpc-sync';
import { json } from '@/lib/response';

export const dynamic = 'force-dynamic';

const RESOURCE = (process.env.TPC_RESOURCE || 'https://analytics.theportlandcompany.com').replace(/\/$/, '');
const ISSUER = (process.env.TPC_AUTH_ISSUER || 'https://auth.theportlandcompany.com').replace(/\/$/, '');

export async function POST(request: Request) {
  const ctx = await authenticate(request, { resource: RESOURCE, issuer: ISSUER });

  if (!ctx) {
    return unauthorized(RESOURCE);
  }

  // Only a PAT identifies a script run by a person on purpose; a bare browser access token should
  // not be able to mint admin scripting sessions this way.
  if (ctx.via !== 'pat') {
    return unauthorized(RESOURCE);
  }

  const { user, token } = await syncUmamiFromTpcContext(ctx);

  return json({ token, user: { id: user.id, username: user.username, role: user.role } });
}
