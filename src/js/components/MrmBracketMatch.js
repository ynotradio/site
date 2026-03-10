/**
 * <mrm-bracket-match> – A single match slot in the MRM tournament bracket.
 *
 * Attributes:
 *   band1-seed, band1-name, band1-pct,
 *   band2-seed, band2-name, band2-pct,
 *   winner ("1" | "2"), live (boolean), match-id, side ("left" | "right")
 *
 * Renders a compact two-row display (seed · abbreviation · percentage) with
 * winner / live styling via Shadow DOM so it can be dropped into any context.
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    border: 1px solid black;
    height: 40px;
    font-size: 10px;
    margin: 0 0 12px 0;
    width: 120px;
    box-sizing: border-box;
    font-family: sans-serif;
  }

  :host([side="left"]) {
    border-width: 1px 1px 1px 0;
    border-radius: 0 5px 5px 0;
    background-image: linear-gradient(to right, #fafbfb, #eaebeb);
  }

  :host([side="right"]) {
    border-width: 1px 0 1px 1px;
    border-radius: 5px 0 0 5px;
    background-image: linear-gradient(to left, #fafbfb, #eaebeb);
  }

  :host([live]) {
    background: black;
    color: white;
  }

  dl {
    margin: 0;
    padding: 0;
  }

  dt {
    display: flex;
    align-items: center;
    height: 20px;
    line-height: 20px;
  }

  dt::after { content: ''; }

  .seed {
    display: inline-block;
    font-size: 8px;
    padding: 0 15px 0 5px;
    text-align: right;
    width: 11px;
    flex-shrink: 0;
  }

  .name {
    display: inline-block;
    width: 50px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pct {
    position: relative;
    left: 12px;
  }

  .winner {
    font-weight: bold;
  }

  .loser {
    color: grey;
  }
</style>
<dl>
  <dt class="band1-row">
    <span class="seed" data-slot="band1-seed"></span>
    <span class="name" data-slot="band1-name"></span>
    <span class="pct" data-slot="band1-pct"></span>
  </dt>
  <dt class="band2-row">
    <span class="seed" data-slot="band2-seed"></span>
    <span class="name" data-slot="band2-name"></span>
    <span class="pct" data-slot="band2-pct"></span>
  </dt>
</dl>
`;

class MrmBracketMatch extends HTMLElement {
  static get observedAttributes() {
    return [
      'band1-seed', 'band1-name', 'band1-pct',
      'band2-seed', 'band2-name', 'band2-pct',
      'winner', 'live', 'match-id', 'side',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._render();
  }

  _render() {
    const root = this.shadowRoot;

    const setText = (selector, value) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value ?? '';
    };

    setText('[data-slot="band1-seed"]', this.getAttribute('band1-seed'));
    setText('[data-slot="band1-name"]', this.getAttribute('band1-name'));
    setText('[data-slot="band1-pct"]', this.getAttribute('band1-pct'));
    setText('[data-slot="band2-seed"]', this.getAttribute('band2-seed'));
    setText('[data-slot="band2-name"]', this.getAttribute('band2-name'));
    setText('[data-slot="band2-pct"]', this.getAttribute('band2-pct'));

    const winner = this.getAttribute('winner');
    const band1Row = root.querySelector('.band1-row');
    const band2Row = root.querySelector('.band2-row');

    band1Row.classList.toggle('winner', winner === '1');
    band1Row.classList.toggle('loser', winner === '2');
    band2Row.classList.toggle('winner', winner === '2');
    band2Row.classList.toggle('loser', winner === '1');
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
