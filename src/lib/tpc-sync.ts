// Umami has no identity of its own once TPC Auth is wired up: this module is the single place
// that turns a verified TPC AuthContext into an Umami user + team-membership row set, and mints
// the short-lived Umami session token the rest of the app already understands.
import { ROLES } from '@/lib/constants';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';
import { saveAuth } from '@/lib/auth';
import { createSecureToken } from '@/lib/jwt';
import { secret } from '@/lib/crypto';
import redis from '@/lib/redis';
import type { AuthContext, OrgClaim } from '@/vendor/tpc-auth';

// TPC org role -> Umami team role. TPC ranks viewer < member < manager < admin < owner.
function mapTeamRole(role: OrgClaim['role']): string {
  switch (role) {
    case 'owner':
      return ROLES.teamOwner;
    case 'admin':
    case 'manager':
      return ROLES.teamManager;
    case 'member':
      return ROLES.teamMember;
    default:
      return ROLES.teamViewOnly;
  }
}

async function upsertUser(ctx: AuthContext) {
  const existing = await prisma.client.user.findFirst({
    where: { tpcSub: ctx.sub, deletedAt: null },
  });

  if (existing) {
    if (ctx.email && existing.username !== ctx.email) {
      return prisma.client.user.update({
        where: { id: existing.id },
        data: { username: ctx.email, displayName: ctx.name ?? existing.displayName },
      });
    }
    return existing;
  }

  // No local row yet for this tpc_sub. Match by email once (identity-link style), then adopt it;
  // otherwise create a fresh, password-less Umami user that is only ever reachable via TPC Auth.
  const byEmail = ctx.email
    ? await prisma.client.user.findFirst({ where: { username: ctx.email, deletedAt: null } })
    : null;

  if (byEmail) {
    return prisma.client.user.update({
      where: { id: byEmail.id },
      data: { tpcSub: ctx.sub, displayName: ctx.name ?? byEmail.displayName },
    });
  }

  return prisma.client.user.create({
    data: {
      id: uuid(),
      username: ctx.email ?? ctx.sub,
      // Umami's schema requires a password column; TPC-managed users never authenticate with it
      // (native login is disabled), so this is an unusable random value, not a real credential.
      password: uuid(),
      role: ROLES.user,
      displayName: ctx.name ?? null,
      tpcSub: ctx.sub,
    },
  });
}

async function upsertTeamForOrg(org: OrgClaim) {
  const existing = await prisma.client.team.findFirst({ where: { tpcOrgId: org.id } });

  if (existing) {
    if (existing.name !== org.name) {
      return prisma.client.team.update({ where: { id: existing.id }, data: { name: org.name } });
    }
    return existing;
  }

  return prisma.client.team.create({
    data: {
      id: uuid(),
      name: org.name,
      tpcOrgId: org.id,
    },
  });
}

async function upsertMembership(userId: string, teamId: string, role: string) {
  const existing = await prisma.client.teamUser.findFirst({ where: { userId, teamId } });

  if (existing) {
    if (existing.role !== role) {
      return prisma.client.teamUser.update({ where: { id: existing.id }, data: { role } });
    }
    return existing;
  }

  return prisma.client.teamUser.create({
    data: { id: uuid(), userId, teamId, role },
  });
}

/**
 * Create/update the Umami user for a verified TPC identity, map every TPC org the person belongs
 * to onto an Umami team keyed by tpc_org_id, and mint an Umami session token for them.
 */
export async function syncUmamiFromTpcContext(ctx: AuthContext) {
  const user = await upsertUser(ctx);

  for (const org of ctx.orgs ?? []) {
    const team = await upsertTeamForOrg(org);
    await upsertMembership(user.id, team.id, mapTeamRole(org.role));
  }

  const token = redis.enabled
    ? await saveAuth({ userId: user.id, role: user.role })
    : createSecureToken({ userId: user.id, role: user.role }, secret());

  return { user, token };
}
