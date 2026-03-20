/**
 * <mrm-bracket-match> – A single match slot in the MRM tournament bracket.
 *
 * Attributes:
 *   band1-seed, band1-name, band1-pct, band1-sponsor,
 *   band2-seed, band2-name, band2-pct, band2-sponsor,
 *   winner ("1" | "2"), live (boolean), match-id
 *
 * Uses LIGHT DOM rendering so the bracket's external CSS
 * (madness.css with .mrm-bracket__region .match, .mrm-bracket__match--final, etc.)
 * can position and style the element. Class names match the original PHP output:
 *   .band1 / .band2, .seed, .band_abbr, .percentage, .mrm_winner / .mrm_loser
 *
 * In production the element is wrapped with class="match left|right live_match"
 * by the PHP partial so existing layout CSS applies unchanged.
 */

class MrmBracketMatch extends HTMLElement {
  static get observedAttributes() {
    return [
      'band1-seed', 'band1-name', 'band1-pct', 'band1-sponsor',
      'band2-seed', 'band2-name', 'band2-pct', 'band2-sponsor',
      'winner', 'live', 'match-id',
    ];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const winner = this.getAttribute('winner');

    const winnerClass1 = winner === '1' ? ' mrm_winner' : (winner === '2' ? ' mrm_loser' : '');
    const winnerClass2 = winner === '2' ? ' mrm_winner' : (winner === '1' ? ' mrm_loser' : '');

    const b1seed = this.getAttribute('band1-seed') ?? '';
    const b1name = this.getAttribute('band1-name') ?? '';
    const b1pct = this.getAttribute('band1-pct');
    const b1sponsor = this.getAttribute('band1-sponsor') ?? '';
    const b2seed = this.getAttribute('band2-seed') ?? '';
    const b2name = this.getAttribute('band2-name') ?? '';
    const b2pct = this.getAttribute('band2-pct');
    const b2sponsor = this.getAttribute('band2-sponsor') ?? '';

    const b1title = b1sponsor ? ` title="Sponsored by: ${this._escAttr(b1sponsor)}"` : '';
    const b2title = b2sponsor ? ` title="Sponsored by: ${this._escAttr(b2sponsor)}"` : '';

    this.innerHTML = `<dl>
  <dt class="band1${winnerClass1}"${b1title}>
    <span class="seed">${this._esc(b1seed)}</span>
    <span class="band_abbr">${this._esc(b1name)}</span>
    ${b1pct != null ? `<span class="percentage">${this._esc(b1pct)}</span>` : ''}
    ${b1sponsor ? `<span class="band_sponsor">${this._esc(b1sponsor)}</span>` : ''}
  </dt>
  <dt class="band2${winnerClass2}"${b2title}>
    <span class="seed">${this._esc(b2seed)}</span>
    <span class="band_abbr">${this._esc(b2name)}</span>
    ${b2pct != null ? `<span class="percentage">${this._esc(b2pct)}</span>` : ''}
    ${b2sponsor ? `<span class="band_sponsor">${this._esc(b2sponsor)}</span>` : ''}
  </dt>
</dl>`;
  }

  /** Simple HTML-entity escape for text content. */
  _esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  /** Escape for use in HTML attribute values. */
  _escAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Register only once (safe for re-imports)
if (!customElements.get('mrm-bracket-match')) {
  customElements.define('mrm-bracket-match', MrmBracketMatch);
}

// Export for testing (Node.js / ESM / CJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MrmBracketMatch };
}
