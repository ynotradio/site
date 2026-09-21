/**
 * Verify the actual character encoding of custom_texts before any
 * latin1 -> UTF-8 normalization step.
 *
 * `custom_texts` is declared CHARSET=latin1, but legacy content was pasted
 * from the web and the production dump shows clean UTF-8 curly quotes — the
 * classic "UTF-8 bytes stored in a latin1 table" situation. Whether the data
 * needs decoding at all (and how) depends on what the bytes actually are, so
 * this script inspects the raw bytes (CONVERT(... USING binary)) rather than
 * trusting any connection-charset decoding:
 *
 *   ascii  — no bytes >= 0x80; charset is irrelevant.
 *   utf8   — raw bytes are valid UTF-8 with multibyte sequences: the table
 *            declaration lies and the data is already UTF-8. Normalizing as
 *            cp1252 would corrupt it. Naive reads through a utf8mb4
 *            connection (mysql2's default) decode byte-per-codepoint and
 *            produce mojibake ("â€™") — importers must read raw bytes and
 *            decode as UTF-8.
 *   latin1 — raw bytes are NOT valid UTF-8: genuinely 8-bit text
 *            (cp1252/latin1). Normalization must decode bytes as
 *            windows-1252.
 *
 * Also reports whether the string mysql2 hands back for each row (via its
 * utf8mb4 connection) differs from the correct decoding — the mangling the
 * current importers would silently apply to affected rows.
 *
 * Usage:
 *   npx tsx bin/migrations/verifyCustomTextCharset.ts
 */

import { connectToDatabase } from './database';

export type CharsetClass = 'ascii' | 'utf8' | 'latin1';

const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true });
const cp1252Decoder = new TextDecoder('windows-1252');

/**
 * True when the bytes are valid UTF-8. `fatal: true` makes the decoder throw
 * on any byte sequence that isn't well-formed UTF-8, which is exactly the
 * "genuinely latin1" signal.
 */
export const isValidUtf8 = (bytes: Buffer): boolean => {
  try {
    strictUtf8Decoder.decode(bytes);
    return true;
  } catch {
    return false;
  }
};

/**
 * Classify raw column bytes:
 *   ascii  — pure 7-bit, encoding is irrelevant
 *   utf8   — well-formed UTF-8 containing multibyte sequences (data is UTF-8
 *            despite the latin1 table declaration)
 *   latin1 — 8-bit text that is not valid UTF-8 (cp1252/latin1)
 */
export const classifyBytes = (bytes: Buffer): CharsetClass => {
  if (!bytes || bytes.length === 0) return 'ascii';
  const hasHighByte = bytes.some((byte) => byte >= 0x80);
  if (!hasHighByte) return 'ascii';
  return isValidUtf8(bytes) ? 'utf8' : 'latin1';
};

/** The decoding the storage bytes actually represent, per classifyBytes. */
export const decodeAs = (bytes: Buffer, encoding: CharsetClass): string => {
  if (encoding === 'latin1') return cp1252Decoder.decode(bytes);
  return bytes.toString('utf8');
};

/**
 * First non-ASCII byte sequence in the raw bytes, rendered under each
 * interpretation — the concrete "this is what ’ becomes" evidence.
 */
export const sampleNonAscii = (
  bytes: Buffer,
): { hex: string; utf8: string; cp1252: string } | null => {
  if (!bytes || bytes.length === 0) return null;
  const index = bytes.findIndex((byte) => byte >= 0x80);
  if (index === -1) return null;

  // One plausible sequence: the high bytes following the first non-ASCII byte.
  let length = 1;
  while (length < 4 && index + length < bytes.length && bytes[index + length] >= 0x80) {
    length += 1;
  }
  const seq = bytes.subarray(index, index + length);

  return {
    hex: [...seq].map((byte) => byte.toString(16).padStart(2, '0')).join(' '),
    utf8: seq.toString('utf8'),
    cp1252: cp1252Decoder.decode(seq),
  };
};

async function verify(): Promise<void> {
  const connection = await connectToDatabase();

  // CONVERT(... USING binary) returns the raw stored bytes as Buffers, so the
  // analysis below never depends on the connection charset.
  const query = `
    SELECT id, permalink, title, html,
           CONVERT(title USING binary) AS title_bin,
           CONVERT(html USING binary) AS html_bin
    FROM custom_texts
    WHERE status = 'active'
    ORDER BY id ASC
  `;
  const [rows] = await connection.query(query);
  await connection.end();

  type Row = {
    id: number;
    permalink: string;
    title: string | null;
    html: string | null;
    title_bin: Buffer;
    html_bin: Buffer;
  };

  const counts: Record<CharsetClass, number> = { ascii: 0, utf8: 0, latin1: 0 };
  let naiveAltered = 0;
  const affected: string[] = [];

  for (const row of rows as Row[]) {
    const htmlClass = classifyBytes(row.html_bin);
    const titleClass = classifyBytes(row.title_bin);
    counts[htmlClass] += 1;

    // What a default utf8mb4 mysql2 read produced for this row vs the
    // correct decoding of the raw bytes.
    const naiveAlteredHere = (row.html ?? '') !== decodeAs(row.html_bin, htmlClass);
    if (naiveAlteredHere) {
      naiveAltered += 1;
      affected.push(row.permalink || `custom_text ${row.id}`);
    }

    const sample = sampleNonAscii(row.html_bin) ?? sampleNonAscii(row.title_bin);
    if (htmlClass !== 'ascii' || titleClass !== 'ascii' || naiveAlteredHere) {
      const lines = [
        `id ${row.id} (${row.permalink || 'no permalink'}): html=${htmlClass} title=${titleClass}${
          naiveAlteredHere ? ' — naive mysql2 read WOULD ALTER this row' : ''}`,
      ];
      if (sample) {
        lines.push(
          `    bytes ${sample.hex}: utf8="${sample.utf8}" cp1252="${sample.cp1252}"`,
        );
      }
      // eslint-disable-next-line no-console
      console.log(lines.join('\n'));
    }
  }

  // eslint-disable-next-line no-console
  console.log('\n=== custom_texts charset verification ===');
  // eslint-disable-next-line no-console
  console.log(`Active rows: ${(rows as Row[]).length}`);
  // eslint-disable-next-line no-console
  console.log(`  ascii:  ${counts.ascii} (nothing to do)`);
  // eslint-disable-next-line no-console
  console.log(
    `  utf8:   ${counts.utf8} (already UTF-8 — do NOT cp1252-normalize; read raw bytes and decode as UTF-8)`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  latin1: ${counts.latin1} (genuinely 8-bit — decode bytes as windows-1252)`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Rows altered by a naive utf8mb4 mysql2 read: ${naiveAltered}${
      affected.length > 0 ? `\n  affected: ${affected.join(', ')}` : ''}`,
  );
  process.exit(0);
}

function isMainModule(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  return false;
}

// CLI guard so vitest can import the pure helpers without touching MySQL.
if (isMainModule()) {
  verify();
}
