jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    client: {
      share: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
    getSearchParameters: jest.fn().mockReturnValue({}),
    pagedQuery: jest.fn().mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      pageSize: 100,
      orderBy: 'name',
      search: '',
    }),
  },
}));

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    client: {
      set: jest.fn(),
      del: jest.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';
import { getAllUserWebsitesIncludingTeamOwner } from '../website';

describe('getAllUserWebsitesIncludingTeamOwner', () => {
  test('includes websites for any team membership, not only team owners', async () => {
    await getAllUserWebsitesIncludingTeamOwner('user-1');

    expect(prisma.pagedQuery).toHaveBeenCalled();

    const [, criteria] = (prisma.pagedQuery as jest.Mock).mock.calls[0];
    const membershipFilter = criteria.where.OR[1].team.members.some;

    expect(membershipFilter).toEqual({ userId: 'user-1' });
    expect(membershipFilter.role).toBeUndefined();
  });
});
