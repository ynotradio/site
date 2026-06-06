import { describe, expect, it } from 'vitest';
import { APIError } from 'payload';
import {
  assertPublishedContestImmutability,
  buildCsv,
  parseTop11Id,
  validateTop11StatusTransition,
} from './utils';

describe('top11 utils', () => {
  it('parses positive ids', () => {
    expect(parseTop11Id('7')).toBe(7);
  });

  it('throws for invalid ids', () => {
    expect(() => parseTop11Id('abc')).toThrow(APIError);
    expect(() => parseTop11Id('0')).toThrow(APIError);
  });

  it('allows valid status transitions', () => {
    expect(() => validateTop11StatusTransition('draft', 'open')).not.toThrow();
    expect(() => validateTop11StatusTransition('closed', 'published')).not.toThrow();
    expect(() => validateTop11StatusTransition('published', 'archived')).not.toThrow();
  });

  it('rejects invalid status transitions', () => {
    expect(() => validateTop11StatusTransition('draft', 'published')).toThrow(APIError);
    expect(() => validateTop11StatusTransition('archived', 'open')).toThrow(APIError);
  });

  it('enforces immutable published contests', () => {
    expect(() => assertPublishedContestImmutability('published', {
      title: 'attempt mutation',
    })).toThrow(APIError);

    expect(() => assertPublishedContestImmutability('published', {
      status: 'archived',
    })).not.toThrow();
  });

  it('builds csv output', () => {
    const csv = buildCsv(['A', 'B'], [['x', 'y'], ['comma,value', 'quote"value']]);
    expect(csv).toContain('A,B');
    expect(csv).toContain('x,y');
    expect(csv).toContain('"comma,value"');
    expect(csv).toContain('"quote""value"');
  });
});
