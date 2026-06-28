import { describe, expect, it } from 'vitest';
import { extractArtistCandidates, parseLegacySongList } from './ondemandSongs';

describe('ondemandSongs', () => {
  it('splits legacy song lists on slashes and preserves commas inside titles', () => {
    const result = parseLegacySongList("Come On, Be A No One / Anna / I Should Have Helped");

    expect(result.reason).toBeUndefined();
    expect(result.titles).toEqual(['Come On, Be A No One', 'Anna', 'I Should Have Helped']);
  });

  it('skips placeholder link-only values', () => {
    const result = parseLegacySongList(
      '<a href=http://www.setlist.fm/setlist/mike-doughty/2017/world-cafe-live-philadelphia-pa-43f9db8f.html" target=_blank>Click here for setlist.</a>',
    );

    expect(result.reason).toBe('placeholder');
    expect(result.titles).toEqual([]);
  });

  it('skips dash-only placeholder values', () => {
    const result = parseLegacySongList('-');

    expect(result.reason).toBe('placeholder');
    expect(result.titles).toEqual([]);
  });

  it('prefers populated artist relations over text fallbacks', () => {
    const result = extractArtistCandidates({
      artists: [{ id: 9, name: 'Remember Sports' }],
      artistsText: 'Remember Sports',
      headline: 'Remember Sports',
    });

    expect(result).toEqual([{ id: 9, name: 'Remember Sports' }]);
  });
});
