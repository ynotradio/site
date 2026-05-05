import { describe, expect, it } from 'vitest';
import { htmlTitleToLexical } from './htmlTitleToLexical';
import { convertConcertTitleToHtml, convertConcertTitleToPlain } from '../../../payload/src/utils/concertTitle';

describe('htmlTitleToLexical', () => {
  it('handles empty string', () => {
    const state = htmlTitleToLexical('');
    expect(convertConcertTitleToPlain(state)).toBe('');
  });

  it('handles plain text', () => {
    const state = htmlTitleToLexical('Future Islands');
    expect(convertConcertTitleToPlain(state)).toBe('Future Islands');
    expect(convertConcertTitleToHtml(state)).toBe('Future Islands');
  });

  it('round-trips Pete Yorn fixture (italic)', () => {
    const input = 'Pete Yorn (<em>Musicforthemorningafter</em> 25th Anniversary / Solo Acoustic)';
    const state = htmlTitleToLexical(input);
    const html = convertConcertTitleToHtml(state);
    expect(html).toContain('<em>Musicforthemorningafter</em>');
    expect(html).toContain('Pete Yorn (');
    expect(html).toContain('25th Anniversary / Solo Acoustic)');
  });

  it('treats <i> like <em>', () => {
    const state = htmlTitleToLexical('<i>Make The World Better Concert</i> w/ Pavement');
    expect(convertConcertTitleToHtml(state)).toContain('<em>Make The World Better Concert</em>');
  });

  it('treats <b> like <strong>', () => {
    const state = htmlTitleToLexical('<b>Loud</b> Show');
    expect(convertConcertTitleToHtml(state)).toContain('<strong>Loud</strong>');
  });

  it('preserves <br>', () => {
    const state = htmlTitleToLexical("Y-Not Radio's Swell 16<br>w/ WAAX");
    const html = convertConcertTitleToHtml(state);
    expect(html).toMatch(/Y-Not Radio's Swell 16<br\s*\/?>w\/ WAAX/);
  });

  it('converts <a> with safe URL', () => {
    const state = htmlTitleToLexical('See <a href="https://example.com">here</a>');
    const html = convertConcertTitleToHtml(state);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="nofollow noopener noreferrer"');
  });

  it('drops javascript: hrefs via safeHref', () => {
    const state = htmlTitleToLexical('<a href="javascript:alert(1)">x</a>');
    expect(convertConcertTitleToHtml(state)).toContain('href="#"');
  });

  it('flattens unknown tags transparently', () => {
    const state = htmlTitleToLexical('<span class="x">Hello <em>there</em></span>');
    expect(convertConcertTitleToHtml(state)).toBe('Hello <em>there</em>');
  });
});
