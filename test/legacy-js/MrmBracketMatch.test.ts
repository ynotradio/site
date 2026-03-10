/**
 * Tests for <mrm-bracket-match> custom element.
 *
 * Uses Vitest + jsdom to exercise attribute rendering, winner/loser classes,
 * and the `live` attribute styling hook.
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

  it('renders band seed and name from attributes', () => {
    const el = createElement({
      'band1-seed': '1',
      'band1-name': 'Radiohead',
      'band2-seed': '16',
      'band2-name': 'Weezer',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-seed"]').textContent).toBe('1');
    expect(root.querySelector('[data-slot="band1-name"]').textContent).toBe('Radiohead');
    expect(root.querySelector('[data-slot="band2-seed"]').textContent).toBe('16');
    expect(root.querySelector('[data-slot="band2-name"]').textContent).toBe('Weezer');
  });

  it('renders vote percentages when provided', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-pct"]').textContent).toBe('55%');
    expect(root.querySelector('[data-slot="band2-pct"]').textContent).toBe('45%');
  });

  it('applies winner class when winner="1"', () => {
    const el = createElement({
      'band1-name': 'Winner',
      'band2-name': 'Loser',
      winner: '1',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-row').classList.contains('winner')).toBe(true);
    expect(root.querySelector('.band1-row').classList.contains('loser')).toBe(false);
    expect(root.querySelector('.band2-row').classList.contains('loser')).toBe(true);
    expect(root.querySelector('.band2-row').classList.contains('winner')).toBe(false);
  });

  it('applies winner class when winner="2"', () => {
    const el = createElement({
      'band1-name': 'Loser',
      'band2-name': 'Winner',
      winner: '2',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-row').classList.contains('loser')).toBe(true);
    expect(root.querySelector('.band2-row').classList.contains('winner')).toBe(true);
  });

  it('does not apply winner/loser classes without winner attribute', () => {
    const el = createElement({
      'band1-name': 'A',
      'band2-name': 'B',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-row').classList.contains('winner')).toBe(false);
    expect(root.querySelector('.band1-row').classList.contains('loser')).toBe(false);
    expect(root.querySelector('.band2-row').classList.contains('winner')).toBe(false);
    expect(root.querySelector('.band2-row').classList.contains('loser')).toBe(false);
  });

  it('updates when attributes change dynamically', () => {
    const el = createElement({ 'band1-name': 'Before' });

    expect(el.shadowRoot.querySelector('[data-slot="band1-name"]').textContent).toBe('Before');

    el.setAttribute('band1-name', 'After');
    expect(el.shadowRoot.querySelector('[data-slot="band1-name"]').textContent).toBe('After');
  });

  it('renders empty strings for missing attributes', () => {
    const el = createElement({});
    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-seed"]').textContent).toBe('');
    expect(root.querySelector('[data-slot="band1-name"]').textContent).toBe('');
    expect(root.querySelector('[data-slot="band1-pct"]').textContent).toBe('');
  });
});
