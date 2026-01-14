import type { Meta, StoryObj } from '@storybook/react';
import { CustomDashboard } from './CustomDashboard';

// Mock the useConfig hook for Storybook
const mockUseConfig = () => ({
  config: {
    routes: {
      admin: '/admin',
    },
  },
});

const meta: Meta<typeof CustomDashboard> = {
  title: 'Components/Dashboard/CustomDashboard',
  component: CustomDashboard,
  parameters: {
    layout: 'fullscreen',
    // Mock the Payload UI context
    payloadConfig: {
      routes: {
        admin: '/admin',
      },
    },
  },
  decorators: [
    (Story) => {
      // Mock useConfig for Storybook
      // eslint-disable-next-line global-require
      const { useConfig } = require('@payloadcms/ui');
      if (useConfig && typeof useConfig === 'function') {
        useConfig.mockReturnValue(mockUseConfig());
      }
      return <Story />;
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CustomDashboard>;

/**
 * Default dashboard view showing all collections organized into primary and secondary groups
 */
export const Default: Story = {};

/**
 * Dashboard emphasizes the two-tier organization:
 * - Primary collections (large cards with icons and descriptions)
 * - Secondary collections (compact cards with group labels)
 */
export const TwoTierLayout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The dashboard uses a two-tier layout to prioritize content. Primary collections correspond to top-level user pages and feature prominent cards with icons. Secondary collections are supporting content shown in a more compact format.',
      },
    },
  },
};

/**
 * Primary collections section featuring the 6 main content areas
 */
export const PrimaryCollections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Primary collections include: Stories (Home Page), New Music, CD of the Week, Concerts, On Demand, and DJs. Each has an emoji icon and descriptive text.',
      },
    },
  },
};

/**
 * Secondary collections section with 8 supporting content types
 */
export const SecondaryCollections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Secondary collections are grouped by category (Music, Events, Radio, etc.) and displayed in a compact grid format for easy access to supporting content.',
      },
    },
  },
};

/**
 * Dashboard with custom admin route
 */
export const CustomAdminRoute: Story = {
  decorators: [
    (Story) => {
      // eslint-disable-next-line global-require
      const { useConfig } = require('@payloadcms/ui');
      if (useConfig && typeof useConfig === 'function') {
        useConfig.mockReturnValue({
          config: {
            routes: {
              admin: '/custom-admin-path',
            },
          },
        });
      }
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard adapts to custom admin routes configured in Payload CMS.',
      },
    },
  },
};

/**
 * Responsive behavior - the dashboard grid adjusts for different screen sizes
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

/**
 * Focus on the primary cards design
 */
export const PrimaryCardDesign: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Primary cards feature: large emoji icons (2.5rem), title in 1.25rem, and descriptive text in 0.875rem. Hover states provide visual feedback.',
      },
    },
  },
};

/**
 * Focus on the secondary cards design
 */
export const SecondaryCardDesign: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Secondary cards are more compact with just a label and group indicator, optimized for quick scanning and access.',
      },
    },
  },
};
