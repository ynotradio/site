/**
 * Unit tests for artist cleanup utilities
 */

import { describe, it, expect } from 'vitest';
import {
  cleanArtistString,
  shouldPreserveAsCustomTitle,
  isEventName,
  isSingleArtistWithConjunction,
  parseArtistNames,
  extractArtistsFromTitle,
  extractArtistsFromEventString,
  processArtistString,
} from './artistCleaner';

describe('cleanArtistString', () => {
  it('should remove HTML tags', () => {
    expect(cleanArtistString('<em>No More Dysphoria VII</em>')).toBe('No More Dysphoria VII');
    expect(cleanArtistString('<i>Sing Us Home Festival</i><br>ft. Dave Hause')).toBe(
      'Sing Us Home Festival ft. Dave Hause',
    );
  });

  it('should decode HTML entities', () => {
    expect(cleanArtistString('Ben &amp; Jerry')).toBe('Ben & Jerry');
    expect(cleanArtistString('&lt;Artist&gt;')).toBe('<Artist>');
    expect(cleanArtistString('It&#39;s a name')).toBe("It's a name");
    expect(cleanArtistString('&quot;Quoted&quot;')).toBe('"Quoted"');
    expect(cleanArtistString('Space&nbsp;Between')).toBe('Space Between');
  });

  it('should clean up whitespace', () => {
    expect(cleanArtistString('  Artist   Name  ')).toBe('Artist Name');
    expect(cleanArtistString('Artist\n\nName')).toBe('Artist Name');
    expect(cleanArtistString('Artist\t\tName')).toBe('Artist Name');
  });

  it('should handle empty strings', () => {
    expect(cleanArtistString('')).toBe('');
    expect(cleanArtistString('   ')).toBe('');
  });

  it('should handle complex combinations', () => {
    expect(cleanArtistString('<i>Festival</i>&nbsp;&nbsp;ft.&nbsp;<em>Artist</em>')).toBe(
      'Festival ft. Artist',
    );
  });
});

describe('shouldPreserveAsCustomTitle', () => {
  it('should detect album performance patterns', () => {
    expect(shouldPreserveAsCustomTitle('Ron Gallo (performing Stardust Birthday Party)')).toBe(
      true,
    );
    expect(shouldPreserveAsCustomTitle('The National (playing Boxer in full)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Wilco performs Yankee Hotel Foxtrot')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Band plays their debut album')).toBe(true);
  });

  it('should detect show/tour patterns', () => {
    expect(shouldPreserveAsCustomTitle('Tokyo Police Club (The Final Tour)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Kurt Vile (solo) [early show]')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Artist (Album Release Show)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Band (Farewell Tour)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Artist (reunion)')).toBe(true);
  });

  it('should detect night numbers', () => {
    expect(shouldPreserveAsCustomTitle('Strand of Oaks (Full Band): Winter Classic Night 2')).toBe(
      true,
    );
    expect(shouldPreserveAsCustomTitle('Artist (Night 1)')).toBe(true);
  });

  it('should detect performance types', () => {
    expect(shouldPreserveAsCustomTitle('Kurt Vile (solo)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Band (acoustic)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Artist (Full Band)')).toBe(true);
  });

  it('should detect member/formerly patterns', () => {
    expect(shouldPreserveAsCustomTitle('Sima Cunningham (formerly Ohmme)')).toBe(true);
    expect(shouldPreserveAsCustomTitle('Rob Grote (members of The Districts)')).toBe(true);
  });

  it('should NOT match regular artist names', () => {
    expect(shouldPreserveAsCustomTitle('The National')).toBe(false);
    expect(shouldPreserveAsCustomTitle('Jimmy Eat World and New Found Glory')).toBe(false);
  });
});

describe('isEventName', () => {
  it('should detect festival patterns with HTML', () => {
    expect(
      isEventName('<i>Frantic City Festival</i> ft. Yo La Tengo, Snail Mail, and more...'),
    ).toBe(true);
    expect(isEventName('<em>Sing Us Home Festival</em> ft. Dave Hause')).toBe(true);
  });

  it('should detect benefit/festival keywords', () => {
    expect(isEventName('Make The World Better Benefit ft. Artists')).toBe(true);
    expect(isEventName('Spring Festival ft. Local Bands')).toBe(true);
    expect(isEventName('Charity Benefit ft. Various Artists')).toBe(true);
  });

  it('should detect tribute patterns', () => {
    expect(isEventName('Beatles Tribute ft. Cover Bands')).toBe(true);
  });

  it('should detect other event patterns', () => {
    expect(isEventName('Philly Music Fest 2024')).toBe(true);
    expect(isEventName('Outdoor Music Festival ft. Headliners')).toBe(true);
    expect(isEventName('The Roots Picnic f/ The Roots')).toBe(true);
  });

  it('should NOT match regular artist names', () => {
    expect(isEventName('The National')).toBe(false);
    expect(isEventName('Artist ft. Guest Artist')).toBe(false);
  });
});

describe('isSingleArtistWithConjunction', () => {
  it('should detect "Artist & The Band" patterns', () => {
    expect(isSingleArtistWithConjunction('Echo & The Bunnymen')).toBe(true);
    expect(isSingleArtistWithConjunction('Bob & The Band')).toBe(true);
  });

  it('should detect "Artist + The Band" patterns', () => {
    expect(isSingleArtistWithConjunction('Florence + The Machine')).toBe(true);
    expect(isSingleArtistWithConjunction('Marina + The Diamonds')).toBe(true);
  });

  it('should rely on MusicBrainz for lowercase "the" patterns', () => {
    // Patterns with lowercase "the" are ambiguous and need MusicBrainz
    expect(isSingleArtistWithConjunction('Ted Leo and the Pharmacists')).toBe(false);
    expect(isSingleArtistWithConjunction('Tom Petty and the Heartbreakers')).toBe(false);
  });

  it('should rely on MusicBrainz for ambiguous cases', () => {
    // The sync version now only handles strong heuristics (lowercase after "the")
    // These cases need MusicBrainz to determine if they're single artists
    expect(isSingleArtistWithConjunction('Tegan and Sara')).toBe(false);
    expect(isSingleArtistWithConjunction('Coheed and Cambria')).toBe(false);
    expect(isSingleArtistWithConjunction('Simon & Garfunkel')).toBe(false);
  });

  it('should NOT match multiple distinct artists', () => {
    expect(isSingleArtistWithConjunction('Jimmy Eat World and New Found Glory')).toBe(false);
    expect(isSingleArtistWithConjunction('The Tisburys and Twin Princess')).toBe(false);
    expect(isSingleArtistWithConjunction('Artist1 & Artist2')).toBe(false);
  });
});

describe('parseArtistNames', () => {
  it('should split by comma', () => {
    expect(parseArtistNames('Artist1, Artist2, Artist3')).toEqual([
      'Artist1',
      'Artist2',
      'Artist3',
    ]);
  });

  it('should split by "and"', () => {
    expect(parseArtistNames('Jimmy Eat World and New Found Glory')).toEqual([
      'Jimmy Eat World',
      'New Found Glory',
    ]);
  });

  it('should split by "&"', () => {
    expect(parseArtistNames('Artist1 & Artist2')).toEqual(['Artist1', 'Artist2']);
  });

  it('should split by "+"', () => {
    expect(parseArtistNames('Artist1 + Artist2')).toEqual(['Artist1', 'Artist2']);
  });

  it('should handle "ft." and "feat."', () => {
    expect(parseArtistNames('Artist1 ft. Artist2')).toEqual(['Artist1', 'Artist2']);
    expect(parseArtistNames('Artist1 feat. Artist2')).toEqual(['Artist1', 'Artist2']);
  });

  it('should handle "w/" (with) pattern', () => {
    expect(parseArtistNames('TOY SOLDIERS w/ Paper Masques')).toEqual([
      'TOY SOLDIERS',
      'Paper Masques',
    ]);
    expect(parseArtistNames('Cheers Elephant w/ Springs')).toEqual(['Cheers Elephant', 'Springs']);
  });

  it('should handle "(of Band)" pattern', () => {
    expect(parseArtistNames('J. Mascis (of Dinosaur Jr.)')).toEqual(['J. Mascis', 'Dinosaur Jr.']);
    expect(parseArtistNames('Artist (from The Band)')).toEqual(['Artist', 'The Band']);
  });

  it('should handle mixed delimiters', () => {
    expect(parseArtistNames('Artist1, Artist2 and Artist3')).toEqual([
      'Artist1',
      'Artist2',
      'Artist3',
    ]);
  });

  it('should NOT split single artists with strong heuristic patterns', () => {
    expect(parseArtistNames('Echo & The Bunnymen')).toEqual(['Echo & The Bunnymen']);
    expect(parseArtistNames('Florence + The Machine')).toEqual(['Florence + The Machine']);
    // Note: Lowercase "the" patterns like "Ted Leo and the Pharmacists" are ambiguous
    // and will be split by sync version - use async version for MusicBrainz lookup
  });

  it('should filter out "more..." entries', () => {
    expect(parseArtistNames('Artist1, Artist2, and more...')).toEqual(['Artist1', 'Artist2']);
    expect(parseArtistNames('Artist1, Artist2, more')).toEqual(['Artist1', 'Artist2']);
  });

  it('should handle empty strings', () => {
    expect(parseArtistNames('')).toEqual([]);
    expect(parseArtistNames('   ')).toEqual([]);
  });

  it('should trim whitespace', () => {
    expect(parseArtistNames('  Artist1  ,  Artist2  ')).toEqual(['Artist1', 'Artist2']);
  });
});

describe('extractArtistsFromTitle', () => {
  it('should extract artist before parentheses', () => {
    expect(extractArtistsFromTitle('Ron Gallo (Album Release)')).toEqual(['Ron Gallo']);
    expect(extractArtistsFromTitle('Tokyo Police Club (The Final Tour)')).toEqual([
      'Tokyo Police Club',
    ]);
  });

  it('should extract artist before brackets', () => {
    expect(extractArtistsFromTitle('Kurt Vile (solo) [early show]')).toEqual(['Kurt Vile']);
  });

  it('should handle Winter Classic format', () => {
    expect(extractArtistsFromTitle('Strand of Oaks (Full Band): Winter Classic Night 2')).toEqual([
      'Strand of Oaks',
    ]);
  });

  it('should handle multiple artists in title', () => {
    expect(extractArtistsFromTitle('Artist1 and Artist2 (Album Release)')).toEqual([
      'Artist1',
      'Artist2',
    ]);
  });
});

describe('extractArtistsFromEventString', () => {
  it('should extract artists after "ft."', () => {
    expect(
      extractArtistsFromEventString('Frantic City Festival ft. Yo La Tengo, Snail Mail'),
    ).toEqual(['Yo La Tengo', 'Snail Mail']);
  });

  it('should extract artists after "feat."', () => {
    expect(extractArtistsFromEventString('Benefit feat. Artist1 and Artist2')).toEqual([
      'Artist1',
      'Artist2',
    ]);
  });

  it('should extract artists after "f/"', () => {
    expect(extractArtistsFromEventString('The Roots Picnic f/ The Roots')).toEqual(['The Roots']);
  });

  it('should handle "and more..." in event strings', () => {
    expect(extractArtistsFromEventString('Festival ft. Artist1, Artist2, and more...')).toEqual([
      'Artist1',
      'Artist2',
    ]);
  });

  it('should parse normally if no "ft." found', () => {
    expect(extractArtistsFromEventString('Artist1, Artist2')).toEqual(['Artist1', 'Artist2']);
  });
});

describe('processArtistString', () => {
  it('should handle HTML tags in artist names', () => {
    const result = processArtistString('<em>No More Dysphoria VII</em>');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['No More Dysphoria VII']);
  });

  it('should handle multiple artists combined', () => {
    const result = processArtistString('Jimmy Eat World and New Found Glory');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['Jimmy Eat World', 'New Found Glory']);
  });

  it('should preserve concert-specific info as custom title', () => {
    const result = processArtistString('Ron Gallo (Album Release)');
    expect(result.customTitle).toBe('Ron Gallo (Album Release)');
    expect(result.artistNames).toEqual(['Ron Gallo']);
  });

  it('should handle event names', () => {
    const result = processArtistString('<i>Frantic City Festival</i> ft. Yo La Tengo, Snail Mail');
    expect(result.customTitle).toBe('Frantic City Festival ft. Yo La Tengo, Snail Mail');
    expect(result.artistNames).toEqual(['Yo La Tengo', 'Snail Mail']);
  });

  it('should NOT split single artists with conjunctions (capital The)', () => {
    const result1 = processArtistString('Echo & The Bunnymen');
    expect(result1.customTitle).toBe(null);
    expect(result1.artistNames).toEqual(['Echo & The Bunnymen']);

    const result2 = processArtistString('Florence + The Machine');
    expect(result2.customTitle).toBe(null);
    expect(result2.artistNames).toEqual(['Florence + The Machine']);
  });

  it('should handle complex HTML with multiple artists', () => {
    const result = processArtistString(
      '<i>Sing Us Home Festival</i><br>ft. Dave Hause, The Menzingers',
    );
    expect(result.customTitle).toBe('Sing Us Home Festival ft. Dave Hause, The Menzingers');
    expect(result.artistNames).toEqual(['Dave Hause', 'The Menzingers']);
  });

  it('should handle empty strings', () => {
    const result = processArtistString('');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual([]);
  });

  it('should handle HTML entities', () => {
    const result = processArtistString('Artist &amp; Guest');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['Artist', 'Guest']);
  });

  it('should preserve Winter Classic format', () => {
    const result = processArtistString('Strand of Oaks (Full Band): Winter Classic Night 2');
    expect(result.customTitle).toBe('Strand of Oaks (Full Band): Winter Classic Night 2');
    expect(result.artistNames).toEqual(['Strand of Oaks']);
  });

  it('should handle solo/acoustic annotations', () => {
    const result = processArtistString('Kurt Vile (solo) [early show]');
    expect(result.customTitle).toBe('Kurt Vile (solo) [early show]');
    expect(result.artistNames).toEqual(['Kurt Vile']);
  });

  it('should use MusicBrainz for ambiguous "& The Band" cases', () => {
    // "Guster & The Mountain Goats" matches heuristic but should be split
    // The sync version will incorrectly keep it together - use async for accuracy
    const result = processArtistString('Guster & The Mountain Goats');
    expect(result.customTitle).toBe(null);
    // Sync version treats it as single artist (heuristic limitation)
    expect(result.artistNames).toEqual(['Guster & The Mountain Goats']);
    // Note: Use processArtistStringAsync for correct splitting via MusicBrainz
  });

  it('should split The Tisburys and Twin Princess', () => {
    const result = processArtistString('The Tisburys and Twin Princess');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['The Tisburys', 'Twin Princess']);
  });

  it('should split ambiguous names (use async for MusicBrainz lookup)', () => {
    // Sync version will split these - use processArtistStringAsync for MusicBrainz
    const result = processArtistString('Coheed and Cambria');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['Coheed', 'Cambria']);
  });

  it('should handle "w/" pattern', () => {
    const result = processArtistString('TOY SOLDIERS w/ Paper Masques');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['TOY SOLDIERS', 'Paper Masques']);
  });

  it('should handle "(of Band)" pattern', () => {
    const result = processArtistString('J. Mascis (of Dinosaur Jr.)');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['J. Mascis', 'Dinosaur Jr.']);
  });

  it('should handle event with "f/" pattern', () => {
    const result = processArtistString('The Roots Picnic f/ The Roots');
    expect(result.customTitle).toBe('The Roots Picnic f/ The Roots');
    expect(result.artistNames).toEqual(['The Roots']);
  });
});
