import * as migration_20251231_210051 from './20251231_210051';

export const migrations = [
  {
    up: migration_20251231_210051.up,
    down: migration_20251231_210051.down,
    name: '20251231_210051'
  },
];
