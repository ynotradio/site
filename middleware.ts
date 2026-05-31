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

  if (pathname === '/admin/collections/songs') {
    const hasWhere = Array.from(searchParams.keys()).some((k) => k.startsWith('where'));
    if (!hasWhere) {
      const url = request.nextUrl.clone();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setUTCHours(12, 0, 0, 0);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      url.searchParams.set('where[featureOnNewMusic][equals]', 'true');
      url.searchParams.set('where[releaseDate][greater_than_equal]', sixMonthsAgo.toISOString());
      url.searchParams.set('sort', '-releaseDate');
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/admin/collections/posts') {
    const hasWhere = Array.from(searchParams.keys()).some((k) => k.startsWith('where'));
    if (!hasWhere) {
      const url = request.nextUrl.clone();
      const now = new Date();
      now.setUTCHours(12, 0, 0, 0);
      url.searchParams.set('where[or][0][and][0][_status][equals]', 'published');
      url.searchParams.set('where[or][0][and][1][showOnFrontPage][equals]', 'true');
      url.searchParams.set('where[or][0][and][2][endDate][greater_than_equal]', now.toISOString());
      url.searchParams.set('where[or][0][and][3][startDate][less_than_equal]', now.toISOString());
      url.searchParams.set('sort', 'priority');
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/admin/collections/ads') {
    const hasWhere = Array.from(searchParams.keys()).some((k) => k.startsWith('where'));
    if (!hasWhere) {
      const url = request.nextUrl.clone();
      const now = new Date();
      now.setUTCHours(12, 0, 0, 0);
      url.searchParams.set('where[endDate][greater_than_equal]', now.toISOString());
      url.searchParams.set('where[startDate][less_than_equal]', now.toISOString());
      url.searchParams.set('sort', 'priority');
      url.searchParams.set('groupBy', 'startDate');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/collections/shows',
    '/admin/collections/concerts',
    '/admin/collections/songs',
    '/admin/collections/posts',
    '/admin/collections/ads',
  ],
};
