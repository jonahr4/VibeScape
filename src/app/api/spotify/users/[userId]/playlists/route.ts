import { NextResponse } from 'next/server';
import { getUserPublicPlaylistsWithTracks } from '@/services/spotify';

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    const list = await getUserPublicPlaylistsWithTracks(params.userId);
    return NextResponse.json({ playlists: list });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch user playlists' }, { status: 500 });
  }
}

