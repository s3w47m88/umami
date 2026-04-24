export function getInviteFormDefaults() {
  return {
    role: 'team-member',
    sendInviteEmail: 'true',
  };
}

export function getInviteTeamIds(teamId: string, selectedTeamIds?: string[]) {
  return selectedTeamIds && selectedTeamIds.length > 0 ? selectedTeamIds : [teamId];
}

export function shouldSendInviteEmail(value?: string) {
  return value === 'true';
}
