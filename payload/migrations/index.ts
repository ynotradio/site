import * as migration_20260111_021023 from './20260111_021023';
import * as migration_20260303_185500_add_link_url_to_posts from './20260303_185500_add_link_url_to_posts';
import * as migration_20260308_033000_add_slug_to_cdoftheweek from './20260308_033000_add_slug_to_cdoftheweek';

export const migrations = [
  {
    up: migration_20260111_021023.up,
    down: migration_20260111_021023.down,
    name: '20260111_021023'
  },
  {
    up: migration_20260303_185500_add_link_url_to_posts.up,
    down: migration_20260303_185500_add_link_url_to_posts.down,
    name: '20260303_185500_add_link_url_to_posts'
  },
  {
    up: migration_20260308_033000_add_slug_to_cdoftheweek.up,
    down: migration_20260308_033000_add_slug_to_cdoftheweek.down,
    name: '20260308_033000_add_slug_to_cdoftheweek'
  },
];
