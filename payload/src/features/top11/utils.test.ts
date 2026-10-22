import { describe, expect, it } from 'vitest';
import { APIError } from 'payload';
import { buildCsv, parseTop11Id, top11SortKey } from './utils';

describe('top11 utils', () => {
  it('sorts names ignoring a whole leading article', () => {
    expect(top11SortKey('The War On Drugs')).toBe('war on drugs');
    expect(top11SortKey('A Giant Dog')).toBe('giant dog');
    expect(top11SortKey('An Horse')).toBe('horse');
    expect(top11SortKey('Theo Katzman')).toBe('theo katzman');
    expect(top11SortKey('Anthrax')).toBe('anthrax');
    expect(top11SortKey('The')).toBe('the');
  });

  it('parses positive ids', () => {
    expect(parseTop11Id('7')).toBe(7);
  });

  it('throws for invalid ids', () => {
    expect(() => parseTop11Id('abc')).toThrow(APIError);
    expect(() => parseTop11Id('0')).toThrow(APIError);
  });

  it('builds csv output', () => {
    const csv = buildCsv(
      ['A', 'B'],
      [
        ['x', 'y'],
        ['comma,value', 'quote"value'],
      ],
    );
    expect(csv).toContain('A,B');
    expect(csv).toContain('x,y');
    expect(csv).toContain('"comma,value"');
    expect(csv).toContain('"quote""value"');
  });

  it('neutralizes formula-injection payloads in csv values', () => {
    const csv = buildCsv(
      ['Name'],
      [['=cmd|calc'], ['+1+1'], ['-1+1'], ['@SUM(1,1)'], ['Safe Name']],
    );
    expect(csv).toContain("'=cmd|calc");
    expect(csv).toContain("'+1+1");
    expect(csv).toContain("'-1+1");
    expect(csv).toContain("'@SUM(1,1)");
    expect(csv).toContain('Safe Name');
    expect(csv).not.toContain('\n=cmd');
  });
});
