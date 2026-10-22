import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Top11CloneButton } from './Top11CloneButton';

vi.mock('@payloadcms/ui', () => ({
  useDocumentInfo: vi.fn(),
  toast: { error: vi.fn() },
}));

const { useDocumentInfo, toast } = await import('@payloadcms/ui');

describe('Top11CloneButton', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('location', { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders nothing before the contest has been saved', () => {
    vi.mocked(useDocumentInfo).mockReturnValue({ id: undefined } as never);
    const { container } = render(<Top11CloneButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('clones the current contest and opens the new draft', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({ id: 7 } as never);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 8 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Top11CloneButton />);
    fireEvent.click(screen.getByText('Clone as New Draft'));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/collections/top11-contests/8'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/top11-contests/clone',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sourceContestId: 7 }),
      }),
    );
  });

  it('shows the API error and re-enables the button when the clone fails', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({ id: 7 } as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Unauthorized' }] }),
      }),
    );

    render(<Top11CloneButton />);
    fireEvent.click(screen.getByText('Clone as New Draft'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unauthorized'));
    expect(screen.getByText('Clone as New Draft')).not.toBeDisabled();
    expect(assign).not.toHaveBeenCalled();
  });
});
