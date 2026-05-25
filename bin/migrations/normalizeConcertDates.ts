/**
 * Normalize all existing concert dates to noon UTC.
 *
 * The normalizeDateToNoon hook ensures NEW concerts are saved at noon UTC,
 * but older records (imported from MySQL or created before the hook)
 * may have varying timestamps, causing group-by to split same-day
 * concerts into separate groups in the admin.
 *
 * Run against dev:
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs \
 *     bin/migrations/normalizeConcertDates.ts dev-neon
 *
 * Run against prod:
 *   NODE_ENV=production yarn tsx --import ./bin/preload-nextenv-fix.mjs \
 *     bin/migrations/normalizeConcertDates.ts prod-neon
 */

import { normalizeDateToNoon } from '../../payload/src/collections/hooks/showDateHooks';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('NormalizeConcertDates');

async function main() {
  const target = process.argv[2] || 'dev-neon';
  logger.info(`Target database: ${target}`);

  const payload = await getPayloadClient(target as any);

  const { docs } = await payload.find({
    collection: 'concerts',
    limit: 0,
    sort: 'date',
  });

  logger.info(`Found ${docs.length} concerts`);

  let updated = 0;
  let unchanged = 0;

  for (const doc of docs) {
    if (doc.date) {
      const result = (await normalizeDateToNoon({
        data: { date: doc.date },
      })) as { date: string };
      if (result.date !== doc.date) {
        await payload.update({
          collection: 'concerts',
          id: doc.id,
          data: { date: result.date },
        });
        updated++;
      } else {
        unchanged++;
      }
    } else {
      unchanged++;
    }
  }

  logger.info(`Done: ${updated} updated, ${unchanged} unchanged`);
  process.exit(0);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
