import type { CollectionAfterChangeHook } from 'payload';
import { generateBracketDefinitions, TOTAL_MATCHES } from './bracketDefinitions';

export const scaffoldTournamentMatches: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc;

  const tournamentId: number | string = doc.id;
  const { startDate } = doc as { startDate: string };
  const definitions = generateBracketDefinitions(startDate);

  // Create matches from the championship backwards so that by the time we
  // create earlier-round matches the nextMatch document already exists and
  // we can reference its ID.
  const reversed = [...definitions].reverse();

  // Map matchNumber → created Payload document ID
  const matchIdByNumber = new Map<number, number | string>();

  // eslint-disable-next-line no-restricted-syntax
  for (const def of reversed) {
    const nextMatchId = def.nextMatchNumber ? matchIdByNumber.get(def.nextMatchNumber) : undefined;

    try {
      // eslint-disable-next-line no-await-in-loop
      const created = await req.payload.create({
        collection: 'modern-rock-madness-matches',
        overrideAccess: true,
        data: {
          tournament: tournamentId,
          matchNumber: def.matchNumber,
          round: def.round,
          region: def.region,
          startTime: def.startTime,
          endTime: def.endTime,
          band1Votes: 0,
          band2Votes: 0,
          showScore: false,
          ...(nextMatchId != null ? { nextMatch: nextMatchId } : {}),
        },
        req,
      });

      matchIdByNumber.set(def.matchNumber, created.id);
    } catch (error) {
      req.payload.logger.error(
        `Failed to scaffold match #${def.matchNumber} for tournament ${tournamentId}: ${error}`,
      );
    }
  }

  req.payload.logger.info(
    `Scaffolded ${matchIdByNumber.size}/${TOTAL_MATCHES} matches for tournament "${doc.name}" (${tournamentId})`,
  );

  return doc;
};
