import * as migration_20260106_040029 from './20260106_040029';

export const migrations = [
  {
    up: migration_20260106_040029.up,
    down: migration_20260106_040029.down,
    name: '20260106_040029'
  },
];
