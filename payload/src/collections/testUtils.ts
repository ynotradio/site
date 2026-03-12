/**
 * Flatten row-type fields into a flat array for easier testing.
 * Payload uses { type: 'row', fields: [...] } to group fields visually in the admin UI.
 */
export const flattenRowFields = (
  fields: readonly Record<string, unknown>[],
): Array<Record<string, unknown>> =>
  fields.reduce<Array<Record<string, unknown>>>((result, field) => {
    if (field.type === 'row' && Array.isArray(field.fields)) {
      return [...result, ...(field.fields as Array<Record<string, unknown>>)];
    }
    return [...result, field];
  }, []);
