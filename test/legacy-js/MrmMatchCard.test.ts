/**
 * Tests for <mrm-match-card> custom element.
 *
 * Validates attribute-driven rendering, vote button visibility,
 * status messages, sponsor display, timer, login-url, winner/loser
 * dimming, and the mrm-vote custom event.
 *
 * The component uses a table-based Shadow DOM layout:
 *   - Band names in [data-slot="band1-name"] / [data-slot="band2-name"]
 *   - Images in [data-slot="band1-image"] / [data-slot="band2-image"]
 *   - VS/timer in [data-slot="vs"] cell
 *   - Percentages in [data-slot="band1-pct"] / [data-slot="band2-pct"]
 *   - Vote buttons in [data-slot="action-row"] (hidden class toggles row)
 *   - Login links in [data-slot="login-row"] (hidden class toggles row)
 *   - Status message in [data-slot="message-row"] / [data-slot="message"]
 *   - Sponsor in [data-slot="sponsor"]
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
require('../../src/js/components/mrm-match-card.js');

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

  it('shows timer text in VS cell when status=running and timer-text is set', () => {
    const el = createElement({ status: 'running', 'timer-text': '05:30' });
    const vsCell = el.shadowRoot.querySelector('[data-slot="vs"]');
    expect(vsCell.textContent).toBe('05:30');
  });

  it('shows placeholder in VS cell when status=running and no timer-text', () => {
    const el = createElement({ status: 'running' });
    const vsCell = el.shadowRoot.querySelector('[data-slot="vs"]');
    expect(vsCell.textContent).toBe('--:--:--');
  });

  it('shows VS in VS cell when status is not running', () => {
    const el = createElement({ status: 'early' });
    const vsCell = el.shadowRoot.querySelector('[data-slot="vs"]');
    expect(vsCell.textContent).toBe('VS');
  });

  it('shows vote percentages when show-results is set', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
      'show-results': true,
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-pct"]').textContent).toBe('55%');
    expect(root.querySelector('[data-slot="band2-pct"]').textContent).toBe('45%');
  });

  it('renders percentage attributes as text content even without show-results', () => {
    const el = createElement({
      'band1-pct': '55%',
      'band2-pct': '45%',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-pct"]').textContent).toBe('55%');
  });

  it('shows vote buttons when status=running and has-voted is absent', () => {
    const el = createElement({ status: 'running' });
    const actionRow = el.shadowRoot.querySelector('[data-slot="action-row"]');
    expect(actionRow.classList.contains('hidden')).toBe(false);
  });

  it('hides vote buttons when has-voted is set', () => {
    const el = createElement({ status: 'running', 'has-voted': true });
    const actionRow = el.shadowRoot.querySelector('[data-slot="action-row"]');
    expect(actionRow.classList.contains('hidden')).toBe(true);
  });

  it('hides vote buttons when status is not running', () => {
    const el = createElement({ status: 'over' });
    const actionRow = el.shadowRoot.querySelector('[data-slot="action-row"]');
    expect(actionRow.classList.contains('hidden')).toBe(true);
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
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent).toBe(
      'Voting has not started yet',
    );
  });

  it('shows "Voting is now over" when status=over', () => {
    const el = createElement({ status: 'over' });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent).toBe(
      'Voting is now over',
    );
  });

  it('shows tied-match message when status=over and tied is set', () => {
    const el = createElement({ status: 'over', tied: true });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent).toBe(
      'Match is over and tied - vote for the winner',
    );
  });

  it('shows "Thanks for voting!" when status=running and has-voted', () => {
    const el = createElement({ status: 'running', 'has-voted': true });
    expect(el.shadowRoot.querySelector('[data-slot="message"]').textContent).toBe(
      'Thanks for voting!',
    );
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

  it('shows login links when login-url is set instead of vote buttons', () => {
    const el = createElement({
      status: 'running',
      'login-url': '/auth/login',
    });
    const root = el.shadowRoot;

    // Login row visible
    const loginRow = root.querySelector('[data-slot="login-row"]');
    expect(loginRow.classList.contains('hidden')).toBe(false);

    const loginLink = root.querySelector('[data-slot="band1-login-link"]');
    expect(loginLink.getAttribute('href')).toBe('/auth/login');

    // Vote buttons row should be hidden
    const actionRow = root.querySelector('[data-slot="action-row"]');
    expect(actionRow.classList.contains('hidden')).toBe(true);
  });

  it('displays band-level sponsor under band1 name when band1-sponsor is set', () => {
    const el = createElement({
      'band1-name': 'Radiohead',
      'band1-sponsor': 'Jane Doe',
      'band2-name': 'Muse',
    });

    const root = el.shadowRoot;
    const sponsorEl = root.querySelector('[data-slot="band1-sponsor"]');
    expect(sponsorEl.classList.contains('hidden')).toBe(false);
    expect(sponsorEl.textContent).toBe('Sponsored by: Jane Doe');
  });

  it('displays band-level sponsor under band2 name when band2-sponsor is set', () => {
    const el = createElement({
      'band1-name': 'Radiohead',
      'band2-name': 'Muse',
      'band2-sponsor': 'John Smith',
    });

    const root = el.shadowRoot;
    const sponsorEl = root.querySelector('[data-slot="band2-sponsor"]');
    expect(sponsorEl.classList.contains('hidden')).toBe(false);
    expect(sponsorEl.textContent).toBe('Sponsored by: John Smith');
  });

  it('hides band-level sponsor slots when no sponsor attributes are set', () => {
    const el = createElement({
      'band1-name': 'Radiohead',
      'band2-name': 'Muse',
    });

    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-sponsor"]').classList.contains('hidden')).toBe(true);
    expect(root.querySelector('[data-slot="band2-sponsor"]').classList.contains('hidden')).toBe(true);
  });

  it('dims losing band image when winner="1"', () => {
    const el = createElement({
      winner: '1',
      'band1-image': 'a.jpg',
      'band2-image': 'b.jpg',
    });
    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-image-wrap"]').classList.contains('loser')).toBe(
      false,
    );
    expect(root.querySelector('[data-slot="band2-image-wrap"]').classList.contains('loser')).toBe(
      true,
    );
  });

  it('dims losing band image when winner="2"', () => {
    const el = createElement({
      winner: '2',
      'band1-image': 'a.jpg',
      'band2-image': 'b.jpg',
    });
    const root = el.shadowRoot;
    expect(root.querySelector('[data-slot="band1-image-wrap"]').classList.contains('loser')).toBe(
      true,
    );
    expect(root.querySelector('[data-slot="band2-image-wrap"]').classList.contains('loser')).toBe(
      false,
    );
  });
});
