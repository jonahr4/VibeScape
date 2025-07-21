import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  console.log('=== SIMPLE CALLBACK ===');
  console.log('Code received:', !!code);
  console.log('Error:', error);
  
  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=access_denied`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=no_code`);
  }
  
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
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=token_exchange_failed`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful!');
    
    // Instead of cookies, let's pass the token in the URL for now
    const redirectUrl = new URL(`${request.nextUrl.origin}/?auth=success`);
    redirectUrl.searchParams.set('token', tokenData.access_token);
    
    return NextResponse.redirect(redirectUrl.toString());
    
  } catch (error) {
    console.error('Error in callback:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=token_exchange_failed`);
  }
}
