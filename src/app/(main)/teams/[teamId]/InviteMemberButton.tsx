import { Button, Dialog, DialogTrigger, Icon, Modal, Text, useToast } from '@umami/react-zen';
import { useMessages, useModified } from '@/components/hooks';
import { UserPlus } from '@/components/icons';
import { InviteMemberForm } from './InviteMemberForm';

export function InviteMemberButton({ teamId, onSave }: { teamId: string; onSave?: () => void }) {
  const { t, messages } = useMessages();
  const { toast } = useToast();
  const { touch } = useModified();

  const handleSave = async () => {
    toast(t(messages.saved));
    touch('teams:members');
    onSave?.();
  };

  return (
    <DialogTrigger>
      <Button>
        <Icon>
          <UserPlus />
        </Icon>
        <Text>{t('Invite / Create Member')}</Text>
      </Button>
      <Modal>
        <Dialog title={t('Invite / Create Member')} style={{ width: 480 }}>
          {({ close }) => <InviteMemberForm teamId={teamId} onSave={handleSave} onClose={close} />}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
