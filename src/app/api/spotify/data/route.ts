import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPlaylistsWithTracks, getAllSongsFromPlaylists } from '@/services/spotify';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching Spotify data...');
    
    // Debug: Check what cookies we have
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('API: Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    const spotifyToken = cookieStore.get('spotify_access_token');
    console.log('API: Spotify token found:', !!spotifyToken?.value);
    
    const playlists = await getPlaylistsWithTracks();
    console.log('API: Got playlists:', playlists.length);
    
    const songs = await getAllSongsFromPlaylists(playlists);
    console.log('API: Got songs:', songs.length);
    
    return NextResponse.json({
      playlists,
      songs,
    });
    
  } catch (error: any) {
    console.error('API Error fetching Spotify data:', error);
    
    if (error.message.includes('No valid Spotify access token')) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify. Please sign in.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Spotify data' },
      { status: 500 }
    );
  }
}
