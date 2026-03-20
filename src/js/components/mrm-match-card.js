/**
 * <mrm-match-card> – Full match voting card for MRM matches.
 *
 * Attributes:
 *   match-id        – Match identifier
 *   status          – "running" | "early" | "over"
 *   band1-name      – Full name of band 1
 *   band1-image     – Image URL for band 1
 *   band1-seed      – Seed number for band 1
 *   band1-sponsor   – Group sponsor name for band 1
 *   band2-name      – Full name of band 2
 *   band2-image     – Image URL for band 2
 *   band2-seed      – Seed number for band 2
 *   band2-sponsor   – Group sponsor name for band 2
 *   band1-pct       – Vote percentage for band 1 (e.g. "52%")
 *   band2-pct       – Vote percentage for band 2 (e.g. "48%")
 *   show-results    – Boolean attribute; when present, shows percentages
 *   has-voted       – Boolean attribute; when present, hides vote buttons
 *   winner          – "1" or "2"; dims the losing band image
 *   tied            – Boolean attribute; when present, shows tied-match message
 *   sponsor         – Sponsor name
 *   sponsor-msg     – Sponsor message
 *   voting-disabled – Boolean attribute; disables vote buttons
 *   login-url       – URL for login link (when present, shows "Log in to vote" instead of buttons)
 *   timer-text      – Text for the countdown timer display (e.g. "05:30")
 *
 * Events:
 *   mrm-vote – Dispatched when a user clicks a vote button.
 *              detail: { matchId: string, band: "1" | "2" }
 */

(function () {
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    font-size: 18px;
    margin: auto;
    padding: 20px 0 0;
    text-align: center;
  }

  table {
    margin: auto;
    border-collapse: collapse;
  }

  .band-name {
    font-weight: bold;
    text-align: center;
    width: 350px;
  }

  .band-cell {
    text-align: center;
  }

  .band-cell img {
    display: block;
    margin: auto;
    width: 200px;
    height: auto;
  }

  .band-cell img[src=""], .band-cell img:not([src]) {
    display: none;
  }

  .band-cell.loser img {
    border: 1px solid black;
    opacity: 0.35;
  }

  .vs-cell {
    font-family: 'Courier New', monospace;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    width: 100px;
  }

  .vote-pct {
    font-weight: bold;
    text-align: center;
    width: 350px;
  }

  .vote-area {
    text-align: center;
  }

  .vote-btn {
    display: inline-block;
    margin-top: 6px;
    padding: 6px 20px;
    border: 1px solid #3a7a3a;
    border-radius: 4px;
    background: linear-gradient(to bottom, #5cb85c, #449d44);
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
  }

  .vote-btn:hover:not(:disabled) {
    background: linear-gradient(to bottom, #449d44, #398439);
  }

  .vote-btn:disabled {
    background: #aaa;
    border-color: #999;
    cursor: not-allowed;
  }

  .login-link {
    display: inline-block;
    margin-top: 6px;
    padding: 6px 20px;
    border: 1px solid #222;
    border-radius: 4px;
    background: linear-gradient(to bottom, #555, #333);
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-decoration: none;
  }

  .login-link:hover {
    background: linear-gradient(to bottom, #444, #222);
  }

  .message {
    text-align: center;
    font-weight: bold;
    padding: 6px 0;
  }

  .band-sponsor {
    font-size: 12px;
    font-weight: normal;
    color: #592D00;
    font-style: italic;
  }

  .sponsor {
    text-align: center;
    padding: 8px 0;
    color: #592D00;
    font-weight: bold;
  }

  .hidden { display: none; }
</style>

<table>
  <tr>
    <td class="band-name">
      <div data-slot="band1-name"></div>
      <div class="band-sponsor hidden" data-slot="band1-sponsor"></div>
    </td>
    <td class="vs-cell" rowspan="3" data-slot="vs">VS</td>
    <td class="band-name">
      <div data-slot="band2-name"></div>
      <div class="band-sponsor hidden" data-slot="band2-sponsor"></div>
    </td>
  </tr>
  <tr>
    <td class="band-cell" data-slot="band1-image-wrap">
      <img data-slot="band1-image" alt="" />
    </td>
    <td class="band-cell" data-slot="band2-image-wrap">
      <img data-slot="band2-image" alt="" />
    </td>
  </tr>
  <tr>
    <td class="vote-pct" data-slot="band1-pct"></td>
    <td class="vote-pct" data-slot="band2-pct"></td>
  </tr>
  <tr data-slot="action-row">
    <td class="vote-area" data-slot="band1-vote">
      <button class="vote-btn" data-band="1" type="button">Vote!</button>
    </td>
    <td></td>
    <td class="vote-area" data-slot="band2-vote">
      <button class="vote-btn" data-band="2" type="button">Vote!</button>
    </td>
  </tr>
  <tr data-slot="login-row" class="hidden">
    <td class="vote-area" data-slot="band1-login">
      <a class="login-link" data-slot="band1-login-link" href="#">Log in to vote</a>
    </td>
    <td></td>
    <td class="vote-area" data-slot="band2-login">
      <a class="login-link" data-slot="band2-login-link" href="#">Log in to vote</a>
    </td>
  </tr>
  <tr data-slot="message-row" class="hidden">
    <td colspan="3" class="message" data-slot="message"></td>
  </tr>
</table>
<div class="sponsor hidden" data-slot="sponsor"></div>
`;

class MrmMatchCard extends HTMLElement {
  static get observedAttributes() {
    return [
      'match-id', 'status',
      'band1-name', 'band1-image', 'band1-seed', 'band1-sponsor',
      'band2-name', 'band2-image', 'band2-seed', 'band2-sponsor',
      'band1-pct', 'band2-pct',
      'show-results', 'has-voted', 'winner', 'tied',
      'sponsor', 'sponsor-msg', 'voting-disabled',
      'login-url', 'timer-text',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    this._handleVoteClick = this._handleVoteClick.bind(this);
  }

  connectedCallback() {
    this._render();
    this.shadowRoot.querySelectorAll('.vote-btn').forEach((btn) => {
      btn.addEventListener('click', this._handleVoteClick);
    });
  }

  disconnectedCallback() {
    this.shadowRoot.querySelectorAll('.vote-btn').forEach((btn) => {
      btn.removeEventListener('click', this._handleVoteClick);
    });
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._render();
  }

  _handleVoteClick(e) {
    const band = e.currentTarget.getAttribute('data-band');
    const matchId = this.getAttribute('match-id');
    this.dispatchEvent(new CustomEvent('mrm-vote', {
      bubbles: true,
      composed: true,
      detail: { matchId, band },
    }));
  }

  _render() {
    const root = this.shadowRoot;
    const status = this.getAttribute('status') || 'early';
    const showResults = this.hasAttribute('show-results');
    const hasVoted = this.hasAttribute('has-voted');
    const isRunning = status === 'running';
    const votingDisabled = this.hasAttribute('voting-disabled');
    const loginUrl = this.getAttribute('login-url');
    const timerText = this.getAttribute('timer-text');
    const winner = this.getAttribute('winner');
    const isTied = this.hasAttribute('tied');

    // VS / Timer cell — shows countdown when running, "VS" otherwise
    const vsCell = root.querySelector('[data-slot="vs"]');
    if (isRunning && timerText) {
      vsCell.textContent = timerText;
    } else if (isRunning) {
      vsCell.textContent = '--:--:--';
    } else {
      vsCell.textContent = 'VS';
    }

    // Band names
    root.querySelector('[data-slot="band1-name"]').textContent =
      this.getAttribute('band1-name') ?? '';
    root.querySelector('[data-slot="band2-name"]').textContent =
      this.getAttribute('band2-name') ?? '';

    // Band sponsors (group-level)
    ['1', '2'].forEach((n) => {
      const sponsorVal = this.getAttribute(`band${n}-sponsor`);
      const el = root.querySelector(`[data-slot="band${n}-sponsor"]`);
      if (sponsorVal) {
        el.textContent = `Sponsored by: ${sponsorVal}`;
        el.classList.remove('hidden');
      } else {
        el.textContent = '';
        el.classList.add('hidden');
      }
    });

    // Band images
    const img1 = root.querySelector('[data-slot="band1-image"]');
    const img2 = root.querySelector('[data-slot="band2-image"]');
    img1.src = this.getAttribute('band1-image') ?? '';
    img1.alt = this.getAttribute('band1-name') ?? '';
    img2.src = this.getAttribute('band2-image') ?? '';
    img2.alt = this.getAttribute('band2-name') ?? '';

    // Loser image dimming
    const imgWrap1 = root.querySelector('[data-slot="band1-image-wrap"]');
    const imgWrap2 = root.querySelector('[data-slot="band2-image-wrap"]');
    imgWrap1.classList.toggle('loser', winner === '2');
    imgWrap2.classList.toggle('loser', winner === '1');

    // Vote percentages
    const pct1 = root.querySelector('[data-slot="band1-pct"]');
    const pct2 = root.querySelector('[data-slot="band2-pct"]');
    pct1.textContent = this.getAttribute('band1-pct') ?? '';
    pct2.textContent = this.getAttribute('band2-pct') ?? '';

    // Vote buttons vs login links
    const needsLogin = isRunning && !hasVoted && loginUrl;
    const showVoteButtons = isRunning && !hasVoted && !votingDisabled && !loginUrl;

    const actionRow = root.querySelector('[data-slot="action-row"]');
    actionRow.classList.toggle('hidden', !showVoteButtons);
    const band1Name = this.getAttribute('band1-name') || '';
    const band2Name = this.getAttribute('band2-name') || '';
    root.querySelectorAll('.vote-btn').forEach((btn) => {
      btn.disabled = votingDisabled;
      const bandNum = btn.getAttribute('data-band');
      btn.setAttribute('aria-label', `Vote for ${bandNum === '1' ? band1Name : band2Name}`);
    });

    const loginRow = root.querySelector('[data-slot="login-row"]');
    loginRow.classList.toggle('hidden', !needsLogin);
    if (loginUrl) {
      root.querySelectorAll('.login-link').forEach((link) => {
        link.href = loginUrl;
      });
    }

    // Status message
    const messageRow = root.querySelector('[data-slot="message-row"]');
    const messageEl = root.querySelector('[data-slot="message"]');
    let message = '';
    if (status === 'early') {
      message = 'Voting has not started yet';
    } else if (status === 'over' && isTied) {
      message = 'Match is over and tied - vote for the winner';
    } else if (status === 'over') {
      message = 'Voting is now over';
    } else if (hasVoted) {
      message = 'Thanks for voting!';
    }
    messageEl.textContent = message;
    messageRow.classList.toggle('hidden', !message);

    // Sponsor
    const sponsorEl = root.querySelector('[data-slot="sponsor"]');
    const sponsor = this.getAttribute('sponsor');
    const sponsorMsg = this.getAttribute('sponsor-msg') ?? '';
    if (sponsor) {
      sponsorEl.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = `Match sponsored by: ${sponsor}`;
      sponsorEl.appendChild(strong);
      if (sponsorMsg) {
        const div = document.createElement('div');
        div.textContent = sponsorMsg;
        sponsorEl.appendChild(div);
      }
      sponsorEl.classList.remove('hidden');
    } else {
      sponsorEl.classList.add('hidden');
    }
  }
}

if (!customElements.get('mrm-match-card')) {
  customElements.define('mrm-match-card', MrmMatchCard);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MrmMatchCard };
}
})();
