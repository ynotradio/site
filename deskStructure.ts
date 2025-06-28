// deskStructure.ts
import { StructureBuilder } from 'sanity/structure'

export default (S: StructureBuilder) => {
  return S.list()
    .title('Content')
    .items([
      // DJ management with nested items
      S.listItem()
        .title('DJs')
        .child(
          S.list()
            .title('DJ Management')
            .items([
              // Regular DJ list
              S.listItem()
                .title('All DJs')
                .child(
                  S.documentList()
                    .title('All DJs')
                    .filter('_type == "dj"')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }])
                ),

              // Link to our custom DJ Order tool
              S.listItem()
                .title('Reorder DJs')
                .icon(() => '🎧')
                .child(
                  S.component()
                    .title('DJ Order Tool')
                    .component(
                      () => {
                        // Redirect to our tool
                        if (typeof window !== 'undefined') {
                          window.location.pathname = '/sanity/tool/dj-order-tool'
                        }
                        return null
                      }
                    )
                )
            ])
        ),

      // Add other document types except for dj, which we handle separately
      ...S.documentTypeListItems().filter(
        (listItem) => {
          const id = listItem.getId();
          return id ? !['dj'].includes(id) : true;
        }
      )
    ])
}

