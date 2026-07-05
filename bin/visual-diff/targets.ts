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
}

const LOCAL_ORIGIN = process.env.VISUAL_DIFF_LOCAL_ORIGIN || 'http://localhost:8080';
const PROD_ORIGIN = process.env.VISUAL_DIFF_PROD_ORIGIN || 'https://www.ynotradio.net';

export function pageTargets(rows: { slug: string }[]): DiffTarget[] {
  return rows.map(({ slug }) => ({
    label: slug,
    localUrl: `${LOCAL_ORIGIN}/pages.php?page=${encodeURIComponent(slug)}&ff=use_postgres_customtext`,
    prodUrl: `${PROD_ORIGIN}/pages.php?page=${encodeURIComponent(slug)}`,
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
