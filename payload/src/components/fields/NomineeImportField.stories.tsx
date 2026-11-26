/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { TextareaFieldClientProps } from 'payload';
import { expect, within } from 'storybook/test';
import { resetMocks, setMockFieldValue } from '@payloadcms/ui';
import { NomineeImportField } from './NomineeImportField';

const field = {
  name: 'bulkNominees',
  label: 'Add nominees from a list',
  type: 'textarea',
  admin: {
    description: 'Upload a .txt or .csv, or paste one nominee per line, then save.',
  },
} as unknown as TextareaFieldClientProps['field'];

const meta = {
  title: 'Components/Fields/NomineeImportField',
  component: NomineeImportField,
  parameters: { layout: 'padded' },
  args: { field, path: 'bulkNominees' },
  decorators: [
    (Story) => {
      resetMocks();
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof NomineeImportField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Add nominees from a list')).toBeInTheDocument();
    await expect(canvas.getByLabelText('Upload a .txt or .csv file')).toBeInTheDocument();
  },
};

export const WithPastedList: Story = {
  decorators: [
    (Story) => {
      setMockFieldValue('Wet Leg - CPR\nBeck - Run Away\nHAIM - Relationships');
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('textarea');
    await expect(textarea?.value).toContain('Beck - Run Away');
  },
};
