import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowClonerTool } from './index';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

vi.mock('./ShowClonerClient', () => ({
  ShowClonerClient: () => <div data-testid="show-cloner-client">Show Cloner Client</div>,
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

describe('ShowClonerTool', () => {
  it('renders DefaultTemplate with ShowClonerClient inside', () => {
    render(
      <ShowClonerTool
        initPageResult={mockInitPageResult}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('default-template')).toBeDefined();
    expect(screen.getByTestId('show-cloner-client')).toBeDefined();
  });

  it('renders without crashing when user is null', () => {
    const propsWithoutUser = {
      ...mockInitPageResult,
      req: { ...mockInitPageResult.req, user: null },
    };

    render(
      <ShowClonerTool
        initPageResult={propsWithoutUser}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('show-cloner-client')).toBeDefined();
  });
});
