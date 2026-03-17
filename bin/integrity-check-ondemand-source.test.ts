import { describe, it, expect } from 'vitest';
import { mapMysqlSourceToPayload } from './integrity-check-ondemand-source-utils';

describe('mapMysqlSourceToPayload', () => {
  it('maps "opendrive" to "opendrive"', () => {
    expect(mapMysqlSourceToPayload('opendrive')).toBe('opendrive');
  });

  it('maps "OpenDrive" (mixed case) to "opendrive"', () => {
    expect(mapMysqlSourceToPayload('OpenDrive')).toBe('opendrive');
  });

  it('maps "soundcloud" to "soundcloud"', () => {
    expect(mapMysqlSourceToPayload('soundcloud')).toBe('soundcloud');
  });

  it('maps "SoundCloud" (mixed case) to "soundcloud"', () => {
    expect(mapMysqlSourceToPayload('SoundCloud')).toBe('soundcloud');
  });

  it('maps "4shared" to "other"', () => {
    expect(mapMysqlSourceToPayload('4shared')).toBe('other');
  });

  it('maps empty string to "other"', () => {
    expect(mapMysqlSourceToPayload('')).toBe('other');
  });

  it('maps null to "other"', () => {
    expect(mapMysqlSourceToPayload(null)).toBe('other');
  });

  it('maps undefined to "other"', () => {
    expect(mapMysqlSourceToPayload(undefined)).toBe('other');
  });

  it('maps unknown value to "other"', () => {
    expect(mapMysqlSourceToPayload('youtube')).toBe('other');
  });

  it('trims whitespace before matching', () => {
    expect(mapMysqlSourceToPayload('  opendrive  ')).toBe('opendrive');
  });
});
