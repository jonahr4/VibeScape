import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code') || null;
  const state = searchParams.get('state') || null;
  const storedState = cookies().get('spotify_auth_state')?.value || null;

  if (state === null || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  cookies().delete('spotify_auth_state');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Spotify credentials are not fully set in environment variables.');
    return NextResponse.redirect(new URL('/login?error=config_error', req.url));
  }

  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: new URLSearchParams({
      code: code!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }),
  };

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify token error:', data);
      const errorMessage = data.error_description || data.error || 'invalid_token';
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, req.url));
    }

    const { access_token, refresh_token, expires_in } = data;

    cookies().set('spotify_access_token', access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: expires_in });
    cookies().set('spotify_refresh_token', refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
    
    // Redirect to the main page after successful login
    return NextResponse.redirect(new URL('/', req.url));

  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', req.url));
  }
}
