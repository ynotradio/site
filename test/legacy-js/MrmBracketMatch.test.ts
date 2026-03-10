/**
 * Tests for <mrm-bracket-match> custom element.
 *
 * Uses Vitest + jsdom to exercise attribute rendering, winner/loser classes,
 * and the light-DOM output that matches the original PHP markup.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// jsdom supports custom elements – importing the file registers the element.
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
require('../../src/js/components/MrmBracketMatch.js');

const createElement = (attrs = {}) => {
  const el = document.createElement('mrm-bracket-match');
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, String(value));
    }
  });
  document.body.appendChild(el);
  return el;
};

describe('MrmBracketMatch', () => {
  beforeAll(() => {
    // Verify element is registered
    expect(customElements.get('mrm-bracket-match')).toBeDefined();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders band seed and name from attributes using original class names', () => {
    const el = createElement({
      'band1-seed': '1',
      'band1-name': 'Radiohead',
      'band2-seed': '16',
      'band2-name': 'Weezer',
    });

    // Light DOM – uses same class names as original PHP output
    expect(el.querySelector('.band1 .seed').textContent).toBe('1');
    expect(el.querySelector('.band1 .band_abbr').textContent).toBe('Radiohead');
    expect(el.querySelector('.band2 .seed').textContent).toBe('16');
    expect(el.querySelector('.band2 .band_abbr').textContent).toBe('Weezer');
  });

  it('renders vote percentages when provided', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
    });

    expect(el.querySelector('.band1 .percentage').textContent).toBe('55%');
    expect(el.querySelector('.band2 .percentage').textContent).toBe('45%');
  });

  it('omits percentage span when not provided', () => {
    const el = createElement({
      'band1-seed': '1',
      'band1-name': 'Radiohead',
    });

    expect(el.querySelector('.band1 .percentage')).toBeNull();
  });

  it('applies mrm_winner class when winner="1"', () => {
    const el = createElement({
      'band1-name': 'Winner',
      'band2-name': 'Loser',
      winner: '1',
    });

    expect(el.querySelector('.band1').classList.contains('mrm_winner')).toBe(true);
    expect(el.querySelector('.band2').classList.contains('mrm_loser')).toBe(true);
  });

  it('applies mrm_winner class when winner="2"', () => {
    const el = createElement({
      'band1-name': 'Loser',
      'band2-name': 'Winner',
      winner: '2',
    });

    expect(el.querySelector('.band1').classList.contains('mrm_loser')).toBe(true);
    expect(el.querySelector('.band2').classList.contains('mrm_winner')).toBe(true);
  });

  it('does not apply winner/loser classes without winner attribute', () => {
    const el = createElement({
      'band1-name': 'A',
      'band2-name': 'B',
    });

    expect(el.querySelector('.band1').className).toBe('band1');
    expect(el.querySelector('.band2').className).toBe('band2');
  });

  it('updates when attributes change dynamically', () => {
    const el = createElement({ 'band1-name': 'Before' });

    expect(el.querySelector('.band1 .band_abbr').textContent).toBe('Before');

    el.setAttribute('band1-name', 'After');
    expect(el.querySelector('.band1 .band_abbr').textContent).toBe('After');
  });

  it('renders empty strings for missing attributes', () => {
    const el = createElement({});
    expect(el.querySelector('.band1 .seed').textContent).toBe('');
    expect(el.querySelector('.band1 .band_abbr').textContent).toBe('');
  });

  it('escapes HTML entities in band names', () => {
    const el = createElement({ 'band1-name': '<script>alert("xss")</script>' });
    expect(el.querySelector('.band1 .band_abbr').textContent).toBe('<script>alert("xss")</script>');
    expect(el.querySelector('.band1 .band_abbr').innerHTML).not.toContain('<script>');
  });

  it('outputs a <dl> element matching original PHP structure', () => {
    const el = createElement({
      'band1-seed': '1',
      'band1-name': 'Radiohead',
      'band2-seed': '16',
      'band2-name': 'Weezer',
    });

    expect(el.querySelector('dl')).toBeTruthy();
    expect(el.querySelectorAll('dt').length).toBe(2);
  });
});
