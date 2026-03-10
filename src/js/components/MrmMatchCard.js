/**
 * <mrm-match-card> – Full match voting card for MRM matches.
 *
 * Attributes:
 *   match-id        – Match identifier
 *   status          – "running" | "early" | "over"
 *   band1-name      – Full name of band 1
 *   band1-image     – Image URL for band 1
 *   band1-seed      – Seed number for band 1
 *   band2-name      – Full name of band 2
 *   band2-image     – Image URL for band 2
 *   band2-seed      – Seed number for band 2
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

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    font-family: sans-serif;
    max-width: 760px;
    margin: 0 auto;
  }

  .card {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  .header {
    text-align: center;
    padding: 10px;
    font-size: 18px;
    font-weight: bold;
    background: #f5f5f5;
    border-bottom: 1px solid #ccc;
  }

  .header.live {
    background: #222;
    color: #ff4444;
  }

  .timer {
    text-align: center;
    padding: 4px 10px;
    font-size: 14px;
    font-weight: bold;
    color: #333;
    background: #f5f5f5;
    border-bottom: 1px solid #eee;
  }

  .timer.hidden { display: none; }

  .bands {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0;
    align-items: center;
    padding: 20px;
  }

  .band {
    text-align: center;
  }

  .band-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .band-image img {
    display: block;
    margin: 0 auto;
    width: 200px;
    height: auto;
    border-radius: 4px;
  }

  .band-image img[src=""], .band-image img:not([src]) {
    display: none;
  }

  .band-image.loser img {
    border: 1px solid black;
    opacity: 0.35;
  }

  .vote-pct {
    margin-top: 8px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }

  .vs {
    font-family: 'Courier New', monospace;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    padding: 0 20px;
  }

  .vote-btn {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    background: #4CAF50;
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }

  .vote-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .vote-btn:disabled {
    background: #aaa;
    cursor: not-allowed;
  }

  .login-link {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 24px;
    border-radius: 4px;
    background: #4CAF50;
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-decoration: none;
    transition: background 0.2s;
  }

  .login-link:hover {
    background: #45a049;
  }

  .message {
    text-align: center;
    padding: 8px;
    font-weight: bold;
    color: #666;
    border-top: 1px solid #eee;
  }

  .sponsor {
    text-align: center;
    padding: 8px;
    border-top: 1px solid #eee;
    color: #592D00;
    font-weight: bold;
  }

  .hidden { display: none; }
</style>

<div class="card">
  <div class="header" data-slot="header">VS</div>
  <div class="timer hidden" data-slot="timer"></div>
  <div class="bands">
    <div class="band band1">
      <div class="band-name" data-slot="band1-name"></div>
      <div class="band-image" data-slot="band1-image-wrap">
        <img data-slot="band1-image" alt="" />
      </div>
      <div class="vote-pct hidden" data-slot="band1-pct"></div>
      <div class="vote-area" data-slot="band1-vote">
        <button class="vote-btn" data-band="1" type="button">Vote!</button>
      </div>
      <div class="login-area hidden" data-slot="band1-login">
        <a class="login-link" data-slot="band1-login-link" href="#">Log in to vote</a>
      </div>
    </div>
    <div class="vs">VS</div>
    <div class="band band2">
      <div class="band-name" data-slot="band2-name"></div>
      <div class="band-image" data-slot="band2-image-wrap">
        <img data-slot="band2-image" alt="" />
      </div>
      <div class="vote-pct hidden" data-slot="band2-pct"></div>
      <div class="vote-area" data-slot="band2-vote">
        <button class="vote-btn" data-band="2" type="button">Vote!</button>
      </div>
      <div class="login-area hidden" data-slot="band2-login">
        <a class="login-link" data-slot="band2-login-link" href="#">Log in to vote</a>
      </div>
    </div>
  </div>
  <div class="message hidden" data-slot="message"></div>
  <div class="sponsor hidden" data-slot="sponsor"></div>
</div>
`;

class MrmMatchCard extends HTMLElement {
  static get observedAttributes() {
    return [
      'match-id', 'status',
      'band1-name', 'band1-image', 'band1-seed',
      'band2-name', 'band2-image', 'band2-seed',
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

    // Header
    const header = root.querySelector('.header');
    if (isRunning) {
      header.classList.add('live');
      header.textContent = '🔴 LIVE';
    } else {
      header.classList.remove('live');
      header.textContent = 'VS';
    }

    // Countdown timer
    const timerEl = root.querySelector('[data-slot="timer"]');
    if (timerText) {
      timerEl.textContent = `Time Remaining: ${timerText}`;
      timerEl.classList.remove('hidden');
    } else {
      timerEl.classList.add('hidden');
    }

    // Band names
    root.querySelector('[data-slot="band1-name"]').textContent =
      this.getAttribute('band1-name') ?? '';
    root.querySelector('[data-slot="band2-name"]').textContent =
      this.getAttribute('band2-name') ?? '';

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
    pct1.classList.toggle('hidden', !showResults);
    pct2.classList.toggle('hidden', !showResults);

    // Vote buttons vs login links
    const needsLogin = isRunning && !hasVoted && loginUrl;
    const showVoteButtons = isRunning && !hasVoted && !votingDisabled && !loginUrl;

    root.querySelectorAll('.vote-area').forEach((area) => {
      area.classList.toggle('hidden', !showVoteButtons);
    });
    root.querySelectorAll('.vote-btn').forEach((btn) => {
      btn.disabled = votingDisabled;
    });

    root.querySelectorAll('.login-area').forEach((area) => {
      area.classList.toggle('hidden', !needsLogin);
    });
    if (loginUrl) {
      root.querySelectorAll('.login-link').forEach((link) => {
        link.href = loginUrl;
      });
    }

    // Status message
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
    messageEl.classList.toggle('hidden', !message);

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
