/**
 * Unit tests for the pure charset-analysis helpers in verifyCustomTextCharset.
 */

import { describe, it, expect } from 'vitest';
import { classifyBytes, decodeAs, isValidUtf8, sampleNonAscii } from './verifyCustomTextCharset';

describe('isValidUtf8', () => {
  it('accepts well-formed UTF-8', () => {
    expect(isValidUtf8(Buffer.from("Starla dear, You're on my mind", 'utf8'))).toBe(true);
    expect(isValidUtf8(Buffer.from([0xe2, 0x80, 0x99]))).toBe(true); // ’
  });

  it('rejects bytes that are not well-formed UTF-8', () => {
    expect(isValidUtf8(Buffer.from([0x92]))).toBe(false); // cp1252 ’
    expect(isValidUtf8(Buffer.from([0xc3, 0x28]))).toBe(false); // invalid continuation
  });
});

describe('classifyBytes', () => {
  it('treats empty and null-ish buffers as ascii', () => {
    expect(classifyBytes(Buffer.alloc(0))).toBe('ascii');
    expect(classifyBytes(Buffer.from(''))).toBe('ascii');
  });

  it('classifies pure 7-bit content as ascii regardless of table charset', () => {
    expect(classifyBytes(Buffer.from('<iframe src="https://www.mixcloud.com/x"></iframe>'))).toBe(
      'ascii',
    );
  });

  it('classifies UTF-8 bytes with multibyte sequences as utf8 (table declaration lies)', () => {
    const blob = Buffer.from('Starla passed on Thursday, July 3rd — “Starla dear”', 'utf8');
    expect(classifyBytes(blob)).toBe('utf8');
  });

  it('classifies genuinely latin1/cp1252 bytes as latin1', () => {
    // 0x92 is the cp1252 right single quote; invalid as UTF-8.
    expect(classifyBytes(Buffer.from([0x74, 0x68, 0x65, 0x92, 0x73]))).toBe('latin1');
  });
});

describe('decodeAs', () => {
  it('decodes utf8-class bytes as UTF-8', () => {
    const blob = Buffer.from('You’re on my mind', 'utf8');
    expect(decodeAs(blob, 'utf8')).toBe('You’re on my mind');
  });

  it('decodes latin1-class bytes as windows-1252', () => {
    // "the's" with a cp1252 curly apostrophe.
    const blob = Buffer.from([0x74, 0x68, 0x65, 0x92, 0x73]);
    expect(decodeAs(blob, 'latin1')).toBe('the’s');
  });
});

describe('sampleNonAscii', () => {
  it('returns null for pure-ASCII bytes', () => {
    expect(sampleNonAscii(Buffer.from('<p>plain</p>'))).toBeNull();
    expect(sampleNonAscii(Buffer.alloc(0))).toBeNull();
  });

  it('shows the same byte sequence under UTF-8 and cp1252 interpretations', () => {
    // UTF-8 encoding of ’ (e2 80 99) read as cp1252 is the mojibake "â€™".
    const sample = sampleNonAscii(Buffer.from([0xe2, 0x80, 0x99, 0x73]));
    expect(sample).toEqual({
      hex: 'e2 80 99',
      utf8: '’',
      cp1252: 'â€™',
    });
  });

  it('captures a 2-byte UTF-8 sequence', () => {
    // é = c3 a9 in UTF-8; "é" in cp1252 is "Ã©".
    const sample = sampleNonAscii(Buffer.from([0x63, 0xc3, 0xa9, 0x6f]));
    expect(sample).toEqual({ hex: 'c3 a9', utf8: 'é', cp1252: 'Ã©' });
  });
});