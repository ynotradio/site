import * as migration_20260110_190418 from './20260110_190418';

export const migrations = [
  {
    up: migration_20260110_190418.up,
    down: migration_20260110_190418.down,
    name: '20260110_190418'
  },
];
