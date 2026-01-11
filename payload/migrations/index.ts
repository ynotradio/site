import * as migration_20260111_021023 from './20260111_021023';

export const migrations = [
  {
    up: migration_20260111_021023.up,
    down: migration_20260111_021023.down,
    name: '20260111_021023'
  },
];
