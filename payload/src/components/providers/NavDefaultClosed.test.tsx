// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useNav, usePreferences } from '@payloadcms/ui';
import { NavDefaultClosed } from './NavDefaultClosed';

const mockSetNavOpen = vi.fn();
const mockGetPreference = vi.fn();

vi.mock('@payloadcms/ui', () => ({
  useNav: vi.fn(),
  usePreferences: vi.fn(),
}));

describe('NavDefaultClosed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNav).mockReturnValue({
      setNavOpen: mockSetNavOpen,
      navOpen: true,
      hydrated: true,
      navRef: { current: null },
      shouldAnimate: false,
    });
    vi.mocked(usePreferences).mockReturnValue({
      getPreference: mockGetPreference,
      setPreference: vi.fn(),
    });
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

  it('returns early when hasChecked is already true on second effect run', async () => {
    mockGetPreference.mockResolvedValue(null);

    // First render — effect runs, sets hasChecked.current = true
    const { rerender } = render(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );
    await waitFor(() => expect(mockGetPreference).toHaveBeenCalledTimes(1));

    // Swap to new function instances to force a dep change on next render
    const newGetPreference = vi.fn().mockResolvedValue(null);
    const newSetNavOpen = vi.fn();
    vi.mocked(useNav).mockReturnValueOnce({
      setNavOpen: newSetNavOpen,
      navOpen: true,
      hydrated: true,
      navRef: { current: null },
      shouldAnimate: false,
    });
    vi.mocked(usePreferences).mockReturnValueOnce({
      getPreference: newGetPreference,
      setPreference: vi.fn(),
    });

    // Re-render triggers useEffect again (new dep references)
    rerender(
      <NavDefaultClosed>
        <span>test</span>
      </NavDefaultClosed>,
    );

    // Give the effect time to run; hasChecked.current is already true so it returns early
    await act(async () => { await new Promise((r) => { setTimeout(r, 50); }); });

    // The new getPreference was never called because the early-return branch was taken
    expect(newGetPreference).not.toHaveBeenCalled();
  });
});
