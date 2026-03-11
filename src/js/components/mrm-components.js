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
require('./mrm-bracket-match.js');
require('./mrm-scoreboard.js');
require('./mrm-match-card.js');
