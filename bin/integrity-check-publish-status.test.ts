import { describe, it, expect } from 'vitest';
import {
  isMysqlRecordLive,
  resolvePostLegacyId,
} from './integrity-check-publish-status-utils';

describe('isMysqlRecordLive', () => {
  it('returns true for "n"', () => {
    expect(isMysqlRecordLive('n')).toBe(true);
  });

  it('returns true for "N"', () => {
    expect(isMysqlRecordLive('N')).toBe(true);
  });

  it('returns true for "no"', () => {
    expect(isMysqlRecordLive('no')).toBe(true);
  });

  it('returns true for "No"', () => {
    expect(isMysqlRecordLive('No')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isMysqlRecordLive('')).toBe(true);
  });

  it('returns true for null', () => {
    expect(isMysqlRecordLive(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isMysqlRecordLive(undefined)).toBe(true);
  });

  it('returns false for "y"', () => {
    expect(isMysqlRecordLive('y')).toBe(false);
  });

  it('returns false for "Y"', () => {
    expect(isMysqlRecordLive('Y')).toBe(false);
  });

  it('returns false for "yes"', () => {
    expect(isMysqlRecordLive('yes')).toBe(false);
  });

  it('returns false for "Yes"', () => {
    expect(isMysqlRecordLive('Yes')).toBe(false);
  });

  it('trims whitespace before comparing', () => {
    expect(isMysqlRecordLive('  y  ')).toBe(false);
    expect(isMysqlRecordLive('  n  ')).toBe(true);
  });
});

describe('resolvePostLegacyId', () => {
  it('returns stories table for legacyId < 10000', () => {
    expect(resolvePostLegacyId(42)).toEqual({ table: 'stories', mysqlId: 42 });
  });

  it('returns stories table for legacyId of 1', () => {
    expect(resolvePostLegacyId(1)).toEqual({ table: 'stories', mysqlId: 1 });
  });

  it('returns stories table for legacyId of 9999', () => {
    expect(resolvePostLegacyId(9999)).toEqual({ table: 'stories', mysqlId: 9999 });
  });

  it('returns custom_texts table for legacyId >= 10000', () => {
    expect(resolvePostLegacyId(10001)).toEqual({ table: 'custom_texts', mysqlId: 1 });
  });

  it('returns custom_texts table for legacyId of 10000', () => {
    expect(resolvePostLegacyId(10000)).toEqual({ table: 'custom_texts', mysqlId: 0 });
  });

  it('returns custom_texts table for legacyId of 10042', () => {
    expect(resolvePostLegacyId(10042)).toEqual({ table: 'custom_texts', mysqlId: 42 });
  });
});
