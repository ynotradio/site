// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createAdminView } from './createAdminView';

vi.mock('@payloadcms/next/templates', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-template">{children}</div>
  ),
}));

const mockProps = {
  initPageResult: {
    req: {
      i18n: {},
      payload: {},
      user: { email: 'admin@example.com' },
    },
    locale: undefined,
    permissions: {},
    visibleEntities: {},
  },
  params: Promise.resolve({ segments: [] }),
  searchParams: Promise.resolve({}),
};

describe('createAdminView', () => {
  it('returns a React component function', () => {
    const ClientComponent = () => <div>Client</div>;
    const AdminView = createAdminView(ClientComponent);

    expect(typeof AdminView).toBe('function');
  });

  it('renders the DefaultTemplate wrapping the client component', () => {
    const TestClient = () => <div data-testid="test-client">Test Content</div>;
    const AdminView = createAdminView(TestClient);

    render(<AdminView {...(mockProps as any)} />);

    expect(screen.getByTestId('default-template')).toBeInTheDocument();
    expect(screen.getByTestId('test-client')).toBeInTheDocument();
  });

  it('renders client component content inside the template', () => {
    const TestClient = () => <span>Hello Admin Panel</span>;
    const AdminView = createAdminView(TestClient);

    render(<AdminView {...(mockProps as any)} />);

    expect(screen.getByText('Hello Admin Panel')).toBeInTheDocument();
  });

  it('renders without errors when req.user is null (user passed as undefined)', () => {
    const propsNoUser = {
      ...mockProps,
      initPageResult: {
        ...mockProps.initPageResult,
        req: { ...mockProps.initPageResult.req, user: null },
      },
    };

    const TestClient = () => <div>No User</div>;
    const AdminView = createAdminView(TestClient);

    expect(() => render(<AdminView {...(propsNoUser as any)} />)).not.toThrow();
    expect(screen.getByText('No User')).toBeInTheDocument();
  });

  it('creates independent components for different client components', () => {
    const Client1 = () => <div data-testid="client1">First</div>;
    const Client2 = () => <div data-testid="client2">Second</div>;

    const AdminView1 = createAdminView(Client1);
    const AdminView2 = createAdminView(Client2);

    const { unmount } = render(<AdminView1 {...(mockProps as any)} />);
    expect(screen.getByTestId('client1')).toBeInTheDocument();
    expect(screen.queryByTestId('client2')).not.toBeInTheDocument();
    unmount();

    render(<AdminView2 {...(mockProps as any)} />);
    expect(screen.getByTestId('client2')).toBeInTheDocument();
    expect(screen.queryByTestId('client1')).not.toBeInTheDocument();
  });
});
