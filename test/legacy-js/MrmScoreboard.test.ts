/**
 * Tests for <mrm-scoreboard> custom element.
 *
 * Validates attribute-driven rendering of the vote-percentage bar,
 * accessible labelling, and dynamic updates.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
require('../../src/js/components/MrmScoreboard.js');

const createElement = (attrs = {}) => {
  const el = document.createElement('mrm-scoreboard');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, String(value));
  });
  document.body.appendChild(el);
  return el;
};

describe('MrmScoreboard', () => {
  beforeAll(() => {
    expect(customElements.get('mrm-scoreboard')).toBeDefined();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders band labels', () => {
    const el = createElement({
      'band1-label': '52%',
      'band2-label': '48%',
      'band1-pct': '52',
      'band2-pct': '48',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-label"]').textContent).toBe('52%');
    expect(root.querySelector('[data-slot="band2-label"]').textContent).toBe('48%');
  });

  it('sets bar flex-basis from pct attributes', () => {
    const el = createElement({
      'band1-pct': '60',
      'band2-pct': '40',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-bar').style.flexBasis).toBe('60%');
    expect(root.querySelector('.band2-bar').style.flexBasis).toBe('40%');
  });

  it('sets accessible aria-label on the scoreboard', () => {
    const el = createElement({
      'band1-label': '52%',
      'band2-label': '48%',
    });

    const scoreboard = el.shadowRoot.querySelector('.scoreboard');
    expect(scoreboard.getAttribute('aria-label')).toBe('Score: 52% vs 48%');
  });

  it('defaults to 0% when pct attributes are missing', () => {
    const el = createElement({});

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-bar').style.flexBasis).toBe('0%');
    expect(root.querySelector('.band2-bar').style.flexBasis).toBe('0%');
  });

  it('updates dynamically when attributes change', () => {
    const el = createElement({
      'band1-pct': '50',
      'band2-pct': '50',
      'band1-label': '50%',
      'band2-label': '50%',
    });

    el.setAttribute('band1-pct', '75');
    el.setAttribute('band2-pct', '25');
    el.setAttribute('band1-label', '75%');
    el.setAttribute('band2-label', '25%');

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-bar').style.flexBasis).toBe('75%');
    expect(root.querySelector('.band2-bar').style.flexBasis).toBe('25%');
    expect(root.querySelector('[data-slot="band1-label"]').textContent).toBe('75%');
    expect(root.querySelector('[data-slot="band2-label"]').textContent).toBe('25%');
  });

  it('handles non-numeric pct gracefully (treats as 0)', () => {
    const el = createElement({
      'band1-pct': 'abc',
      'band2-pct': '',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('.band1-bar').style.flexBasis).toBe('0%');
    expect(root.querySelector('.band2-bar').style.flexBasis).toBe('0%');
  });
});
