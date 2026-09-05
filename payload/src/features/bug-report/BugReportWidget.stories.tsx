import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { BugReportWidget } from './BugReportWidget';

const meta: Meta<typeof BugReportWidget> = {
  title: 'Features/BugReport/BugReportWidget',
  component: BugReportWidget,
  parameters: {
    docs: {
      description: {
        component:
          'Floating "Report a bug" widget mounted on every admin page. Collects a '
          + 'description, an optional screenshot (with in-place pen/box/arrow annotation), '
          + 'and (when configured) AI follow-up questions, then files a GitHub issue with '
          + 'captured page/browser/log context.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BugReportWidget>;

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Report a bug' })).toBeInTheDocument();
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};

export const OpensOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Report a bug' }));
    await expect(canvas.getByLabelText('What went wrong?')).toBeInTheDocument();
  },
};
