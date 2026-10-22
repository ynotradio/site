import type { Meta, StoryObj } from '@storybook/react';
import type { CodeFieldClientProps } from 'payload';
import { AutoHeightCodeField } from './AutoHeightCodeField';

const meta: Meta<typeof AutoHeightCodeField> = {
  title: 'Components/Fields/AutoHeightCodeField',
  component: AutoHeightCodeField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AutoHeightCodeField>;

const contentHtmlField: CodeFieldClientProps['field'] = {
  type: 'code',
  name: 'contentHtml',
  label: 'Content HTML',
  admin: { language: 'html' },
};

export const ContentHtml: Story = {
  args: {
    path: 'contentHtml',
    field: contentHtmlField,
  },
};
