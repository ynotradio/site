'use client';

import React, { useMemo } from 'react';
import type { TextFieldClientProps } from 'payload';
import { FieldLabel, useField } from '@payloadcms/ui';
import { mergeFieldStyles } from '@payloadcms/ui/shared';

type InlineDateFieldProps = TextFieldClientProps;

export const InlineDateField: React.FC<InlineDateFieldProps> = ({ field, path }) => {
  const label = typeof field?.label === 'string' ? field.label : undefined;
  const required = field?.required ?? false;
  const { value, setValue } = useField<string>({ path });
  const inputId = `inline-date-${path}`;
  const fieldStyles = useMemo(() => mergeFieldStyles(field), [field]);

  return (
    <div style={fieldStyles}>
      {label && <FieldLabel htmlFor={inputId} label={label} required={required} />}
      <input
        id={inputId}
        type="date"
        className="field-type-date__input"
        value={value || ''}
        onChange={(event) => setValue(event.target.value)}
        aria-label={label ?? 'Date'}
      />
    </div>
  );
};

export default InlineDateField;
