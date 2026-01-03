import * as migration_20251231_210218 from './20251231_210218';
import * as migration_20260103_032237_dj_multiple_people from './20260103_032237_dj_multiple_people';

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
];
