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
    expect(
      shouldPreserveAsCustomTitle('Strand of Oaks (Full Band): Winter Classic Night 2'),
    ).toBe(true);
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
  });

  it('should NOT match regular artist names', () => {
    expect(isEventName('The National')).toBe(false);
    expect(isEventName('Artist ft. Guest Artist')).toBe(false);
  });
});

describe('isSingleArtistWithConjunction', () => {
  it('should detect "Artist & The Band" patterns', () => {
    expect(isSingleArtistWithConjunction('Echo & The Bunnymen')).toBe(true);
    expect(isSingleArtistWithConjunction('Bob & The band')).toBe(true);
  });

  it('should detect "Artist + The Band" patterns', () => {
    expect(isSingleArtistWithConjunction('Florence + The Machine')).toBe(true);
    expect(isSingleArtistWithConjunction('Marina + The Diamonds')).toBe(true);
  });

  it('should detect "Artist and the Band" patterns', () => {
    expect(isSingleArtistWithConjunction('Ted Leo and the Pharmacists')).toBe(true);
    expect(isSingleArtistWithConjunction('Tom Petty and the Heartbreakers')).toBe(true);
  });

  it('should detect specific known artists', () => {
    expect(isSingleArtistWithConjunction('Tegan and Sara')).toBe(true);
    expect(isSingleArtistWithConjunction('Ted Leo and the Pharmacists')).toBe(true);
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

  it('should handle mixed delimiters', () => {
    expect(parseArtistNames('Artist1, Artist2 and Artist3')).toEqual([
      'Artist1',
      'Artist2',
      'Artist3',
    ]);
  });

  it('should NOT split single artists with conjunctions', () => {
    expect(parseArtistNames('Echo & The Bunnymen')).toEqual(['Echo & The Bunnymen']);
    expect(parseArtistNames('Florence + The Machine')).toEqual(['Florence + The Machine']);
    expect(parseArtistNames('Ted Leo and the Pharmacists')).toEqual([
      'Ted Leo and the Pharmacists',
    ]);
    expect(parseArtistNames('Tegan and Sara')).toEqual(['Tegan and Sara']);
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
    expect(
      extractArtistsFromTitle('Strand of Oaks (Full Band): Winter Classic Night 2'),
    ).toEqual(['Strand of Oaks']);
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

  it('should handle "and more..." in event strings', () => {
    expect(
      extractArtistsFromEventString('Festival ft. Artist1, Artist2, and more...'),
    ).toEqual(['Artist1', 'Artist2']);
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
    const result = processArtistString(
      '<i>Frantic City Festival</i> ft. Yo La Tengo, Snail Mail',
    );
    expect(result.customTitle).toBe('Frantic City Festival ft. Yo La Tengo, Snail Mail');
    expect(result.artistNames).toEqual(['Yo La Tengo', 'Snail Mail']);
  });

  it('should NOT split single artists with conjunctions', () => {
    const result1 = processArtistString('Echo & The Bunnymen');
    expect(result1.customTitle).toBe(null);
    expect(result1.artistNames).toEqual(['Echo & The Bunnymen']);

    const result2 = processArtistString('Ted Leo and the Pharmacists');
    expect(result2.customTitle).toBe(null);
    expect(result2.artistNames).toEqual(['Ted Leo and the Pharmacists']);

    const result3 = processArtistString('Tegan and Sara');
    expect(result3.customTitle).toBe(null);
    expect(result3.artistNames).toEqual(['Tegan and Sara']);
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
    const result = processArtistString(
      'Strand of Oaks (Full Band): Winter Classic Night 2',
    );
    expect(result.customTitle).toBe('Strand of Oaks (Full Band): Winter Classic Night 2');
    expect(result.artistNames).toEqual(['Strand of Oaks']);
  });

  it('should handle solo/acoustic annotations', () => {
    const result = processArtistString('Kurt Vile (solo) [early show]');
    expect(result.customTitle).toBe('Kurt Vile (solo) [early show]');
    expect(result.artistNames).toEqual(['Kurt Vile']);
  });

  it('should split Guster & The Mountain Goats', () => {
    const result = processArtistString('Guster & The Mountain Goats');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['Guster', 'The Mountain Goats']);
  });

  it('should split The Tisburys and Twin Princess', () => {
    const result = processArtistString('The Tisburys and Twin Princess');
    expect(result.customTitle).toBe(null);
    expect(result.artistNames).toEqual(['The Tisburys', 'Twin Princess']);
  });
});
