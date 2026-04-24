import type { Metadata } from 'next';
import { ForcePasswordForm } from './ForcePasswordForm';

export default function ForcePasswordPage() {
  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: 'var(--surface-raised)',
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <ForcePasswordForm />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Change Password',
};
