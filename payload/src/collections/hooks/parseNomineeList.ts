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

const ARTIST_HEADER = /^(artist|band)s?$/i;
const NAME_HEADER = /^(title|song|track|album|record|name|nominee)s?$/i;

const normalizeLine = (line: string): string => line
  .replace(/^\s*(\d+[.)]|[-*•])\s+/, '')
  .replace(/\s+[–—]\s+/g, ' - ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Turns pasted text or an uploaded .txt/.csv into one nominee label per entry.
 * A CSV is recognised by a header row with an artist column and a title/name
 * column; every other line is used as typed, minus list numbering and bullets.
 */
export const parseNomineeList = (text: string): string[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]);
  const artistCol = header.findIndex((cell) => ARTIST_HEADER.test(cell));
  const nameCol = header.findIndex((cell) => NAME_HEADER.test(cell));
  const isHeader = header.length > 1
    && nameCol >= 0
    && header.every((cell) => ARTIST_HEADER.test(cell) || NAME_HEADER.test(cell) || cell === '');
  if (isHeader) {
    return lines
      .slice(1)
      .map((line) => {
        const cells = splitCsvLine(line);
        const parts = [artistCol >= 0 ? cells[artistCol] : '', cells[nameCol]];
        return normalizeLine(parts.filter(Boolean).join(' - '));
      })
      .filter(Boolean);
  }

  return lines.map(normalizeLine).filter(Boolean);
};
