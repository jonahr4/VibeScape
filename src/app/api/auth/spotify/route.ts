import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function generateRandomString(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Spotify credentials are not set in environment variables');
  }

  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email playlist-read-private';

  cookies().set('spotify_auth_state', state, { httpOnly: true, path: '/' });

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);

  return NextResponse.redirect(authUrl);
}
