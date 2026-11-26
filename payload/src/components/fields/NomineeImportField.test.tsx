import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NomineeImportField } from './NomineeImportField';

const setValue = vi.fn();
let current = '';

vi.mock('@payloadcms/ui', () => ({
  FieldLabel: ({ label }: { label: string }) => <label>{label}</label>,
  FieldDescription: ({ description }: { description: string }) => <p>{description}</p>,
  useField: () => ({ value: current, setValue }),
}));
vi.mock('@payloadcms/ui/shared', () => ({ mergeFieldStyles: () => ({}) }));

const props = {
  field: { label: 'Add nominees', admin: { description: 'Paste a list' } },
  path: 'bulkNominees',
} as unknown as React.ComponentProps<typeof NomineeImportField>;

describe('NomineeImportField', () => {
  it('appends an uploaded file to what is already in the box', async () => {
    current = 'Beck - Run Away';
    render(<NomineeImportField {...props} />);
    const file = new File(['Wet Leg - CPR'], 'list.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Upload a .txt or .csv file'), {
      target: { files: [file] },
    });
    await waitFor(() => expect(setValue).toHaveBeenCalledWith('Beck - Run Away\nWet Leg - CPR'));
  });

  it('shows pasted text and the description', () => {
    current = 'Pasted line';
    render(<NomineeImportField {...props} />);
    expect(screen.getByDisplayValue('Pasted line')).toBeInTheDocument();
    expect(screen.getByText('Paste a list')).toBeInTheDocument();
  });
});
