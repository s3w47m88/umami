import {
  Button,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  ListItem,
  PasswordField,
  Select,
  Text,
  TextField,
} from '@umami/react-zen';
import { useState } from 'react';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useApi, useMessages, useTeamsQuery } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { getInviteFormDefaults, getInviteTeamIds, shouldSendInviteEmail } from './invite-utils';

const roles = [ROLES.teamManager, ROLES.teamMember, ROLES.teamViewOnly];

export function InviteMemberForm({
  teamId,
  onSave,
  onClose,
}: {
  teamId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { t, labels, getErrorMessage } = useMessages();
  const { post } = useApi();
  const { data: teams, isLoading: isTeamsLoading } = useTeamsQuery({ pageSize: 100 });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([teamId]);

  const handleSubmit = async (data: any) => {
    setCreateError(null);
    setIsSaving(true);

    try {
      await post(`/teams/${teamId}/users/invite`, {
        username: data.username,
        password: data.password,
        role: data.role,
        teamIds: getInviteTeamIds(teamId, selectedTeamIds),
        sendInviteEmail: shouldSendInviteEmail(data.sendInviteEmail),
      });

      onSave?.();
      onClose?.();
    } catch (error) {
      setCreateError(getErrorMessage(error instanceof Error ? error : String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const renderRole = roleValue => {
    switch (roleValue) {
      case ROLES.teamManager:
        return t(labels.manager);
      case ROLES.teamMember:
        return t(labels.member);
      case ROLES.teamViewOnly:
        return t(labels.viewOnly);
    }
  };

  const renderTeams = (values: string[]) => {
    if (values.length === 0) {
      return t('Select teams');
    }

    const names = values
      .map(value => teams?.data?.find(({ id }) => id === value)?.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : values.join(', ');
  };

  return (
    <Form
      onSubmit={handleSubmit}
      error={createError}
      values={getInviteFormDefaults()}
    >
      <FormField name="username" label={t(labels.username)} rules={{ required: 'Required' }}>
        <TextField />
      </FormField>
      <FormField
        name="password"
        label={t(labels.password)}
        rules={{ required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } }}
      >
        <PasswordField />
      </FormField>
      <FormField name="sendInviteEmail" label={t('Send invite email')}>
        <Select>
          <ListItem id="false">{t('Do not send email')}</ListItem>
          <ListItem id="true">{t('Send invite email')}</ListItem>
        </Select>
      </FormField>
      <FormField name="role" label={t(labels.role)} rules={{ required: 'Required' }}>
        <Select renderValue={value => renderRole(value)}>
          {roles.map(value => (
            <ListItem key={value} id={value}>
              {renderRole(value)}
            </ListItem>
          ))}
        </Select>
      </FormField>
      <FormField name="teamIds" label={t(labels.teams)}>
        <MultiSelect
          value={selectedTeamIds}
          onChange={setSelectedTeamIds}
          placeholder={isTeamsLoading ? t('Loading...') : t('Select teams')}
          renderValue={renderTeams}
        >
          {teams?.data?.map(({ id, name }) => (
            <ListItem key={id} id={id}>
              {name}
            </ListItem>
          ))}
        </MultiSelect>
        <Text color="muted" size="sm">
          {t('Invite email sends through Resend when selected.')}
        </Text>
      </FormField>
      <FormButtons>
        <Button isDisabled={isSaving} onPress={onClose}>
          {t(labels.cancel)}
        </Button>
        <FormSubmitButton variant="primary" isDisabled={isSaving}>
          {t('Create member')}
        </FormSubmitButton>
      </FormButtons>
    </Form>
  );
}
