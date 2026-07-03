import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryOrderTool } from './index';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

vi.mock('./StoryOrderClient', () => ({
  StoryOrderClient: () => <div data-testid="story-order-client">Story Order Client</div>,
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

describe('StoryOrderTool', () => {
  it('renders DefaultTemplate with StoryOrderClient inside', () => {
    render(
      <StoryOrderTool
        initPageResult={mockInitPageResult}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('default-template')).toBeDefined();
    expect(screen.getByTestId('story-order-client')).toBeDefined();
  });

  it('renders without crashing when user is null', () => {
    const propsWithoutUser = {
      ...mockInitPageResult,
      req: { ...mockInitPageResult.req, user: null },
    };

    render(
      <StoryOrderTool
        initPageResult={propsWithoutUser}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('story-order-client')).toBeDefined();
  });
});
