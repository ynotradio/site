/**
 * URL-pair definitions for visual-diff verification.
 *
 * Each target is one (local, prod) URL pair plus a label. `pages` targets
 * are generated from the live `pages` table (one per imported custom-text
 * page); `top11`/`yearEndPoll` targets are fixed lists since those content
 * types don't have a single "list every row" query the way Pages does.
 */

export interface DiffTarget {
  label: string;
  localUrl: string;
  prodUrl: string;
  /** Overrides the default screenshot timeout for pages with many/slow embeds. */
  timeoutMs?: number;
}

const LOCAL_ORIGIN = process.env.VISUAL_DIFF_LOCAL_ORIGIN || 'http://localhost:8080';
const PROD_ORIGIN = process.env.VISUAL_DIFF_PROD_ORIGIN || 'https://www.ynotradio.net';

// Pages with dozens+ of Mixcloud iframes (specialty-show archives) routinely
// blow past the default 30s networkidle wait -- each iframe is its own
// slow-to-settle widget load. Bump these specific slugs rather than raising
// the default for every page.
const SLOW_PAGE_TIMEOUTS_MS: Record<string, number> = {
  'rodney-anonymous': 120_000,
  'words-with-nerds': 90_000,
  'quarantine-takeovers': 90_000,
};

export function pageTargets(rows: { slug: string }[]): DiffTarget[] {
  return rows.map(({ slug }) => ({
    label: slug,
    localUrl: `${LOCAL_ORIGIN}/pages.php?page=${encodeURIComponent(slug)}&ff=use_postgres_customtext`,
    prodUrl: `${PROD_ORIGIN}/pages.php?page=${encodeURIComponent(slug)}`,
    timeoutMs: SLOW_PAGE_TIMEOUTS_MS[slug],
  }));
}

export function top11Targets(): DiffTarget[] {
  return [
    {
      label: 'top11',
      localUrl: `${LOCAL_ORIGIN}/top11.php`,
      prodUrl: `${PROD_ORIGIN}/top11.php`,
    },
  ];
}

export function yearEndPollTargets(years: number[]): DiffTarget[] {
  return years.map((year) => ({
    label: `yearendpoll-${year}`,
    localUrl: `${LOCAL_ORIGIN}/yearendpoll.php?poll=${year}`,
    prodUrl: `${PROD_ORIGIN}/yearendpoll.php?poll=${year}`,
  }));
}
