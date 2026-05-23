import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';

function makeRequest(path: string, search = '') {
  return new NextRequest(`http://localhost${path}${search}`);
}

describe('middleware', () => {
  describe('/admin/collections/shows', () => {
    it('redirects to today-filtered view when no where param', () => {
      const req = makeRequest('/admin/collections/shows');
      const res = middleware(req);

      expect(res).toBeInstanceOf(NextResponse);
      const location = res.headers.get('location')!;
      const url = new URL(location);

      expect(url.pathname).toBe('/admin/collections/shows');
      expect(url.searchParams.get('sort')).toBe('startTime');
      expect(url.searchParams.get('groupBy')).toBe('date');

      const whereKeys = Array.from(url.searchParams.keys()).filter((k) => k.startsWith('where'));
      expect(whereKeys.length).toBeGreaterThan(0);
    });

    it('sets greater_than_equal filter to UTC midnight today', () => {
      const fakeNow = new Date('2026-05-23T15:30:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(fakeNow);

      const req = makeRequest('/admin/collections/shows');
      const res = middleware(req);
      const location = res.headers.get('location')!;
      const url = new URL(location);

      const filterValue = url.searchParams.get('where[or][0][and][0][date][greater_than_equal]');
      expect(filterValue).toBe('2026-05-23T00:00:00.000Z');

      vi.useRealTimers();
    });

    it('passes through when where param is already present', () => {
      const req = makeRequest('/admin/collections/shows', '?where[date][equals]=2026-01-01');
      const res = middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('passes through when where param uses bracket notation', () => {
      const req = makeRequest(
        '/admin/collections/shows',
        '?where[or][0][and][0][date][greater_than_equal]=2026-01-01',
      );
      const res = middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('other paths', () => {
    it('passes through unrelated paths', () => {
      const req = makeRequest('/admin/collections/djs');
      const res = middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('passes through admin root', () => {
      const req = makeRequest('/admin');
      const res = middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });
});
