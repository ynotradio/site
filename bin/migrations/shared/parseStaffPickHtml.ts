import { JSDOM } from 'jsdom';
import {
  parsePickLine,
  type Pick,
} from '../../../payload/src/collections/hooks/yearEndStaffPickHooks';

export interface ParsedStaffPick {
  hidden: boolean;
  name: string;
  showName: string;
  details: string;
  mixcloudUrls: string;
  songs: Pick[];
  albums: Pick[];
  warnings: string[];
}

const clean = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

const lines = (el: Element | null | undefined): string[] => {
  if (!el) return [];
  el.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return (el.textContent ?? '').split('\n').map(clean).filter(Boolean);
};

const mixcloudShowUrl = (src: string): string => {
  try {
    const feed = new URL(src, 'https://www.mixcloud.com').searchParams.get('feed');
    return feed ? `https://www.mixcloud.com${feed.startsWith('/') ? '' : '/'}${feed}` : '';
  } catch {
    return '';
  }
};

/**
 * Parses one legacy `year_end_staff_picks.html` block: a table with the
 * name (and optional italic show) on the left, role lines on the right, then
 * "Top N Songs" / "Top N Albums" ordered lists and Mixcloud iframes. Blocks
 * wrapped in an HTML comment were hidden on the legacy page.
 */
export function parseStaffPickHtml(html: string): ParsedStaffPick {
  const hidden = /^\s*<!--/.test(html);
  const source = hidden ? html.replace(/^\s*<!--/, '').replace(/-->\s*$/, '') : html;
  const { document } = new JSDOM(`<body>${source}</body>`).window;
  const warnings: string[] = [];

  const header = document.querySelector('td[colspan]') ?? document.body;
  const [left, right] = Array.from(header.querySelectorAll('div'));
  const showEl = left?.querySelector('em, i');
  const showName = clean(showEl?.textContent);
  showEl?.remove();
  const name = clean(left?.textContent);
  if (!name) warnings.push('no name found');

  const songs: Pick[] = [];
  const albums: Pick[] = [];
  document.querySelectorAll('h3').forEach((heading) => {
    const label = clean(heading.textContent).toLowerCase();
    let list = heading.nextElementSibling;
    while (list && list.tagName !== 'OL' && list.tagName !== 'UL') list = list.nextElementSibling;
    const picks = Array.from(list?.querySelectorAll('li') ?? [])
      .map((li) => parsePickLine(li.textContent ?? ''))
      .filter((pick): pick is Pick => pick !== null);
    if (label.includes('song')) songs.push(...picks);
    else if (label.includes('album')) albums.push(...picks);
    else warnings.push(`skipped list "${clean(heading.textContent)}"`);
  });

  const players = Array.from(document.querySelectorAll('iframe')).map(
    (f) => f.getAttribute('src') ?? '',
  );
  const urls = players.map(mixcloudShowUrl).filter(Boolean);
  if (urls.length < players.length) warnings.push(`${players.length - urls.length} non-Mixcloud player(s) skipped`);

  return {
    hidden,
    name,
    showName,
    details: lines(right).join('\n'),
    mixcloudUrls: urls.join('\n'),
    songs,
    albums,
    warnings,
  };
}
