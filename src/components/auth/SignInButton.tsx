"use client";

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignInButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Button variant="outline" size="sm" disabled>Loading…</Button>;
  }

  if (!session) {
    return (
      <Button size="sm" onClick={() => signIn('spotify')}>Sign in with Spotify</Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{session.user?.name ?? 'Signed in'}</span>
      <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
    </div>
  );
}

