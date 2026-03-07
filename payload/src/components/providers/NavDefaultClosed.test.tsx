// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NavDefaultClosed } from './NavDefaultClosed';

const mockSetNavOpen = vi.fn();
const mockGetPreference = vi.fn();

vi.mock('@payloadcms/ui', () => ({
  useNav: () => ({
    setNavOpen: mockSetNavOpen,
    navOpen: true,
    hydrated: true,
    navRef: { current: null },
    shouldAnimate: false,
  }),
  usePreferences: () => ({
    getPreference: mockGetPreference,
    setPreference: vi.fn(),
  }),
}));

describe('NavDefaultClosed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    mockGetPreference.mockResolvedValue(null);

    render(
      <NavDefaultClosed>
        <span>child content</span>
      </NavDefaultClosed>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('collapses nav when no preference exists (null)', async () => {
    mockGetPreference.mockResolvedValue(null);

    render(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );

    await waitFor(() => {
      expect(mockGetPreference).toHaveBeenCalledWith('nav');
      expect(mockSetNavOpen).toHaveBeenCalledWith(false);
    });
  });

  it('collapses nav when no preference exists (undefined)', async () => {
    mockGetPreference.mockResolvedValue(undefined);

    render(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );

    await waitFor(() => {
      expect(mockSetNavOpen).toHaveBeenCalledWith(false);
    });
  });

  it('does not collapse nav when user has set preference to open', async () => {
    mockGetPreference.mockResolvedValue({ open: true });

    render(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );

    await waitFor(() => {
      expect(mockGetPreference).toHaveBeenCalledWith('nav');
    });

    expect(mockSetNavOpen).not.toHaveBeenCalled();
  });

  it('does not collapse nav when user has set preference to closed', async () => {
    mockGetPreference.mockResolvedValue({ open: false });

    render(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );

    await waitFor(() => {
      expect(mockGetPreference).toHaveBeenCalledWith('nav');
    });

    expect(mockSetNavOpen).not.toHaveBeenCalled();
  });

  it('only checks preference once across re-renders', async () => {
    mockGetPreference.mockResolvedValue(null);

    const { rerender } = render(
      <NavDefaultClosed>
        <span>first</span>
      </NavDefaultClosed>,
    );

    await waitFor(() => {
      expect(mockGetPreference).toHaveBeenCalledTimes(1);
    });

    rerender(
      <NavDefaultClosed>
        <span>second</span>
      </NavDefaultClosed>,
    );

    // Should still only have been called once
    expect(mockGetPreference).toHaveBeenCalledTimes(1);
  });
});
