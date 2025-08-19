import { NextResponse } from 'next/server';
import { addTracksToPlaylist, createPlaylistForCurrentUser } from '@/services/spotify';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name: string = body?.name;
    const isPublic: boolean = !!body?.isPublic;
    const trackIds: string[] = Array.isArray(body?.trackIds) ? body.trackIds : [];
    if (!name || trackIds.length === 0) {
      return NextResponse.json({ error: 'Missing name or trackIds' }, { status: 400 });
    }
    // Create playlist
    const { id } = await createPlaylistForCurrentUser(name, isPublic, 'Created by VibeScape');
    // Add tracks
    await addTracksToPlaylist(id, trackIds);
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to create playlist' }, { status: 500 });
  }
}

