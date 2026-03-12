/**
 * Flatten row-type fields into a flat array for easier testing.
 * Payload uses { type: 'row', fields: [...] } to group fields visually in the admin UI.
 */
type FieldRecord = Record<string, unknown>;

export function flattenRowFields(fields: readonly FieldRecord[]): FieldRecord[] {
  return fields.reduce<FieldRecord[]>((result, field) => {
    if (field.type === 'row' && Array.isArray(field.fields)) {
      return [...result, ...(field.fields as FieldRecord[])];
    }
    return [...result, field];
  }, []);
}
