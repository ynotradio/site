import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/admin/collections/shows') {
    const hasWhere = Array.from(searchParams.keys()).some((k) => k.startsWith('where'));
    if (!hasWhere) {
      const url = request.nextUrl.clone();
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      url.searchParams.set('where[or][0][and][0][date][greater_than_equal]', today.toISOString());
      url.searchParams.set('sort', 'startTime');
      url.searchParams.set('groupBy', 'date');
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/admin/collections/concerts') {
    const hasWhere = Array.from(searchParams.keys()).some((k) => k.startsWith('where'));
    if (!hasWhere) {
      const url = request.nextUrl.clone();
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      url.searchParams.set('where[or][0][and][0][date][greater_than_equal]', today.toISOString());
      url.searchParams.set('sort', 'date');
      url.searchParams.set('groupBy', 'date');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/collections/shows', '/admin/collections/concerts'],
};
