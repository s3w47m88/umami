'use client';
import {
  Button,
  Column,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Heading,
  PasswordField,
  Row,
  Text,
} from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginQuery, useMessages, useUpdateQuery } from '@/components/hooks';
import { removeClientAuthToken } from '@/lib/client';
import { ROLES } from '@/lib/constants';
import { setUser } from '@/store/app';

export function ForcePasswordForm() {
  const router = useRouter();
  const { user } = useLoginQuery();
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending } = useUpdateQuery('/me/password');

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.requiresPasswordChange) {
      router.replace('/');
    }
  }, [router, user]);

  const samePassword = (value: string, values: Record<string, any>) => {
    if (value !== values.newPassword) {
      return t(messages.noMatchPassword);
    }
    return true;
  };

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async updatedUser => {
        setUser({
          ...user,
          ...updatedUser,
          isAdmin: updatedUser.role === ROLES.admin,
          requiresPasswordChange: false,
        });
        router.push('/');
      },
    });
  };

  const handleLogout = () => {
    removeClientAuthToken();
    setUser(null);
    router.push('/logout');
  };

  return (
    <Column justifyContent="center" alignItems="center" gap="6">
      <Column alignItems="center" gap="2">
        <Heading>{t(labels.changePassword)}</Heading>
        <Text color="muted" size="sm">
          Change the temporary password before continuing.
        </Text>
      </Column>
      <Form onSubmit={handleSubmit} error={getErrorMessage(error)} style={{ minWidth: 320 }}>
        <FormField
          label={t(labels.currentPassword)}
          name="currentPassword"
          rules={{ required: t(labels.required) }}
        >
          <PasswordField autoComplete="current-password" />
        </FormField>
        <FormField
          name="newPassword"
          label={t(labels.newPassword)}
          rules={{
            required: t(labels.required),
            minLength: { value: 8, message: t(messages.minPasswordLength, { n: '8' }) },
          }}
        >
          <PasswordField autoComplete="new-password" />
        </FormField>
        <FormField
          name="confirmPassword"
          label={t(labels.confirmPassword)}
          rules={{
            required: t(labels.required),
            minLength: { value: 8, message: t(messages.minPasswordLength, { n: '8' }) },
            validate: samePassword,
          }}
        >
          <PasswordField autoComplete="confirm-password" />
        </FormField>
        <FormButtons>
          <Button isDisabled={isPending} onPress={handleLogout}>
            {t(labels.logout)}
          </Button>
          <Row grow justifyContent="flex-end">
            <FormSubmitButton variant="primary" isDisabled={isPending}>
              {t(labels.save)}
            </FormSubmitButton>
          </Row>
        </FormButtons>
      </Form>
    </Column>
  );
}
