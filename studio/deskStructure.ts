// deskStructure.ts
import { StructureBuilder } from 'sanity/structure';
// Import directly from the directory (index is used by default)
import DJOrderTool from './plugins/dj-order';

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
                  .title('DJ Order Tool')
                  .component(DJOrderTool),
              ),
          ]),
      ),

    // All other document types
    ...S.documentTypeListItems().filter(
      (listItem) => {
        const id = listItem.getId();
        return id ? !['dj'].includes(id) : true;
      },
    ),
  ]);
