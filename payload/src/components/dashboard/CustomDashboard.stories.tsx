import type { Meta, StoryObj } from '@storybook/react';
import { CustomDashboard } from './CustomDashboard';

const meta: Meta<typeof CustomDashboard> = {
  title: 'Components/Dashboard/CustomDashboard',
  component: CustomDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CustomDashboard>;

/**
 * Default dashboard view with primary cards (View All / Add New links)
 * and a collapsed Supporting Content accordion.
 */
export const Default: Story = {};

/**
 * Dashboard emphasizes the two-tier organization:
 * - Primary collections (large cards with action links)
 * - Secondary collections (collapsible accordion, hidden by default)
 */
export const TwoTierLayout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The dashboard uses a two-tier layout to prioritize content. Primary collections feature prominent cards with View All and Add New action links. Secondary collections are hidden behind a collapsible accordion.',
      },
    },
  },
};

/**
 * Primary collections section featuring the 7 main content areas
 * with View All and + Add New action links on each card.
 */
export const PrimaryCollections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Primary collections include: Posts, New Music, CD of the Week, Concerts, On Demand, Shows, and DJs. Each card has an emoji icon, descriptive text, and View All / Add New action links.',
      },
    },
  },
};

/**
 * Secondary collections section — collapsed by default.
 * Click the ▸ chevron to expand.
 */
export const SecondaryCollections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Secondary collections (Records, Artists, People, Venues, Ads, Media) are grouped behind a collapsible accordion that starts collapsed to reduce visual noise.',
      },
    },
  },
};

/**
 * Responsive behavior — the dashboard grid adjusts for different screen sizes
 */
export const ResponsiveLayout: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'The dashboard uses CSS Grid with auto-fill for responsive behavior. Cards automatically reflow based on available space.',
      },
    },
  },
};
