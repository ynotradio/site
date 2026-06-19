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
type SlugHelperAdmin = {
  components?: {
    Field?: {
      path?: string;
    };
  };
};

const RECURSIVE_FIELD_TYPES = new Set(['row', 'collapsible', 'group']);

function isSlugHelperField(field: FieldRecord): boolean {
  if (field.name !== 'slug') {
    return false;
  }

  const admin = field.admin as SlugHelperAdmin | undefined;

  return admin?.components?.Field?.path === '@payloadcms/next/client#SlugField';
}

function shouldRecurseIntoFields(field: FieldRecord): boolean {
  return Array.isArray(field.fields)
    && typeof field.type === 'string'
    && RECURSIVE_FIELD_TYPES.has(field.type);
}

// Recursively collect fields with unique: true. Recurses into layout containers
// (row, collapsible, group) but not into array/blocks where unique is meaningless.
// Payload's slugField() helper is excluded because it expands to a generated row
// wrapper and handles slug generation separately from explicit schema fields.
function findUniqueFields(
  fields: FieldRecord[],
  path = '',
): Array<{ path: string; field: FieldRecord }> {
  return fields.flatMap((field) => {
    const name = typeof field.name === 'string' ? field.name : null;
    const currentPath = name ? [path, name].filter(Boolean).join('.') : path;
    const uniqueFields = field.unique === true && name && !isSlugHelperField(field)
      ? [{ path: currentPath, field }]
      : [];
    const nestedFields = shouldRecurseIntoFields(field)
      ? findUniqueFields(field.fields as FieldRecord[], currentPath)
      : [];

    return [...uniqueFields, ...nestedFields];
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
    //   hooks: { beforeDuplicate: [({ value }) => `${String(value)}-copy`] } // transforms it
    const violations = allCollections
      .filter(({ config }) => !config.admin?.disableDuplicate)
      .flatMap(({ name, config }) => (
        findUniqueFields(config.fields as FieldRecord[]).flatMap(({ path, field }) => {
          const hooks = field.hooks as Record<string, unknown[]> | undefined;
          const hasHook = Array.isArray(hooks?.beforeDuplicate) && hooks.beforeDuplicate.length > 0;

          return hasHook ? [] : [`${name}.${path}`];
        })
      ))
      .sort();

    expect(violations).toEqual([]);
  });
});
