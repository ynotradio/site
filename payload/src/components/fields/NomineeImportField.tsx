'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { TextareaFieldClientProps } from 'payload';
import {
  FieldDescription, FieldLabel, useField, useFormModified,
} from '@payloadcms/ui';
import { mergeFieldStyles } from '@payloadcms/ui/shared';

export const NomineeImportField: React.FC<TextareaFieldClientProps> = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path });
  const modified = useFormModified();
  const wasModified = useRef(modified);

  // The list is turned into nominee rows on save, so empty the box once the
  // save lands (the form goes from modified back to clean).
  useEffect(() => {
    if (wasModified.current && !modified && value) setValue('', true);
    wasModified.current = modified;
  }, [modified, value, setValue]);
  const fieldStyles = useMemo(() => mergeFieldStyles(field), [field]);
  const inputId = `nominee-import-${path}`;
  const description = typeof field?.admin?.description === 'string' ? field.admin.description : undefined;

  const loadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const text = await input.files?.[0]?.text();
    if (text) setValue([value, text].filter(Boolean).join('\n'));
    input.value = '';
  };

  return (
    <div style={fieldStyles} className="field-type textarea">
      <FieldLabel
        htmlFor={inputId}
        label={typeof field?.label === 'string' ? field.label : 'Add nominees'}
      />
      <input
        type="file"
        accept=".csv,.txt,text/plain,text/csv"
        onChange={loadFile}
        aria-label="Upload a .txt or .csv file"
      />
      <textarea
        id={inputId}
        className="textarea-outer"
        rows={6}
        style={{ width: '100%', marginTop: 8 }}
        value={value || ''}
        onChange={(event) => setValue(event.target.value)}
      />
      {description && <FieldDescription description={description} path={path} />}
    </div>
  );
};

export default NomineeImportField;
