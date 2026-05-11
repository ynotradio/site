import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CdOfTheWeekWizardTool } from './index';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

vi.mock('./CdOfTheWeekWizardClient', () => ({
  CdOfTheWeekWizardClient: () => (
    <div data-testid="cdotw-wizard-client">CD of the Week Wizard Client</div>
  ),
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

describe('CdOfTheWeekWizardTool', () => {
  it('renders DefaultTemplate with CdOfTheWeekWizardClient inside', () => {
    render(
      <CdOfTheWeekWizardTool
        initPageResult={mockInitPageResult}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('default-template')).toBeDefined();
    expect(screen.getByTestId('cdotw-wizard-client')).toBeDefined();
  });

  it('renders without crashing when user is null', () => {
    const propsWithoutUser = {
      ...mockInitPageResult,
      req: { ...mockInitPageResult.req, user: null },
    };

    render(
      <CdOfTheWeekWizardTool
        initPageResult={propsWithoutUser}
        params={{} as any}
        searchParams={{} as any}
      />,
    );

    expect(screen.getByTestId('cdotw-wizard-client')).toBeDefined();
  });
});
