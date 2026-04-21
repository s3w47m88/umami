import {
  Button,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Input,
  ListItem,
  Select,
} from '@umami/react-zen';
import { useMessages, useUpdateQuery } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { useState } from 'react';

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
  const { mutateAsync: addMember, error: addError, isPending } = useUpdateQuery(`/teams/${teamId}/users`);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setCreateError(null);

    try {
      // First, create the user
      const createResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password, role: ROLES.user }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const newUser = await createResponse.json();

      // Then, add to team
      await addMember({ userId: newUser.id, role: data.role }, {
        onSuccess: async () => {
          onSave?.();
          onClose?.();
        },
      });
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  };

  const renderRole = (roleValue) => {
    switch (roleValue) {
      case ROLES.teamManager:
        return t(labels.manager);
      case ROLES.teamMember:
        return t(labels.member);
      case ROLES.teamViewOnly:
        return t(labels.viewOnly);
    }
  };

  return (
    <Form onSubmit={handleSubmit} error={createError || getErrorMessage(addError)}>
      <FormField name="username" label={t(labels.username)} rules={{ required: 'Required' }}>
        <Input
          type="email"
          placeholder="user@example.com"
        />
      </FormField>
      <FormField name="password" label={t(labels.password)} rules={{ required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } }}>
        <Input
          type="password"
        />
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
      <FormButtons>
        <Button isDisabled={isPending} onPress={onClose}>
          {t(labels.cancel)}
        </Button>
        <FormSubmitButton variant="primary" isDisabled={isPending}>
          {t('Invite')}
        </FormSubmitButton>
      </FormButtons>
    </Form>
  );
}