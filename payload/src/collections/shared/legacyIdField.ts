import type { Field } from 'payload';
import { adminOnlyCondition } from '../../utils/auth';

/**
 * Shared legacyId field definition for collections migrated from MySQL.
 *
 * The `unique: true` constraint is needed for migration tracking, but it
 * prevents duplication because Payload's default beforeDuplicate hook for
 * unique number fields returns `undefined` — which the hook runner ignores,
 * preserving the original value and violating the unique constraint.
 *
 * The `beforeDuplicate` hook explicitly returns `null` so the duplicated
 * document gets no legacyId (multiple NULLs are allowed in unique indexes).
 */
export const legacyIdField: Field = {
  name: 'legacyId',
  type: 'number',
  unique: true,
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: 'Original MySQL ID for migration tracking',
    condition: adminOnlyCondition,
  },
  hooks: {
    beforeDuplicate: [() => null],
  },
};
