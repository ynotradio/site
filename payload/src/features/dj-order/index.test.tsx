import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DJOrderTool } from './index';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

vi.mock('./DJOrderClient', () => ({
  DJOrderClient: () => <div data-testid="dj-order-client">DJ Order Client</div>,
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

describe('DJOrderTool', () => {
  it('renders DefaultTemplate with DJOrderClient inside', () => {
    render(
      <DJOrderTool
        initPageResult={mockInitPageResult}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('default-template')).toBeDefined();
    expect(screen.getByTestId('dj-order-client')).toBeDefined();
  });

  it('renders without crashing when user is null', () => {
    const propsWithoutUser = {
      ...mockInitPageResult,
      req: { ...mockInitPageResult.req, user: null },
    };

    render(
      <DJOrderTool
        initPageResult={propsWithoutUser}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('dj-order-client')).toBeDefined();
  });
});
