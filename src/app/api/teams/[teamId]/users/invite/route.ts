import { z } from 'zod';
import { ROLES } from '@/lib/constants';
import { uuid } from '@/lib/crypto';
import { hashPassword } from '@/lib/password';
import { parseRequest } from '@/lib/request';
import { badRequest, json, serverError, unauthorized } from '@/lib/response';
import { teamRoleParam } from '@/lib/schema';
import { canUpdateTeam } from '@/permissions';
import {
  createTeamUser,
  createUser,
  getTeam,
  getTeamUser,
  getUserByUsername,
} from '@/queries/prisma';

const DEFAULT_FROM_EMAIL = 'The Portland Company <noreply@theportlandcompany.com>';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Invite email failed.';
}

async function sendInviteEmail({
  to,
  password,
  teamName,
}: {
  to: string;
  password: string;
  teamName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend API key is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to,
      subject: `You have been invited to ${teamName}`,
      text: [
        `You have been invited to ${teamName} in The Portland Company analytics.`,
        '',
        'Sign in at https://analytics.theportlandcompany.com/login',
        `Username: ${to}`,
        `Password: ${password}`,
        '',
        'Change this password after signing in.',
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend failed with ${response.status}: ${message}`);
  }

  return response.json();
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  // Membership is granted in TPC Auth (org membership), not here. Once TPC Auth sign-in is on,
  // this endpoint is dead: point people at the org's access settings in TPC Auth instead.
  if (process.env.TPC_AUTH_ENABLED || process.env.NEXT_PUBLIC_TPC_AUTH_ENABLED) {
    return badRequest({
      message: 'Invites are managed in TPC Auth. Grant access to the organization there instead.',
    });
  }

  const schema = z.object({
    username: z.string().email().max(255),
    password: z.string().min(8).max(255),
    role: teamRoleParam,
    teamIds: z.array(z.uuid()).min(1).optional(),
    sendInviteEmail: z.boolean().optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { teamId } = await params;
  const targetTeamIds = Array.from(new Set([...(body.teamIds || []), teamId]));

  const canUpdateTeams = await Promise.all(
    targetTeamIds.map(targetTeamId => canUpdateTeam(auth, targetTeamId)),
  );

  if (canUpdateTeams.some(canUpdate => !canUpdate)) {
    return unauthorized({ message: 'You must be the owner/manager of every selected team.' });
  }

  const existingUser = await getUserByUsername(body.username);

  const user =
    existingUser ||
    (await createUser({
      id: uuid(),
      username: body.username,
      password: hashPassword(body.password),
      requiresPasswordChange: true,
      role: ROLES.user,
    }));

  const memberships = await Promise.all(
    targetTeamIds.map(async targetTeamId => {
      const teamUser = await getTeamUser(targetTeamId, user.id);

      if (teamUser) {
        return teamUser;
      }

      return createTeamUser(user.id, targetTeamId, body.role);
    }),
  );

  let inviteEmailQueued = false;

  if (body.sendInviteEmail) {
    const team = await getTeam(teamId);
    try {
      await sendInviteEmail({
        to: body.username,
        password: body.password,
        teamName: team?.name || 'The Portland Company analytics',
      });
    } catch (error) {
      console.error('invite-email-failed', {
        message: getErrorMessage(error),
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
      });

      return serverError({ message: getErrorMessage(error) });
    }

    inviteEmailQueued = true;
  }

  return json({
    user,
    memberships,
    inviteEmailQueued,
  });
}
