import { describe, expect, it } from 'vitest';
import { parseNomineeList } from './parseNomineeList';

describe('parseNomineeList', () => {
  it('keeps plain lines, minus numbering, bullets and blank lines', () => {
    expect(parseNomineeList('1. Severance\n\n- The Pitt\n* Andor\n')).toEqual([
      'Severance',
      'The Pitt',
      'Andor',
    ]);
  });

  it('normalizes dashes and quoted titles to "Artist - Title"', () => {
    expect(
      parseNomineeList('Wet Leg – CPR\nWet Leg "CPR"\nBeck - "Run Away"\nHAIM “Relationships”'),
    ).toEqual(['Wet Leg - CPR', 'Wet Leg - CPR', 'Beck - Run Away', 'HAIM - Relationships']);
  });

  it('leaves a fully quoted name alone', () => {
    expect(parseNomineeList('"Severance"')).toEqual(['"Severance"']);
  });

  it('reads an artist/title CSV with quoted commas', () => {
    expect(parseNomineeList('Artist,Title\nWet Leg,CPR\n"Beck, Jr.",Run Away')).toEqual([
      'Wet Leg - CPR',
      'Beck, Jr. - Run Away',
    ]);
  });

  it('ignores extra CSV columns such as rank and year', () => {
    expect(
      parseNomineeList('Rank,Artist,Album,Year\n1,Wet Leg,moisturizer,2025\n2,HAIM,I quit,2025'),
    ).toEqual(['Wet Leg - moisturizer', 'HAIM - I quit']);
  });

  it('reads a one-column list with a header', () => {
    expect(parseNomineeList('Song\nWet Leg - CPR\nBeck - Run Away')).toEqual([
      'Wet Leg - CPR',
      'Beck - Run Away',
    ]);
    expect(parseNomineeList('Artist\nWet Leg\nHAIM')).toEqual(['Wet Leg', 'HAIM']);
  });

  it('reads columns pasted from a spreadsheet, with or without a header', () => {
    expect(parseNomineeList('Artist\tTitle\nWet Leg\tCPR\nBeck\tRun Away')).toEqual([
      'Wet Leg - CPR',
      'Beck - Run Away',
    ]);
    expect(parseNomineeList('1\tWet Leg\tCPR\n2\tBeck\tRun Away')).toEqual([
      'Wet Leg - CPR',
      'Beck - Run Away',
    ]);
  });

  it('skips rows with no artist or title and handles a byte-order mark', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(parseNomineeList(`${bom}Artist,Title\r\n,Severance\r\nWet Leg,\r\n,\r\n`)).toEqual([
      'Severance',
      'Wet Leg',
    ]);
  });

  it('keeps commas in plain lines', () => {
    expect(parseNomineeList('Crosby, Stills & Nash - Suite')).toEqual([
      'Crosby, Stills & Nash - Suite',
    ]);
  });
});
