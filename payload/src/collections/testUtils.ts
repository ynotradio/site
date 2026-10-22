/**
 * Flatten row- and collapsible-type fields into a flat array for easier testing.
 * Payload uses { type: 'row' | 'collapsible', fields: [...] } to group fields
 * visually in the admin UI.
 */
type FieldRecord = Record<string, unknown>;

export function flattenRowFields(fields: readonly FieldRecord[]): FieldRecord[] {
  return fields.flatMap((field) => {
    if ((field.type === 'row' || field.type === 'collapsible') && Array.isArray(field.fields)) {
      return field.fields as FieldRecord[];
    }
    return [field];
  });
}
