import * as migration_20260111_021023 from './20260111_021023';
import * as migration_20260303_185500_add_link_url_to_posts from './20260303_185500_add_link_url_to_posts';
import * as migration_20260308_033000_add_slug_to_cdoftheweek from './20260308_033000_add_slug_to_cdoftheweek';
import * as migration_20260313_191847_add_mrm_tables from './20260313_191847_add_mrm_tables';
import * as migration_20260504_020436_slug_field_consistency from './20260504_020436_slug_field_consistency';

export const migrations = [
  {
    up: migration_20260111_021023.up,
    down: migration_20260111_021023.down,
    name: '20260111_021023',
  },
  {
    up: migration_20260303_185500_add_link_url_to_posts.up,
    down: migration_20260303_185500_add_link_url_to_posts.down,
    name: '20260303_185500_add_link_url_to_posts',
  },
  {
    up: migration_20260308_033000_add_slug_to_cdoftheweek.up,
    down: migration_20260308_033000_add_slug_to_cdoftheweek.down,
    name: '20260308_033000_add_slug_to_cdoftheweek',
  },
  {
    up: migration_20260313_191847_add_mrm_tables.up,
    down: migration_20260313_191847_add_mrm_tables.down,
    name: '20260313_191847_add_mrm_tables',
  },
  {
    up: migration_20260504_020436_slug_field_consistency.up,
    down: migration_20260504_020436_slug_field_consistency.down,
    name: '20260504_020436_slug_field_consistency'
  },
];
