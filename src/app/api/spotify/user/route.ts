import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== USER API CALL ===');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })));
    
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    console.log('Access token found:', !!accessToken);
    console.log('Access token length:', accessToken?.length);
    
    // Also check request headers for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    if (!accessToken) {
      console.log('No access token found in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('Making request to Spotify API...');
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    console.log('Spotify API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Spotify API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user info' },
        { status: response.status }
      );
    }
    
    const userData = await response.json();
    console.log('User data fetched successfully for:', userData.display_name);
    
    return NextResponse.json({
      id: userData.id,
      display_name: userData.display_name,
      email: userData.email,
      images: userData.images,
    });
    
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
