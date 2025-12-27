import { StructureBuilder } from 'sanity/structure';
import DJOrderTool from './plugins/dj-order';
import ShowClonerTool from './plugins/show-cloner';
import ArtistCleanupTool from './plugins/artist-cleanup';

export default (S: StructureBuilder) => {
  // Get all default document type list items
  const defaultListItems = S.documentTypeListItems();

  // Filter out dj, show, and artist types since we're customizing them
  const filteredListItems = defaultListItems.filter(
    (listItem) => !['dj', 'show', 'artist'].includes(listItem.getId() || ''),
  );

  return S.list()
    .title('Content')
    .items([
      // Artist management section
      S.listItem()
        .title('Artists')
        .child(
          S.list()
            .title('Artist Management')
            .items([
              // Regular list of all artists
              S.listItem()
                .title('All Artists')
                .child(
                  S.documentList()
                    .title('All Artists')
                    .filter('_type == "artist"')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }]),
                ),

              // Artist cleanup tool
              S.listItem()
                .title('Cleanup Review')
                .icon(() => '🧹')
                .child(
                  S.component()
                    .title('Artist Cleanup')
                    .component(ArtistCleanupTool),
                ),
            ]),
        ),

      // DJ management section
      S.listItem()
        .title('DJs')
        .child(
          S.list()
            .title('DJ Management')
            .items([
              // Regular list of DJs
              S.listItem()
                .title('All DJs')
                .child(
                  S.documentList()
                    .title('All DJs')
                    .filter('_type == "dj"')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),

              // Link to our reordering tool using the redirect function
              S.listItem()
                .title('Reorder DJs')
                .icon(() => '🎧')
                .child(
                  S.component()
                    .title('Reorder DJs')
                    .component(DJOrderTool),
                ),
            ]),
        ),

      // Schedule management section
      S.listItem()
        .title('Schedule')
        .child(
          S.list()
            .title('Schedule Management')
            .items([
              // Regular list of shows
              S.listItem()
                .title('All Shows')
                .child(
                  S.documentList()
                    .title('All Shows')
                    .filter('_type == "show"')
                    .defaultOrdering([{ field: 'date', direction: 'desc' }, { field: 'startTime', direction: 'asc' }]),
                ),

              // Link to our cloner tool
              S.listItem()
                .title('Clone Schedule')
                .icon(() => '📋')
                .child(
                  S.component()
                    .title('Clone Schedule')
                    .component(ShowClonerTool),
                ),
            ]),
        ),

      // All other document types
      ...filteredListItems,
    ]);
};
