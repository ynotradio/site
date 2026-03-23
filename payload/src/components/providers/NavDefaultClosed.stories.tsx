/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { resetMocks, setMockNavPreference } from '@payloadcms/ui';
import { NavDefaultClosed } from './NavDefaultClosed';

const meta: Meta<typeof NavDefaultClosed> = {
  title: 'Components/Providers/NavDefaultClosed',
  component: NavDefaultClosed,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Provider that collapses the Payload sidebar nav by default when the user has
no stored preference. Once the user manually toggles the nav, their preference
is respected on all subsequent visits.

**Behaviour:**
- No saved preference → nav is collapsed on first load
- Saved preference \`{ open: true }\` → nav stays open
- Saved preference \`{ open: false }\` → nav stays closed (user chose this)
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      resetMocks();
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ChildContent: React.FC = () => (
  <div style={{ padding: '16px', border: '1px dashed #ccc', borderRadius: '4px' }}>
    <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
      NavDefaultClosed wraps this content. On mount it checks for a saved nav
      preference and collapses the sidebar when none exists.
    </p>
  </div>
);

/**
 * No saved preference — nav will be collapsed on first load.
 */
export const NoSavedPreference: Story = {
  decorators: [
    (Story) => {
      setMockNavPreference(null);
      return <Story />;
    },
  ],
  render: () => (
    <NavDefaultClosed>
      <ChildContent />
    </NavDefaultClosed>
  ),
};

/**
 * User has previously opened the nav — preference is respected (no forced close).
 */
export const PreferenceOpen: Story = {
  decorators: [
    (Story) => {
      setMockNavPreference({ open: true });
      return <Story />;
    },
  ],
  render: () => (
    <NavDefaultClosed>
      <ChildContent />
    </NavDefaultClosed>
  ),
};

/**
 * User has previously closed the nav — preference is respected.
 */
export const PreferenceClosed: Story = {
  decorators: [
    (Story) => {
      setMockNavPreference({ open: false });
      return <Story />;
    },
  ],
  render: () => (
    <NavDefaultClosed>
      <ChildContent />
    </NavDefaultClosed>
  ),
};
