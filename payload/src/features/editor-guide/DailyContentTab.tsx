'use client';

import React from 'react';

interface CardLink {
  label: string;
  href: string;
}

interface ContentCard {
  icon: string;
  title: string;
  description: string;
  links: CardLink[];
}

const DAILY_CARDS: ContentCard[] = [
  {
    icon: '📰',
    title: 'Posts (Stories)',
    description:
      'Front-page features and custom pages. Set a start and end date to control when a story is visible. The story appears on-site while today is between those dates.',
    links: [
      { label: 'All Posts', href: '/admin/collections/posts' },
      { label: '+ New Post', href: '/admin/collections/posts/create' },
    ],
  },
  {
    icon: '🎵',
    title: 'New Music',
    description:
      'Songs featured on the New Music page. Toggle "Feature on New Music" to add or remove a song from that page. Each song links to an artist and optional record.',
    links: [
      { label: 'All Songs', href: '/admin/collections/songs' },
      { label: '+ Add Song', href: '/admin/collections/songs/create' },
    ],
  },
  {
    icon: '💿',
    title: 'CD of the Week',
    description:
      'Weekly album reviews. Only one entry should be active at a time — use the date field to mark when the review is current.',
    links: [
      { label: 'All Reviews', href: '/admin/collections/cdoftheweek' },
      { label: '+ New Review', href: '/admin/collections/cdoftheweek/create' },
    ],
  },
  {
    icon: '🎸',
    title: 'Concerts',
    description:
      'Upcoming concert listings. Toggle "Featured" to promote a show on the homepage. Concerts are linked to a venue and one or more artists.',
    links: [
      { label: 'All Concerts', href: '/admin/collections/concerts' },
      { label: '+ Add Concert', href: '/admin/collections/concerts/create' },
    ],
  },
  {
    icon: '🎧',
    title: 'On Demand',
    description:
      'Archived recordings and on-demand audio. Link an audio file from Media and associate it with a DJ or show for easy browsing.',
    links: [
      { label: 'All Recordings', href: '/admin/collections/ondemand' },
      { label: '+ Add Recording', href: '/admin/collections/ondemand/create' },
    ],
  },
  {
    icon: '🎙️',
    title: 'DJs',
    description:
      'DJ profiles shown on the site. Toggle "On Air" to show or hide a DJ. Use "Sort Order" or the DJ Order tool to control their listing position.',
    links: [
      { label: 'All DJs', href: '/admin/collections/djs' },
      { label: 'DJ Order Tool', href: '/admin/dj-order' },
    ],
  },
  {
    icon: '📅',
    title: 'Shows',
    description:
      "The weekly show schedule. Each show belongs to a DJ and has a day + time slot. Use Show Cloner to copy a week's schedule to a new date range.",
    links: [
      { label: 'All Shows', href: '/admin/collections/shows' },
      { label: 'Show Cloner', href: '/admin/show-cloner' },
    ],
  },
];

const SUPPORTING_CARDS: ContentCard[] = [
  {
    icon: '🎤',
    title: 'Artists',
    description: 'Band and artist profiles. Referenced by Songs, Concerts, and Records.',
    links: [
      { label: 'All Artists', href: '/admin/collections/artists' },
      { label: '+ Add Artist', href: '/admin/collections/artists/create' },
    ],
  },
  {
    icon: '📀',
    title: 'Records (Albums)',
    description: 'Album metadata used by Songs and CD of the Week.',
    links: [
      { label: 'All Records', href: '/admin/collections/records' },
      { label: '+ Add Record', href: '/admin/collections/records/create' },
    ],
  },
  {
    icon: '📍',
    title: 'Venues',
    description: 'Concert venue information. Referenced by Concerts.',
    links: [
      { label: 'All Venues', href: '/admin/collections/venues' },
      { label: '+ Add Venue', href: '/admin/collections/venues/create' },
    ],
  },
  {
    icon: '👤',
    title: 'People',
    description: 'Individual people linked to DJs and Artists.',
    links: [
      { label: 'All People', href: '/admin/collections/people' },
      { label: '+ Add Person', href: '/admin/collections/people/create' },
    ],
  },
];

const CardItem: React.FC<ContentCard> = ({
  icon, title, description, links,
}) => (
  <div className="editor-guide__card">
    <div className="editor-guide__card-title">
      {icon} {title}
    </div>
    <div className="editor-guide__card-desc">{description}</div>
    <div className="editor-guide__card-links">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="editor-guide__link">
          {link.label}
        </a>
      ))}
    </div>
  </div>
);

export const DailyContentTab: React.FC = () => (
  <div>
    <div className="editor-guide__tip">
      💡 <strong>Quick tip:</strong> Use the filter icon (⚙) at the top of any list to narrow down
      records. For example, filter Posts by date range to see only currently active stories.
    </div>

    <h2 className="editor-guide__section-title">Content Collections</h2>
    <div className="editor-guide__cards">
      {DAILY_CARDS.map((card) => (
        <CardItem key={card.title} {...card} />
      ))}
    </div>

    <h2 className="editor-guide__section-title">Supporting Records</h2>
    <div className="editor-guide__cards">
      {SUPPORTING_CARDS.map((card) => (
        <CardItem key={card.title} {...card} />
      ))}
    </div>
  </div>
);
