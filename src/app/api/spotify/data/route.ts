import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPlaylistsWithTracks, getAllSongsFromPlaylists, getPlaylistsWithTracksUsingToken } from '@/services/spotify';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching Spotify data...');
    
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.replace('Bearer ', '');
    
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('spotify_access_token')?.value;
    
    const accessToken = tokenFromHeader || tokenFromCookie;
    
    console.log('API: Token from header:', !!tokenFromHeader);
    console.log('API: Token from cookie:', !!tokenFromCookie);
    console.log('API: Using token:', !!accessToken);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Temporarily set the token in a way the service can access it
    // We'll create a modified version that accepts the token directly
    const playlists = await getPlaylistsWithTracksUsingToken(accessToken);
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
