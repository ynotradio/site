/**
 * MRM Web Components – Registration entry point.
 *
 * Include this file once (via <script src="…"> or import) to register all
 * Modern Rock Madness custom elements:
 *
 *   <mrm-bracket-match>  – compact bracket slot
 *   <mrm-scoreboard>     – vote-percentage bar
 *   <mrm-match-card>     – full match voting card
 */

// Side-effect imports register each element via customElements.define().
// Safe to import multiple times – each file guards against double-registration.

// eslint-disable-next-line no-unused-vars
const _bracket = require('./MrmBracketMatch.js');
// eslint-disable-next-line no-unused-vars
const _scoreboard = require('./MrmScoreboard.js');
// eslint-disable-next-line no-unused-vars
const _card = require('./MrmMatchCard.js');
