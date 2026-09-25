import type { Metadata } from 'next';
import { LoginPage } from './LoginPage';

export default async function () {
  if (process.env.DISABLE_LOGIN || process.env.CLOUD_MODE || process.env.TPC_AUTH_ENABLED) {
    return null;
  }

  return <LoginPage />;
}

export const metadata: Metadata = {
  title: 'Login',
};
