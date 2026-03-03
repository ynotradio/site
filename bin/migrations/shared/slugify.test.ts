import { describe, it, expect } from 'vitest';
import { slugify, cleanHeadline } from './slugify';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('multiple   spaces   here')).toBe('multiple-spaces-here');
  });

  it('removes HTML tags', () => {
    expect(slugify('<font color="red">Red Text</font>')).toBe('red-text');
    expect(slugify('Line 1<br>Line 2')).toBe('line-1line-2');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
    expect(slugify('Test@#$%String')).toBe('teststring');
  });

  it('preserves hyphens in text', () => {
    expect(slugify('pre-existing-hyphens')).toBe('pre-existing-hyphens');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('too---many---hyphens')).toBe('too-many-hyphens');
  });

  it('removes leading and trailing hyphens', () => {
    expect(slugify('-leading-trailing-')).toBe('leading-trailing');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('');
  });

  it('handles complex real-world example', () => {
    expect(slugify('<font color="blue">The Best Band Ever!</font> - Album Review'))
      .toBe('the-best-band-ever-album-review');
  });

  it('handles numbers and underscores', () => {
    expect(slugify('Track_01 2024')).toBe('track_01-2024');
  });
});

describe('cleanHeadline', () => {
  it('replaces <br> tags with spaces', () => {
    expect(cleanHeadline('Line 1<br>Line 2')).toBe('Line 1 Line 2');
    expect(cleanHeadline('Line 1<br/>Line 2')).toBe('Line 1 Line 2');
    expect(cleanHeadline('Line 1<br />Line 2')).toBe('Line 1 Line 2');
  });

  it('removes other HTML tags', () => {
    expect(cleanHeadline('<font color="red">Text</font>')).toBe('Text');
    expect(cleanHeadline('<b>Bold</b> and <i>Italic</i>')).toBe('Bold and Italic');
  });

  it('normalizes multiple whitespace', () => {
    expect(cleanHeadline('Too   many    spaces')).toBe('Too many spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(cleanHeadline('  Padded text  ')).toBe('Padded text');
  });

  it('handles empty string', () => {
    expect(cleanHeadline('')).toBe('');
  });

  it('handles complex real-world headline', () => {
    expect(cleanHeadline('<font color="blue">Breaking News:</font><br/>Important Update'))
      .toBe('Breaking News: Important Update');
  });

  it('preserves case', () => {
    expect(cleanHeadline('Title Case Text')).toBe('Title Case Text');
  });

  it('handles nested tags', () => {
    expect(cleanHeadline('<p><b>Bold</b> in paragraph</p>'))
      .toBe('Bold in paragraph');
  });
});
