import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Spotify configuration' },
      { status: 500 }
    );
  }

  // Generate a simple state for security
  const state = Math.random().toString(36).substring(2, 15);
  
  console.log('=== INITIATING OAUTH ===');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  console.log('State:', state);
  
  const authUrl = `https://accounts.spotify.com/authorize?` +
    new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'playlist-read-private playlist-read-collaborative user-read-private',
      redirect_uri: redirectUri,
      // Removing state for development to avoid mismatch issues
      // state: state,
    }).toString();
  
  console.log('Redirecting to:', authUrl);
  
  return NextResponse.redirect(authUrl);
}
