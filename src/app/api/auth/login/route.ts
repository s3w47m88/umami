import { z } from 'zod';
import { saveAuth } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { secret } from '@/lib/crypto';
import { createSecureToken } from '@/lib/jwt';
import { checkPassword } from '@/lib/password';
import redis from '@/lib/redis';
import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { getAllUserTeams, getUserByUsername } from '@/queries/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Password login is disabled once TPC Auth is the identity provider (see /api/auth/tpc).
  if (process.env.TPC_AUTH_ENABLED) {
    return unauthorized({ code: 'password-login-disabled' });
  }

  const schema = z.object({
    username: z.string(),
    password: z.string(),
  });

  const { body, error } = await parseRequest(request, schema, { skipAuth: true });

  if (error) {
    return error();
  }

  const { username, password } = body;

  const user = await getUserByUsername(username, { includePassword: true });

  if (!user || !checkPassword(password, user.password)) {
    return unauthorized({ code: 'incorrect-username-password' });
  }

  const { id, role, createdAt, requiresPasswordChange } = user;

  let token: string;

  if (redis.enabled) {
    token = await saveAuth({ userId: id, role });
  } else {
    token = createSecureToken({ userId: user.id, role }, secret());
  }

  const teams = await getAllUserTeams(id);

  return json({
    token,
    user: {
      id,
      username,
      role,
      createdAt,
      isAdmin: role === ROLES.admin,
      requiresPasswordChange,
      teams,
    },
  });
}
