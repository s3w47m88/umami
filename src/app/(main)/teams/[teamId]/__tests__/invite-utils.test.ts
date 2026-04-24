import {
  getInviteFormDefaults,
  getInviteTeamIds,
  shouldSendInviteEmail,
} from '../invite-utils';

describe('invite utils', () => {
  test('uses send-email and team-member defaults', () => {
    expect(getInviteFormDefaults()).toEqual({
      role: 'team-member',
      sendInviteEmail: 'true',
    });
  });

  test('falls back to current team when no additional team ids are selected', () => {
    expect(getInviteTeamIds('team-1')).toEqual(['team-1']);
    expect(getInviteTeamIds('team-1', [])).toEqual(['team-1']);
    expect(getInviteTeamIds('team-1', ['team-2'])).toEqual(['team-2']);
  });

  test('parses send invite email toggle values', () => {
    expect(shouldSendInviteEmail('true')).toBe(true);
    expect(shouldSendInviteEmail('false')).toBe(false);
    expect(shouldSendInviteEmail()).toBe(false);
  });
});
