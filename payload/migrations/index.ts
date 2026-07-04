import * as migration_20260111_021023 from './20260111_021023';
import * as migration_20260303_185500_add_link_url_to_posts from './20260303_185500_add_link_url_to_posts';
import * as migration_20260308_033000_add_slug_to_cdoftheweek from './20260308_033000_add_slug_to_cdoftheweek';
import * as migration_20260313_191847_add_mrm_tables from './20260313_191847_add_mrm_tables';
import * as migration_20260504_020436_slug_field_consistency from './20260504_020436_slug_field_consistency';
import * as migration_20260505_140811_concert_title_richtext from './20260505_140811_concert_title_richtext';
import * as migration_20260508_152000_concert_artists_text from './20260508_152000_concert_artists_text';
import * as migration_20260509_172217_cdoftheweek_ondemand_search_text from './20260509_172217_cdoftheweek_ondemand_search_text';
import * as migration_20260511_024334 from './20260511_024334';
import * as migration_20260511_154500_add_cdotw_artist_url from './20260511_154500_add_cdotw_artist_url';
import * as migration_20260606_201414_add_top11_payload_collections from './20260606_201414_add_top11_payload_collections';
import * as migration_20260701_170648_add_top11_vote_dedup_and_lookback from './20260701_170648_add_top11_vote_dedup_and_lookback';
import * as migration_20260701_172922_add_top11_contestant_dedup from './20260701_172922_add_top11_contestant_dedup';
import * as migration_20260701_203840_add_top11_recording_fields_and_drop_title from './20260701_203840_add_top11_recording_fields_and_drop_title';
import * as migration_20260701_221242_add_top11_display_title from './20260701_221242_add_top11_display_title';
import * as migration_20260703_000000_add_pages_collection from './20260703_000000_add_pages_collection';
import * as migration_20260704_000000_add_top11_votes_voterkey_field from './20260704_000000_add_top11_votes_voterkey_field';
import * as migration_20260705_000000_add_pages_header_image from './20260705_000000_add_pages_header_image';

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
    name: '20260504_020436_slug_field_consistency',
  },
  {
    up: migration_20260505_140811_concert_title_richtext.up,
    down: migration_20260505_140811_concert_title_richtext.down,
    name: '20260505_140811_concert_title_richtext',
  },
  {
    up: migration_20260508_152000_concert_artists_text.up,
    down: migration_20260508_152000_concert_artists_text.down,
    name: '20260508_152000_concert_artists_text',
  },
  {
    up: migration_20260509_172217_cdoftheweek_ondemand_search_text.up,
    down: migration_20260509_172217_cdoftheweek_ondemand_search_text.down,
    name: '20260509_172217_cdoftheweek_ondemand_search_text',
  },
  {
    up: migration_20260511_024334.up,
    down: migration_20260511_024334.down,
    name: '20260511_024334',
  },
  {
    up: migration_20260511_154500_add_cdotw_artist_url.up,
    down: migration_20260511_154500_add_cdotw_artist_url.down,
    name: '20260511_154500_add_cdotw_artist_url',
  },
  {
    up: migration_20260606_201414_add_top11_payload_collections.up,
    down: migration_20260606_201414_add_top11_payload_collections.down,
    name: '20260606_201414_add_top11_payload_collections',
  },
  {
    up: migration_20260701_170648_add_top11_vote_dedup_and_lookback.up,
    down: migration_20260701_170648_add_top11_vote_dedup_and_lookback.down,
    name: '20260701_170648_add_top11_vote_dedup_and_lookback',
  },
  {
    up: migration_20260701_172922_add_top11_contestant_dedup.up,
    down: migration_20260701_172922_add_top11_contestant_dedup.down,
    name: '20260701_172922_add_top11_contestant_dedup',
  },
  {
    up: migration_20260701_203840_add_top11_recording_fields_and_drop_title.up,
    down: migration_20260701_203840_add_top11_recording_fields_and_drop_title.down,
    name: '20260701_203840_add_top11_recording_fields_and_drop_title',
  },
  {
    up: migration_20260701_221242_add_top11_display_title.up,
    down: migration_20260701_221242_add_top11_display_title.down,
    name: '20260701_221242_add_top11_display_title',
  },
  {
    up: migration_20260703_000000_add_pages_collection.up,
    down: migration_20260703_000000_add_pages_collection.down,
    name: '20260703_000000_add_pages_collection',
  },
  {
    up: migration_20260704_000000_add_top11_votes_voterkey_field.up,
    down: migration_20260704_000000_add_top11_votes_voterkey_field.down,
    name: '20260704_000000_add_top11_votes_voterkey_field',
  },
  {
    up: migration_20260705_000000_add_pages_header_image.up,
    down: migration_20260705_000000_add_pages_header_image.down,
    name: '20260705_000000_add_pages_header_image',
  },
];
