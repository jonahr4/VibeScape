import { NextResponse, type NextRequest } from 'next/server';

// This middleware is now disabled and allows all requests to pass through.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // The matcher is empty, so this middleware will not run on any path.
  ],
};
