import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  const { pathname } = request.nextUrl;

  // Allow requests to /login and the spotify auth callback to proceed without a token
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth/spotify')) {
    // If the user is already logged in and tries to access /login, redirect them to home
    if (accessToken && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If there's no access token, redirect to the login page
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};