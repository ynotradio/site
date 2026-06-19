import { describe, expect, it } from 'vitest';
import type { CollectionConfig } from 'payload';
import { Ads } from './Ads';
import { Artists } from './Artists';
import { CdOfTheWeek } from './CdOfTheWeek';
import { Concerts } from './Concerts';
import { DJs } from './DJs';
import { MadnessBands } from './MadnessBands';
import { MadnessMatchEvents } from './MadnessMatchEvents';
import { MadnessMatches } from './MadnessMatches';
import { MadnessTournaments } from './MadnessTournaments';
import { MadnessVotes } from './MadnessVotes';
import { Media } from './Media';
import { OnDemand } from './OnDemand';
import { People } from './People';
import { Posts } from './Posts';
import { Records } from './Records';
import { Shows } from './Shows';
import { Songs } from './Songs';
import { Users } from './Users';
import { Venues } from './Venues';
import { YearEndPollResults } from './YearEndPollResults';

type FieldRecord = Record<string, unknown>;

// Recursively collect fields with unique: true. Recurses into layout containers
// (row, collapsible, group) but not into array/blocks where unique is meaningless.
function findUniqueFields(
  fields: FieldRecord[],
  path = '',
): Array<{ path: string; field: FieldRecord }> {
  return fields.flatMap((field) => {
    const name = typeof field.name === 'string' ? field.name : null;
    const currentPath = name ? (path ? `${path}.${name}` : name) : path;
    const result: Array<{ path: string; field: FieldRecord }> = [];

    if (field.unique === true && name) {
      result.push({ path: currentPath, field });
    }

    if (Array.isArray(field.fields)) {
      result.push(...findUniqueFields(field.fields as FieldRecord[], currentPath));
    }

    return result;
  });
}

const allCollections: Array<{ name: string; config: CollectionConfig }> = [
  { name: 'Ads', config: Ads },
  { name: 'Artists', config: Artists },
  { name: 'CdOfTheWeek', config: CdOfTheWeek },
  { name: 'Concerts', config: Concerts },
  { name: 'DJs', config: DJs },
  { name: 'MadnessBands', config: MadnessBands },
  { name: 'MadnessMatchEvents', config: MadnessMatchEvents },
  { name: 'MadnessMatches', config: MadnessMatches },
  { name: 'MadnessTournaments', config: MadnessTournaments },
  { name: 'MadnessVotes', config: MadnessVotes },
  { name: 'Media', config: Media },
  { name: 'OnDemand', config: OnDemand },
  { name: 'People', config: People },
  { name: 'Posts', config: Posts },
  { name: 'Records', config: Records },
  { name: 'Shows', config: Shows },
  { name: 'Songs', config: Songs },
  { name: 'Users', config: Users },
  { name: 'Venues', config: Venues },
  { name: 'YearEndPollResults', config: YearEndPollResults },
];

describe('Collection schema invariants', () => {
  it('every unique field has a beforeDuplicate hook to avoid constraint violations on duplicate', () => {
    // When you add a unique: true field to any collection, this test will fail.
    // Add a beforeDuplicate hook so duplication doesn't silently break on the
    // unique constraint. See legacyIdField for the pattern:
    //   hooks: { beforeDuplicate: [() => null] }        // clears the value (optional fields)
    //   hooks: { beforeDuplicate: [({ value }) => `${value}-copy`] } // transforms it (required fields)
    const violations: string[] = [];

    for (const { name, config } of allCollections) {
      if (config.admin?.disableDuplicate) continue;

      for (const { path, field } of findUniqueFields(config.fields as FieldRecord[])) {
        const hooks = field.hooks as Record<string, unknown[]> | undefined;
        const hasHook = Array.isArray(hooks?.beforeDuplicate) && hooks.beforeDuplicate.length > 0;
        if (!hasHook) {
          violations.push(`${name}.${path}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
