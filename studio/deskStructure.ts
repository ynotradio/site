import { StructureBuilder } from 'sanity/structure';
import DJOrderTool from './plugins/dj-order';
import ShowClonerTool from './plugins/show-cloner';

export default (S: StructureBuilder) => S.list()
  .title('Content')
  .items([
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
    ...S.documentTypeListItems().filter(
      (listItem) => {
        const id = listItem.getId();
        return id ? !['dj', 'show'].includes(id) : true;
      },
    ),
  ]);
