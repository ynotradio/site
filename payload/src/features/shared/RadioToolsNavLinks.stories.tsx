/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RadioToolsNavLinks } from './RadioToolsNavLinks';

const meta = {
  title: 'Features/Shared/RadioToolsNavLinks',
  component: RadioToolsNavLinks,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Navigation links for Radio Tools in the Payload admin sidebar.

Provides quick access to:
- **DJ Order** - Drag-and-drop DJ reordering tool
- **Story Order** - Drag-and-drop front-page story reordering tool
- **Show Cloner** - Clone shows from one date range to another

**Usage:**
This component is registered in the Payload admin config to appear in the sidebar navigation.
        `,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      // This component reuses Payload's own .nav-group / .nav__link classes so it
      // matches the real admin sidebar exactly — but Storybook doesn't load Payload's
      // admin theme CSS, so those classes render unstyled here. This inline stylesheet
      // approximates the real computed styles (captured from the live admin) for a
      // representative preview only; it has no effect on the actual admin UI.
      <div
        style={{
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontFamily:
            '-apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '13px',
        }}
      >
        <style>{`
          .nav-group__label { color: #9a9a9a; margin-bottom: 4px; }
          .nav__link { display: flex; padding: 2.5px 30px 2.5px 0; color: #111; text-decoration: none; }
          .nav__link:hover { color: #cc2200; }
        `}</style>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioToolsNavLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default navigation links.
 *
 * Shows the Radio Tools navigation section with links to DJ Order and Show Cloner.
 */
export const Default: Story = {};
