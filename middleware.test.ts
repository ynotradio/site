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

    it('sets greater_than_equal filter to noon UTC on the Eastern calendar day', () => {
      // Shows are stored at noon UTC (normalizeFieldToNoon), so the boundary
      // has to be noon UTC too for today's shows to survive the filter.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-23T15:30:00Z'));

      const req = makeRequest('/admin/collections/shows');
      const res = middleware(req);
      const url = new URL(res.headers.get('location')!);

      const filterValue = url.searchParams.get('where[or][0][and][0][date][greater_than_equal]');
      expect(filterValue).toBe('2026-05-23T12:00:00.000Z');

      vi.useRealTimers();
    });

    it('does not skip a day when UTC has rolled over but Eastern has not', () => {
      // 01:00Z is 9:00pm the previous day in Philadelphia — still "today" for
      // the station, so today's shows must stay in the list.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-24T01:00:00Z'));

      const req = makeRequest('/admin/collections/shows');
      const res = middleware(req);
      const url = new URL(res.headers.get('location')!);

      const filterValue = url.searchParams.get('where[or][0][and][0][date][greater_than_equal]');
      expect(filterValue).toBe('2026-05-23T12:00:00.000Z');

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

  describe('other date-filtered collections', () => {
    const eveningInEastern = new Date('2026-05-24T01:00:00Z'); // 2026-05-23 9:00pm ET

    it('anchors the concerts filter to the Eastern day at noon UTC', () => {
      vi.useFakeTimers();
      vi.setSystemTime(eveningInEastern);

      const url = new URL(
        middleware(makeRequest('/admin/collections/concerts')).headers.get('location')!,
      );

      expect(url.searchParams.get('where[or][0][and][0][date][greater_than_equal]')).toBe(
        '2026-05-23T12:00:00.000Z',
      );

      vi.useRealTimers();
    });

    it('anchors the posts window to the Eastern day at noon UTC', () => {
      vi.useFakeTimers();
      vi.setSystemTime(eveningInEastern);

      const url = new URL(
        middleware(makeRequest('/admin/collections/posts')).headers.get('location')!,
      );

      expect(url.searchParams.get('where[or][0][and][2][endDate][greater_than_equal]')).toBe(
        '2026-05-23T12:00:00.000Z',
      );
      expect(url.searchParams.get('where[or][0][and][3][startDate][less_than_equal]')).toBe(
        '2026-05-23T12:00:00.000Z',
      );

      vi.useRealTimers();
    });

    it('anchors the ads window to the Eastern day at noon UTC', () => {
      vi.useFakeTimers();
      vi.setSystemTime(eveningInEastern);

      const url = new URL(
        middleware(makeRequest('/admin/collections/ads')).headers.get('location')!,
      );

      expect(url.searchParams.get('where[endDate][greater_than_equal]')).toBe(
        '2026-05-23T12:00:00.000Z',
      );
      expect(url.searchParams.get('where[startDate][less_than_equal]')).toBe(
        '2026-05-23T12:00:00.000Z',
      );

      vi.useRealTimers();
    });

    it('anchors the songs lookback six months before the Eastern day', () => {
      vi.useFakeTimers();
      vi.setSystemTime(eveningInEastern);

      const url = new URL(
        middleware(makeRequest('/admin/collections/songs')).headers.get('location')!,
      );

      expect(url.searchParams.get('where[releaseDate][greater_than_equal]')).toBe(
        '2025-11-23T12:00:00.000Z',
      );

      vi.useRealTimers();
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
