const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted && char === '"' && line[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
};

const ARTIST_HEADER = /^(artist|band|performer)s?$/i;
const NAME_HEADER = /^(title|song|track|album|record|name|nominee|movie|film|show|concert)s?$/i;
const RANK = /^#?\d+[.)]?$/;

const normalizeLine = (line: string): string => line
  .replace(/^\s*(\d+[.)]|[-*•])\s+/, '')
  .replace(/\s+[–—]\s+/g, ' - ')
  .replace(/^(.+?)\s+(?:-\s+)?["“](.+)["”]\s*$/, '$1 - $2')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Turns pasted text or an uploaded .txt/.csv into one nominee label per entry.
 *
 * Tab-separated text (copied from a spreadsheet) and CSV files are split into
 * cells. A first row naming an artist and/or title column ("Artist", "Song",
 * "Album", ...) is a header: those columns are joined as "Artist - Title" and
 * any others (rank, year) are ignored. Without a header, tab-separated cells
 * are joined after dropping a leading rank, and comma lines are kept as typed
 * since names can contain commas. List numbering and bullets are stripped,
 * and `Artist "Title"` becomes `Artist - Title`.
 */
export const parseNomineeList = (text: string): string[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const tabbed = lines[0].includes('\t');
  const split = (line: string) => (tabbed ? line.split('\t').map((cell) => cell.trim()) : splitCsvLine(line));

  const header = split(lines[0]);
  const artistCol = header.findIndex((cell) => ARTIST_HEADER.test(cell));
  const nameCol = header.findIndex((cell) => NAME_HEADER.test(cell));
  if (artistCol >= 0 || nameCol >= 0) {
    return lines
      .slice(1)
      .map((line) => {
        const cells = split(line);
        const parts = [artistCol >= 0 ? cells[artistCol] : '', nameCol >= 0 ? cells[nameCol] : ''];
        return normalizeLine(parts.filter(Boolean).join(' - '));
      })
      .filter(Boolean);
  }

  if (tabbed) {
    return lines
      .map((line) => {
        const cells = split(line).filter(Boolean);
        // Only a third column makes a leading number a rank; "311\tAmber" is a band.
        if (cells.length > 2 && RANK.test(cells[0])) cells.shift();
        return normalizeLine(cells.join(' - '));
      })
      .filter(Boolean);
  }

  return lines.map(normalizeLine).filter(Boolean);
};
