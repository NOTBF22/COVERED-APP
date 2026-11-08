import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';

/** Entry: send signed-in users to the app, everyone else to the welcome screen. */
export default function Index() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/welcome" />;
  return <Redirect href={session.role === 'supporter' ? '/discover' : '/bills'} />;
}
