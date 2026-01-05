import * as migration_20251231_210218 from './20251231_210218';
import * as migration_20260103_032237_dj_multiple_people from './20260103_032237_dj_multiple_people';
import * as migration_20260105_162500_cleanup_unused_fields from './20260105_162500_cleanup_unused_fields';

export const migrations = [
  {
    up: migration_20251231_210218.up,
    down: migration_20251231_210218.down,
    name: '20251231_210218',
  },
  {
    up: migration_20260103_032237_dj_multiple_people.up,
    down: migration_20260103_032237_dj_multiple_people.down,
    name: '20260103_032237_dj_multiple_people'
  },
  {
    up: migration_20260105_162500_cleanup_unused_fields.up,
    down: migration_20260105_162500_cleanup_unused_fields.down,
    name: '20260105_162500_cleanup_unused_fields'
  },
];
