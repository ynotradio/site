'use client';

import React from 'react';

const QUICK_LINKS = [
  { icon: '🏆', title: 'Tournaments', href: '/admin/collections/modern-rock-madness-tournaments' },
  { icon: '🎸', title: 'Groups (Bands)', href: '/admin/collections/modern-rock-madness-groups' },
  { icon: '⚔️', title: 'Matches', href: '/admin/collections/modern-rock-madness-matches' },
  { icon: '🗳️', title: 'Votes', href: '/admin/collections/modern-rock-madness-votes' },
  { icon: '🔴', title: 'Live Dashboard', href: '/admin/mrm-live' },
];

export const MRMTab: React.FC = () => (
  <div>
    <div className="editor-guide__tip">
      💡 <strong>Modern Rock Madness</strong> runs as a 63-match bracket tournament. Each year you
      create one Tournament, seed 64 Groups (bands), and Payload scaffolds all 63 Matches
      automatically.
    </div>

    <h2 className="editor-guide__section-title">Setup Workflow</h2>
    <div className="editor-guide__workflow">
      <span className="editor-guide__workflow-step">1. Create Tournament</span>
      <span className="editor-guide__workflow-arrow">→</span>
      <span className="editor-guide__workflow-step">2. Add 64 Groups</span>
      <span className="editor-guide__workflow-arrow">→</span>
      <span className="editor-guide__workflow-step">3. Assign Seeds to Matches</span>
      <span className="editor-guide__workflow-arrow">→</span>
      <span className="editor-guide__workflow-step">4. Set Tournament to Active</span>
      <span className="editor-guide__workflow-arrow">→</span>
      <span className="editor-guide__workflow-step">5. Monitor Live</span>
    </div>

    <h2 className="editor-guide__section-title">Step-by-step</h2>

    <div className="editor-guide__card" style={{ marginBottom: '1rem' }}>
      <div className="editor-guide__card-title">🏆 Step 1 — Create the Tournament</div>
      <div className="editor-guide__card-desc">
        Create a new Tournament record with the year and start date. Saving it automatically
        scaffolds 63 Match placeholders with a two-week schedule (Round 1 Mon–Thu, Round 2 Mon–Tue,
        Sweet 16 Wed, Elusive 8 + Final 4 Thu, Championship Fri).
      </div>
      <div className="editor-guide__card-links">
        <a
          href="/admin/collections/modern-rock-madness-tournaments"
          className="editor-guide__link"
        >
          All Tournaments
        </a>
        <a
          href="/admin/collections/modern-rock-madness-tournaments/create"
          className="editor-guide__link"
        >
          + New Tournament
        </a>
      </div>
    </div>

    <div className="editor-guide__card" style={{ marginBottom: '1rem' }}>
      <div className="editor-guide__card-title">🎸 Step 2 — Add Groups (Bands)</div>
      <div className="editor-guide__card-desc">
        Add the 64 competing bands as Groups. Each Group needs a name, seed (1–16), and region
        (1–4). The seed and region determine which Match slot each band is placed in.
      </div>
      <div className="editor-guide__card-links">
        <a href="/admin/collections/modern-rock-madness-groups" className="editor-guide__link">
          All Groups
        </a>
        <a
          href="/admin/collections/modern-rock-madness-groups/create"
          className="editor-guide__link"
        >
          + Add Group
        </a>
      </div>
    </div>

    <div className="editor-guide__card" style={{ marginBottom: '1rem' }}>
      <div className="editor-guide__card-title">⚔️ Step 3 — Review Matches</div>
      <div className="editor-guide__card-desc">
        After saving the Tournament, 63 Match records are created automatically. Open the{' '}
        <strong>Bracket</strong> tab on the Tournament to see the full bracket view. You can edit
        individual matches to adjust times, add a sponsor, or manually set a winner.
      </div>
      <div className="editor-guide__card-links">
        <a href="/admin/collections/modern-rock-madness-matches" className="editor-guide__link">
          All Matches
        </a>
        <a
          href="/admin/collections/modern-rock-madness-tournaments"
          className="editor-guide__link"
        >
          Bracket View ↗
        </a>
      </div>
    </div>

    <div className="editor-guide__card" style={{ marginBottom: '1rem' }}>
      <div className="editor-guide__card-title">🔴 Step 4 — Go Live</div>
      <div className="editor-guide__card-desc">
        Set the Tournament status to <strong>Active</strong>. During each match window, use the Live
        Match Dashboard to monitor vote counts in real time, cast manual votes, close a match when
        voting ends, or extend overtime if a match is tied.
      </div>
      <div className="editor-guide__card-links">
        <a href="/admin/mrm-live" className="editor-guide__link">
          Live Match Dashboard
        </a>
      </div>
    </div>

    <h2 className="editor-guide__section-title">Match Controls (per match)</h2>
    <ul className="editor-guide__steps">
      <li>
        Open any Match record and click the <strong>Match Controls</strong> tab to manage that match
        directly.
      </li>
      <li>
        <strong>Manual Vote</strong> — awards one vote to a band (useful for station on-air votes).
      </li>
      <li>
        <strong>Close Match</strong> — locks voting and sets the winner based on current vote count.
        Only available in overtime when a band is leading.
      </li>
      <li>
        <strong>Extend Overtime</strong> — adds 15 minutes to a tied match.
      </li>
      <li>
        After closing, the winner is automatically advanced to the{' '}
        <strong>next bracket slot</strong>.
      </li>
    </ul>

    <h2 className="editor-guide__section-title">Quick Links</h2>
    <div className="editor-guide__cards">
      {QUICK_LINKS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="editor-guide__card"
          style={{ textDecoration: 'none' }}
        >
          <div className="editor-guide__card-title">
            {item.icon} {item.title}
          </div>
        </a>
      ))}
    </div>
  </div>
);
