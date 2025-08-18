"use client";

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const name = session.user?.name ?? 'User';
  const image = session.user?.image ?? undefined;
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={image} alt={name} />
        <AvatarFallback>{initials || 'U'}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">{name}</span>
      <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
    </div>
  );
}
