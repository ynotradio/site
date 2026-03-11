/**
 * <mrm-scoreboard> – Horizontal vote-percentage bar for MRM matches.
 *
 * Attributes:
 *   band1-pct  – Vote percentage for band 1 (number, 0–100)
 *   band2-pct  – Vote percentage for band 2 (number, 0–100)
 *   band1-label – Display text for band 1 score (e.g. "52%")
 *   band2-label – Display text for band 2 score (e.g. "48%")
 *
 * Renders a two-tone bar (orange ← | → blue) sized to the percentages.
 * Uses Shadow DOM so it is fully encapsulated and reusable.
 */

(function () {
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    font-family: sans-serif;
  }

  .scoreboard {
    display: flex;
    width: 100%;
    border-collapse: collapse;
    font-size: 18px;
    border: 1px solid black;
    border-radius: 4px;
    overflow: hidden;
    height: 28px;
    box-sizing: border-box;
  }

  .band1-score, .band2-score {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    font-weight: bold;
    min-width: 40px;
    white-space: nowrap;
  }

  .band1-score {
    background-color: #FFA500;
    color: black;
  }

  .band2-score {
    background-color: #1047A9;
    color: white;
  }

  .band1-bar {
    background-image: linear-gradient(to right, #FFA500, black);
    transition: flex-basis 0.4s ease;
  }

  .band2-bar {
    background-image: linear-gradient(to left, #1047A9, black);
    transition: flex-basis 0.4s ease;
  }
</style>
<div class="scoreboard" role="img">
  <span class="band1-score" data-slot="band1-label"></span>
  <span class="band1-bar"></span>
  <span class="band2-bar"></span>
  <span class="band2-score" data-slot="band2-label"></span>
</div>
`;

class MrmScoreboard extends HTMLElement {
  static get observedAttributes() {
    return ['band1-pct', 'band2-pct', 'band1-label', 'band2-label'];
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

    const band1Pct = parseFloat(this.getAttribute('band1-pct')) || 0;
    const band2Pct = parseFloat(this.getAttribute('band2-pct')) || 0;

    // When both percentages are zero (no votes yet), display as a 50/50 tie
    // so the bar fills completely with both gradients, matching PHP behavior.
    const noVotes = band1Pct === 0 && band2Pct === 0;
    const band1Width = noVotes ? 50 : band1Pct;
    const band2Width = noVotes ? 50 : band2Pct;

    const band1Label = this.getAttribute('band1-label') ?? '';
    const band2Label = this.getAttribute('band2-label') ?? '';

    root.querySelector('[data-slot="band1-label"]').textContent = band1Label;
    root.querySelector('[data-slot="band2-label"]').textContent = band2Label;

    root.querySelector('.band1-bar').style.flexBasis = `${band1Width}%`;
    root.querySelector('.band2-bar').style.flexBasis = `${band2Width}%`;

    // Accessible label
    root.querySelector('.scoreboard').setAttribute(
      'aria-label',
      `Score: ${band1Label} vs ${band2Label}`,
    );
  }
}

if (!customElements.get('mrm-scoreboard')) {
  customElements.define('mrm-scoreboard', MrmScoreboard);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MrmScoreboard };
}
})();
