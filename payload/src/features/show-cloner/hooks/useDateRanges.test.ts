import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRanges } from './useDateRanges';

// Wednesday 2024-01-17: currentMonday = 2024-01-15, lastWeekMonday = 2024-01-08,
// lastWeekSunday = 2024-01-14, nextMonday = 2024-01-22
const MOCK_TODAY = new Date('2024-01-17T12:00:00.000');

describe('useDateRanges', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes sourceStartDate to last week Monday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    expect(result.current.sourceStartDate).toBe('2024-01-08');
  });

  it('initializes sourceEndDate to last week Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    expect(result.current.sourceEndDate).toBe('2024-01-14');
  });

  it('initializes targetStartDate to next Monday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    expect(result.current.targetStartDate).toBe('2024-01-22');
  });

  it('computes targetEndDate from initial state (6-day range → nextMonday + 6)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    // sourceStart=Jan 8, sourceEnd=Jan 14 → diff=6 days; target=Jan 22 + 6 = Jan 28
    expect(result.current.targetEndDate).toBe('2024-01-28');
  });

  it('updates sourceStartDate via setter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setSourceStartDate('2024-02-01'); });
    expect(result.current.sourceStartDate).toBe('2024-02-01');
  });

  it('updates sourceEndDate via setter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setSourceEndDate('2024-02-07'); });
    expect(result.current.sourceEndDate).toBe('2024-02-07');
  });

  it('updates targetStartDate via setter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setTargetStartDate('2024-03-01'); });
    expect(result.current.targetStartDate).toBe('2024-03-01');
  });

  it('recomputes targetEndDate when dates change', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    // Set a 2-day source range, target starting Mar 10 → target ends Mar 12
    act(() => {
      result.current.setSourceStartDate('2024-01-15');
      result.current.setSourceEndDate('2024-01-17');
      result.current.setTargetStartDate('2024-03-10');
    });
    expect(result.current.targetEndDate).toBe('2024-03-12');
  });

  it('returns empty targetEndDate when sourceStartDate is empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setSourceStartDate(''); });
    expect(result.current.targetEndDate).toBe('');
  });

  it('returns empty targetEndDate when sourceEndDate is empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setSourceEndDate(''); });
    expect(result.current.targetEndDate).toBe('');
  });

  it('returns empty targetEndDate when targetStartDate is empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
    const { result } = renderHook(() => useDateRanges());
    act(() => { result.current.setTargetStartDate(''); });
    expect(result.current.targetEndDate).toBe('');
  });

  it('initializes correctly when today is a Monday', () => {
    vi.useFakeTimers();
    // Monday 2024-01-22: currentMonday = 2024-01-22, lastWeekMonday = 2024-01-15,
    // lastWeekSunday = 2024-01-21, nextMonday = 2024-01-29
    vi.setSystemTime(new Date('2024-01-22T12:00:00.000'));
    const { result } = renderHook(() => useDateRanges());
    expect(result.current.sourceStartDate).toBe('2024-01-15');
    expect(result.current.sourceEndDate).toBe('2024-01-21');
    expect(result.current.targetStartDate).toBe('2024-01-29');
    expect(result.current.targetEndDate).toBe('2024-02-04');
  });

  it('initializes correctly when today is a Sunday', () => {
    vi.useFakeTimers();
    // Sunday 2024-01-21: diff = 0-6 = -6, currentMonday = 2024-01-15
    // lastWeekMonday = 2024-01-08, lastWeekSunday = 2024-01-14, nextMonday = 2024-01-22
    vi.setSystemTime(new Date('2024-01-21T12:00:00.000'));
    const { result } = renderHook(() => useDateRanges());
    expect(result.current.sourceStartDate).toBe('2024-01-08');
    expect(result.current.sourceEndDate).toBe('2024-01-14');
    expect(result.current.targetStartDate).toBe('2024-01-22');
  });
});
