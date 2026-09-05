/**
 * Verifies the machine-written, non-editor-facing sub-tables are hidden from
 * the admin nav for non-admins (they stay accessible to admins and via the API).
 * Keeps the editor sidebar focused on the collections editors actually use.
 */
import { describe, it, expect } from 'vitest';
import type { CollectionConfig } from 'payload';
import { adminOnlyNav } from '../utils/auth';
import { Top11Votes } from './Top11Votes';
import { Top11WriteIns } from './Top11WriteIns';
import { Top11WinnerDraws } from './Top11WinnerDraws';
import { Top11Contestants } from './Top11Contestants';
import { YearEndPollVotes } from './YearEndPollVotes';
import { ModernRockMadnessVotes } from './MadnessVotes';
import { ModernRockMadnessMatchEvents } from './MadnessMatchEvents';

const hiddenFromEditors: Array<[string, CollectionConfig]> = [
  ['Top11Votes', Top11Votes],
  ['Top11WriteIns', Top11WriteIns],
  ['Top11WinnerDraws', Top11WinnerDraws],
  ['Top11Contestants', Top11Contestants],
  ['YearEndPollVotes', YearEndPollVotes],
  ['MadnessVotes', ModernRockMadnessVotes],
  ['MadnessMatchEvents', ModernRockMadnessMatchEvents],
];

describe('lean editor nav', () => {
  it.each(hiddenFromEditors)('%s is hidden from non-admin nav', (_name, collection) => {
    expect(collection.admin?.hidden).toBe(adminOnlyNav);
  });
});
