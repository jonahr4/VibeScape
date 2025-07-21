import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  console.log('=== CALLBACK RECEIVED ===');
  console.log('Code:', !!code);
  console.log('Error:', error);
  
  // Check for errors
  if (error) {
    console.log('OAuth error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=access_denied`);
  }
  
  if (!code) {
    console.log('No authorization code received');
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=no_code`);
  }
  
  // Exchange authorization code for access token
  try {
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful!');
    console.log('Token expires in:', tokenData.expires_in, 'seconds');
    console.log('Access token length:', tokenData.access_token?.length);
    
    // Set the token in an httpOnly cookie for server-side access
    const response = NextResponse.redirect(`${request.nextUrl.origin}/?auth=success&token=${tokenData.access_token}`);
    response.cookies.set('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600, // Use token expiry or default to 1 hour
      path: '/',
    });
    
    console.log('Redirecting with token and cookie set...');
    return response;
    
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=token_exchange_failed`);
  }
}
