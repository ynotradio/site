// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StaffPicksListHeader } from './StaffPicksListHeader';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const year = new Date().getFullYear();

describe('StaffPicksListHeader', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    refresh.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts this year from last year's staff and refreshes the list", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        fromYear: year - 1,
        toYear: year,
        created: 27,
        skipped: 1,
      }),
    });
    render(<StaffPicksListHeader />);

    fireEvent.click(
      screen.getByRole('button', { name: `Start ${year} picks from last year's staff` }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      `Added 27 staff from ${year - 1} to ${year} (1 already there). Open each one to enter their picks.`,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/year-end-staff-picks/start-year',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the server's error", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: 'No staff picks before 2026 to copy.' }),
    });
    render(<StaffPicksListHeader />);

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'No staff picks before 2026 to copy.',
    );
  });

  it('says so when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<StaffPicksListHeader />);

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByRole('status')).toHaveTextContent('Could not start the new year.');
  });
});
