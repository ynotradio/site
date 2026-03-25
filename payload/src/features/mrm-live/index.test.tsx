import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveMatchTool } from './index';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

vi.mock('./LiveMatchClient', () => ({
  LiveMatchClient: () => <div data-testid="live-match-client">Live Match Client</div>,
}));

const mockInitPageResult = {
  req: {
    i18n: {},
    payload: {},
    user: { id: 'user-1', email: 'test@example.com' },
  },
  locale: undefined,
  permissions: {},
  visibleEntities: {},
} as any;

describe('LiveMatchTool', () => {
  it('renders DefaultTemplate with LiveMatchClient inside', () => {
    render(
      <LiveMatchTool
        initPageResult={mockInitPageResult}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('default-template')).toBeDefined();
    expect(screen.getByTestId('live-match-client')).toBeDefined();
  });

  it('renders without crashing when user is null', () => {
    const propsWithoutUser = {
      ...mockInitPageResult,
      req: { ...mockInitPageResult.req, user: null },
    };

    render(
      <LiveMatchTool
        initPageResult={propsWithoutUser}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('live-match-client')).toBeDefined();
  });
});
