import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Log admin page requests
  if (url.pathname.startsWith('/admin')) {
    // eslint-disable-next-line no-console
    console.log('[Middleware] Admin request:', {
      path: url.pathname,
      method: request.method,
      hasDatabaseUri: !!(process.env.DATABASE_URI || process.env.NEON_DEV_DATABASE_URL),
      hasPayloadSecret: !!process.env.PAYLOAD_SECRET,
    });
  }
  
  return NextResponse.next();
}

// Only run middleware on admin routes
export const config = {
  matcher: '/admin/:path*',
};
