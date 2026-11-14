import { describe, expect, it } from 'vitest';
import { appendPastedPicks, parsePickLine, parsePickLines } from './yearEndStaffPickHooks';

type HookArgs = Parameters<typeof appendPastedPicks>[0];

describe('parsePickLine', () => {
  it('reads the legacy song format: Artist "Title"', () => {
    expect(parsePickLine('\tWet Leg\t"Catch These Fists"\t')).toEqual({
      artist: 'Wet Leg',
      title: 'Catch These Fists',
    });
  });

  it('keeps quotes and dashes inside the title', () => {
    expect(parsePickLine('Jay Som (feat. Jim Adkins) "Float"')).toEqual({
      artist: 'Jay Som (feat. Jim Adkins)',
      title: 'Float',
    });
    expect(parsePickLine('Dave Hause - ...and the Mermaid - Deluxe')).toEqual({
      artist: 'Dave Hause',
      title: '...and the Mermaid - Deluxe',
    });
  });

  it('tolerates hand-typed quote mistakes from the legacy lists', () => {
    expect(parsePickLine('Fat Dog ""Pray to That"')).toEqual({
      artist: 'Fat Dog',
      title: 'Pray to That',
    });
    expect(parsePickLine('Psychedelic Porn Crumpets “Incubator (V2000)')).toEqual({
      artist: 'Psychedelic Porn Crumpets',
      title: 'Incubator (V2000)',
    });
    expect(parsePickLine('Jay Som "Float" (ft. Jim Atkins)')).toEqual({
      artist: 'Jay Som',
      title: 'Float (ft. Jim Atkins)',
    });
    expect(parsePickLine('Garbage "The "Real" One"')).toEqual({
      artist: 'Garbage',
      title: 'The "Real" One',
    });
  });

  it('reads Artist - Title and strips list numbering', () => {
    expect(parsePickLine('3. Wet Leg - moisturizer')).toEqual({
      artist: 'Wet Leg',
      title: 'moisturizer',
    });
  });

  it('keeps a line with no separator as the title', () => {
    expect(parsePickLine('Thee Black Boltz')).toEqual({ artist: '', title: 'Thee Black Boltz' });
  });

  it('skips blank lines', () => {
    expect(parsePickLines('Beck - Loser\n\n  \nHAIM - I quit')).toHaveLength(2);
  });
});

describe('appendPastedPicks', () => {
  const run = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) => appendPastedPicks({
    data,
    originalDoc,
    req: {} as HookArgs['req'],
    operation: 'update',
    collection: {} as HookArgs['collection'],
    context: {},
  } as HookArgs) as Record<string, unknown>;

  it('appends pasted songs and albums and drops the paste fields', () => {
    const result = run({
      songs: [{ artist: 'A', title: 'One' }],
      songsPaste: 'B "Two"',
      albumsPaste: 'C - Three',
    });
    expect(result.songs).toEqual([
      { artist: 'A', title: 'One' },
      { artist: 'B', title: 'Two' },
    ]);
    expect(result.albums).toEqual([{ artist: 'C', title: 'Three' }]);
    expect(result).not.toHaveProperty('songsPaste');
    expect(result).not.toHaveProperty('albumsPaste');
  });

  it('appends to the saved list when the update omits it', () => {
    const result = run(
      { albumsPaste: 'HAIM - I quit' },
      { albums: [{ artist: 'Wet Leg', title: 'moisturizer' }] },
    );
    expect(result.albums).toEqual([
      { artist: 'Wet Leg', title: 'moisturizer' },
      { artist: 'HAIM', title: 'I quit' },
    ]);
  });

  it('skips pasted entries already on the list or repeated, ignoring case', () => {
    const result = run({
      songs: [{ artist: 'Garbage', title: 'Chinese Fire Horse' }],
      songsPaste: 'garbage - chinese fire horse\nSpoon "Chateau Blues"\nSPOON - CHATEAU BLUES',
    });
    expect(result.songs).toEqual([
      { artist: 'Garbage', title: 'Chinese Fire Horse' },
      { artist: 'Spoon', title: 'Chateau Blues' },
    ]);
  });

  it('leaves lists alone when nothing was pasted', () => {
    expect(run({ songs: [], songsPaste: ' ' })).toEqual({ songs: [] });
  });
});
