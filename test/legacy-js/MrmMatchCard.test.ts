/**
 * Tests for <mrm-match-card> custom element.
 *
 * Validates attribute-driven rendering, vote button visibility,
 * status messages, sponsor display, and the mrm-vote custom event.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
require('../../src/js/components/MrmMatchCard.js');

const createElement = (attrs = {}) => {
  const el = document.createElement('mrm-match-card');
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

describe('MrmMatchCard', () => {
  beforeAll(() => {
    expect(customElements.get('mrm-match-card')).toBeDefined();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders band names from attributes', () => {
    const el = createElement({
      'band1-name': 'Radiohead',
      'band2-name': 'Muse',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-name"]').textContent).toBe('Radiohead');
    expect(root.querySelector('[data-slot="band2-name"]').textContent).toBe('Muse');
  });

  it('renders band images with alt text', () => {
    const el = createElement({
      'band1-name': 'Radiohead',
      'band1-image': 'https://example.com/rh.jpg',
      'band2-name': 'Muse',
      'band2-image': 'https://example.com/muse.jpg',
    });

    const root = el.shadowRoot;
    const img1 = root.querySelector('[data-slot="band1-image"]');
    const img2 = root.querySelector('[data-slot="band2-image"]');
    expect(img1.src).toBe('https://example.com/rh.jpg');
    expect(img1.alt).toBe('Radiohead');
    expect(img2.src).toBe('https://example.com/muse.jpg');
    expect(img2.alt).toBe('Muse');
  });

  it('shows LIVE header when status is running', () => {
    const el = createElement({ status: 'running' });
    const header = el.shadowRoot.querySelector('.header');
    expect(header.textContent).toBe('🔴 LIVE');
    expect(header.classList.contains('live')).toBe(true);
  });

  it('shows VS header when status is not running', () => {
    const el = createElement({ status: 'early' });
    expect(el.shadowRoot.querySelector('.header').textContent).toBe('VS');
  });

  it('shows vote percentages when show-results is set', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
      'show-results': true,
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-pct"]').classList.contains('hidden')).toBe(false);
    expect(root.querySelector('[data-slot="band1-pct"]').textContent).toBe('55%');
  });

  it('hides vote percentages when show-results is absent', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-pct"]').classList.contains('hidden')).toBe(true);
  });

  it('shows vote buttons when status=running and has-voted is absent', () => {
    const el = createElement({ status: 'running' });
    const voteAreas = el.shadowRoot.querySelectorAll('.vote-area');
    voteAreas.forEach((area) => {
      expect(area.classList.contains('hidden')).toBe(false);
    });
  });

  it('hides vote buttons when has-voted is set', () => {
    const el = createElement({ status: 'running', 'has-voted': true });
    const voteAreas = el.shadowRoot.querySelectorAll('.vote-area');
    voteAreas.forEach((area) => {
      expect(area.classList.contains('hidden')).toBe(true);
    });
  });

  it('hides vote buttons when status is not running', () => {
    const el = createElement({ status: 'over' });
    const voteAreas = el.shadowRoot.querySelectorAll('.vote-area');
    voteAreas.forEach((area) => {
      expect(area.classList.contains('hidden')).toBe(true);
    });
  });

  it('dispatches mrm-vote event when vote button is clicked', () => {
    const el = createElement({ status: 'running', 'match-id': '42' });

    const handler = vi.fn();
    el.addEventListener('mrm-vote', handler);

    const btn = el.shadowRoot.querySelector('[data-band="1"]');
    btn.click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail).toEqual({ matchId: '42', band: '1' });
  });

  it('dispatches mrm-vote with band=2 for band2 button', () => {
    const el = createElement({ status: 'running', 'match-id': '7' });

    const handler = vi.fn();
    el.addEventListener('mrm-vote', handler);

    el.shadowRoot.querySelector('[data-band="2"]').click();
    expect(handler.mock.calls[0][0].detail).toEqual({ matchId: '7', band: '2' });
  });

  it('shows "Voting has not started yet" when status=early', () => {
    const el = createElement({ status: 'early' });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent)
      .toBe('Voting has not started yet');
  });

  it('shows "Voting is now over" when status=over', () => {
    const el = createElement({ status: 'over' });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent)
      .toBe('Voting is now over');
  });

  it('shows "Thanks for voting!" when status=running and has-voted', () => {
    const el = createElement({ status: 'running', 'has-voted': true });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent)
      .toBe('Thanks for voting!');
  });

  it('displays sponsor information when sponsor attribute is set', () => {
    const el = createElement({
      sponsor: 'Acme Co',
      'sponsor-msg': 'Rock on!',
    });

    const sponsorEl = el.shadowRoot.querySelector('[data-slot="sponsor"]');
    expect(sponsorEl.classList.contains('hidden')).toBe(false);
    expect(sponsorEl.textContent).toContain('Acme Co');
    expect(sponsorEl.textContent).toContain('Rock on!');
  });

  it('hides sponsor section when sponsor attribute is absent', () => {
    const el = createElement({});
    const sponsorEl = el.shadowRoot.querySelector('[data-slot="sponsor"]');
    expect(sponsorEl.classList.contains('hidden')).toBe(true);
  });
});
