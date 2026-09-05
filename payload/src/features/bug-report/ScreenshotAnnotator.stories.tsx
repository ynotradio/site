import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { ScreenshotAnnotator } from './ScreenshotAnnotator';

// A tiny inline PNG so the story is self-contained (a 1×1 red pixel).
const SAMPLE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const meta: Meta<typeof ScreenshotAnnotator> = {
  title: 'Features/BugReport/ScreenshotAnnotator',
  component: ScreenshotAnnotator,
  args: {
    image: SAMPLE,
    onSave: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          'Full-screen screenshot annotation editor used by the bug reporter. Supports '
          + 'pen, box, and arrow tools with a fixed colour palette, undo/clear, and exports '
          + 'a flattened PNG. Native canvas only — no third-party dependency.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScreenshotAnnotator>;

export const Default: Story = {};

export const SelectsPenTool: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Pen' }));
    await expect(canvas.getByRole('button', { name: 'Pen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
