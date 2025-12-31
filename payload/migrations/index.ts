import * as migration_20251231_210218 from './20251231_210218';

export const migrations = [
  {
    up: migration_20251231_210218.up,
    down: migration_20251231_210218.down,
    name: '20251231_210218'
  },
];
