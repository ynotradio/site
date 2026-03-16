/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EditorGuideClient } from './EditorGuideClient';

const meta: Meta<typeof EditorGuideClient> = {
  title: 'Payload/Features/EditorGuide/EditorGuideClient',
  component: EditorGuideClient,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Tabbed editor documentation view embedded in the Payload admin UI.

Provides two tabs:
- **Daily Content** — links and descriptions for Posts, Songs, CD of the Week, Concerts, On Demand, DJs, Shows, and supporting records.
- **Modern Rock Madness** — step-by-step workflow for setting up and running the annual MRM tournament.

Accessible at \`/admin/editor-guide\` in the Payload admin.
        `,
      },
    },
    nextjs: { appDirectory: true },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EditorGuideClient>;

export const DailyContentTab: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view showing the Daily Content tab with collection cards and links.',
      },
    },
  },
};

export const MRMTab: Story = {
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const mrmTab = canvas.getByRole('tab', { name: /Modern Rock Madness/i });
    await userEvent.click(mrmTab);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modern Rock Madness tab showing the setup workflow, step-by-step guide, and quick links.',
      },
    },
  },
};
