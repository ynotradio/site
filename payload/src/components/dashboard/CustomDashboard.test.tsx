// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CustomDashboard, isMrmTileActive, type MrmTournament } from './CustomDashboard';

// Mock the Payload UI hook
vi.mock('@payloadcms/ui', () => ({
  useConfig: vi.fn(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const { useConfig } = await import('@payloadcms/ui');

function makePayloadResponse(docs: MrmTournament[]): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ docs }),
  } as Response);
}

describe('isMrmTileActive', () => {
  const NOW = new Date('2025-03-15T12:00:00.000Z');
  const FUTURE = new Date('2025-04-01T00:00:00.000Z').toISOString();
  const PAST = new Date('2025-01-01T00:00:00.000Z').toISOString();
  const RECENT = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
  const OLD = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for an empty array', () => {
    expect(isMrmTileActive([])).toBe(false);
  });

  it('returns true when a tournament is active', () => {
    expect(isMrmTileActive([{ status: 'active', startDate: PAST, updatedAt: OLD }])).toBe(true);
  });

  it('returns true when a tournament is upcoming (startDate in the future)', () => {
    expect(isMrmTileActive([{ status: 'draft', startDate: FUTURE, updatedAt: OLD }])).toBe(true);
  });

  it('returns true when a completed tournament was updated within 30 days', () => {
    expect(isMrmTileActive([{ status: 'complete', startDate: PAST, updatedAt: RECENT }])).toBe(
      true,
    );
  });

  it('returns false when a completed tournament was updated more than 30 days ago', () => {
    expect(isMrmTileActive([{ status: 'complete', startDate: PAST, updatedAt: OLD }])).toBe(false);
  });

  it('returns false for a draft tournament with a past startDate', () => {
    expect(isMrmTileActive([{ status: 'draft', startDate: PAST, updatedAt: OLD }])).toBe(false);
  });

  it('returns true when any tournament in the list meets the criteria', () => {
    expect(
      isMrmTileActive([
        { status: 'complete', startDate: PAST, updatedAt: OLD },
        { status: 'active', startDate: PAST, updatedAt: OLD },
      ]),
    ).toBe(true);
  });
});

describe('CustomDashboard', () => {
  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue({
      config: {
        routes: {
          admin: '/admin',
        },
      },
    } as any);
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(makePayloadResponse([])));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('header', () => {
    it('renders the dashboard title', () => {
      render(<CustomDashboard />);
      expect(screen.getByText('YNotRadio.net Admin')).toBeInTheDocument();
    });
  });

  describe('primary collections', () => {
    it('renders all 7 primary collection cards', () => {
      render(<CustomDashboard />);

      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('New Music')).toBeInTheDocument();
      expect(screen.getByText('CD of the Week')).toBeInTheDocument();
      expect(screen.getByText('Concerts')).toBeInTheDocument();
      expect(screen.getByText('On Demand')).toBeInTheDocument();
      expect(screen.getByText('Shows')).toBeInTheDocument();
      expect(screen.getByText('DJs')).toBeInTheDocument();
    });

    it('renders primary collection descriptions', () => {
      render(<CustomDashboard />);

      expect(
        screen.getByText(
          'Add or edit front-page stories. Set date ranges to control when they appear.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add songs and toggle "Feature on New Music" to update the New Music page.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Pick an album, write a review, and set the date. Only one should be current.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add concert listings. Toggle "Featured" to promote shows on the homepage.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Post archived recordings. Link audio files and tag the DJs and artists.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Build the weekly schedule. Use Show Cloner to copy a week to new dates.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Manage DJ profiles. Toggle "On Air" to show or hide them on the website.',
        ),
      ).toBeInTheDocument();
    });

    it('renders primary collection icons', () => {
      render(<CustomDashboard />);

      expect(screen.getByText('📰')).toBeInTheDocument();
      expect(screen.getByText('🎵')).toBeInTheDocument();
      expect(screen.getByText('💿')).toBeInTheDocument();
      expect(screen.getByText('🎸')).toBeInTheDocument();
      expect(screen.getByText('🎧')).toBeInTheDocument();
      expect(screen.getByText('📻')).toBeInTheDocument();
      expect(screen.getByText('🎙️')).toBeInTheDocument();
    });

    it('applies correct CSS classes to primary cards', () => {
      const { container } = render(<CustomDashboard />);
      const primaryCards = container.querySelectorAll('.primary-card');
      expect(primaryCards).toHaveLength(7);
    });
  });

  describe('action links', () => {
    it('renders View All and Add New links for each primary collection', () => {
      render(<CustomDashboard />);

      expect(screen.getAllByText('View All')).toHaveLength(7);
      expect(screen.getAllByText('+ Add New')).toHaveLength(7);
    });

    it('generates correct View All href for each collection', () => {
      render(<CustomDashboard />);

      const viewAllLinks = screen.getAllByText('View All');
      const expectedSlugs = [
        'posts',
        'songs',
        'cdoftheweek',
        'concerts',
        'ondemand',
        'shows',
        'djs',
      ];

      viewAllLinks.forEach((link, i) => {
        expect(link.closest('a')).toHaveAttribute('href', `/admin/collections/${expectedSlugs[i]}`);
      });
    });

    it('generates correct Add New href for each collection', () => {
      render(<CustomDashboard />);

      const addNewLinks = screen.getAllByText('+ Add New');
      const expectedSlugs = [
        'posts',
        'songs',
        'cdoftheweek',
        'concerts',
        'ondemand',
        'shows',
        'djs',
      ];

      addNewLinks.forEach((link, i) => {
        expect(link.closest('a')).toHaveAttribute(
          'href',
          `/admin/collections/${expectedSlugs[i]}/create`,
        );
      });
    });

    it('applies the --add modifier class on Add New links', () => {
      render(<CustomDashboard />);

      const addNewLinks = screen.getAllByText('+ Add New');
      addNewLinks.forEach((link) => {
        expect(link.closest('a')).toHaveClass('primary-card-action--add');
      });
    });

    it('uses custom admin route from config for both link types', () => {
      vi.mocked(useConfig).mockReturnValue({
        config: { routes: { admin: '/custom-admin' } },
      } as any);

      render(<CustomDashboard />);

      const viewAll = screen.getAllByText('View All')[0].closest('a');
      expect(viewAll).toHaveAttribute('href', '/custom-admin/collections/posts');

      const addNew = screen.getAllByText('+ Add New')[0].closest('a');
      expect(addNew).toHaveAttribute('href', '/custom-admin/collections/posts/create');
    });

    it('falls back to /admin when config is missing', () => {
      vi.mocked(useConfig).mockReturnValue({ config: undefined } as any);

      render(<CustomDashboard />);

      const viewAll = screen.getAllByText('View All')[0].closest('a');
      expect(viewAll).toHaveAttribute('href', '/admin/collections/posts');
    });
  });

  describe('secondary collections accordion', () => {
    it('is collapsed by default', () => {
      render(<CustomDashboard />);

      expect(screen.queryByText('Records')).not.toBeInTheDocument();
      expect(screen.queryByText('Artists')).not.toBeInTheDocument();
      expect(screen.queryByText('Venues')).not.toBeInTheDocument();
      expect(screen.queryByText('Advertisements')).not.toBeInTheDocument();
      expect(screen.queryByText('Media Files')).not.toBeInTheDocument();
    });

    it('has a toggle button with aria-expanded="false" by default', () => {
      render(<CustomDashboard />);

      const toggle = screen.getByRole('button', { name: /Supporting Content/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('expands when toggle is clicked', () => {
      render(<CustomDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));

      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Artists')).toBeInTheDocument();
      const peopleElements = screen.getAllByText('People');
      expect(peopleElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Venues')).toBeInTheDocument();
      expect(screen.getByText('Advertisements')).toBeInTheDocument();
      expect(screen.getByText('Media Files')).toBeInTheDocument();
    });

    it('collapses again when toggle is clicked a second time', () => {
      render(<CustomDashboard />);

      const toggle = screen.getByRole('button', { name: /Supporting Content/i });
      fireEvent.click(toggle);
      expect(screen.getByText('Records')).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(screen.queryByText('Records')).not.toBeInTheDocument();
    });

    it('updates aria-expanded when toggled', () => {
      render(<CustomDashboard />);

      const toggle = screen.getByRole('button', { name: /Supporting Content/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders chevron with open class when expanded', () => {
      const { container } = render(<CustomDashboard />);

      const chevron = container.querySelector('.section-toggle-chevron');
      expect(chevron).not.toHaveClass('section-toggle-chevron--open');

      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));
      expect(chevron).toHaveClass('section-toggle-chevron--open');
    });

    it('renders correct secondary collection groups when expanded', () => {
      render(<CustomDashboard />);
      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));

      const musicGroups = screen.getAllByText('Music');
      expect(musicGroups.length).toBeGreaterThan(0);
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('generates correct links for secondary collections when expanded', () => {
      render(<CustomDashboard />);
      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));

      expect(screen.getByText('Records').closest('a')).toHaveAttribute(
        'href',
        '/admin/collections/records',
      );
      expect(screen.getByText('Artists').closest('a')).toHaveAttribute(
        'href',
        '/admin/collections/artists',
      );
      expect(screen.getByText('Venues').closest('a')).toHaveAttribute(
        'href',
        '/admin/collections/venues',
      );
      expect(screen.getByText('Advertisements').closest('a')).toHaveAttribute(
        'href',
        '/admin/collections/ads',
      );
      expect(screen.getByText('Media Files').closest('a')).toHaveAttribute(
        'href',
        '/admin/collections/media',
      );
    });

    it('applies correct CSS classes to secondary cards when expanded', () => {
      const { container } = render(<CustomDashboard />);
      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));

      const secondaryCards = container.querySelectorAll('.secondary-card');
      expect(secondaryCards).toHaveLength(6);
    });

    it('does not render Year End Polls (temporarily hidden)', () => {
      render(<CustomDashboard />);
      fireEvent.click(screen.getByRole('button', { name: /Supporting Content/i }));

      expect(screen.queryByText('Year End Polls')).not.toBeInTheDocument();
      expect(screen.queryByText('Polls & Contests')).not.toBeInTheDocument();
    });
  });

  describe('section headings', () => {
    it('renders the Daily Content heading', () => {
      render(<CustomDashboard />);
      expect(screen.getByText('Daily Content')).toBeInTheDocument();
    });

    it('renders the Supporting Content heading', () => {
      render(<CustomDashboard />);
      expect(screen.getByText('Supporting Content')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('applies dashboard container class', () => {
      const { container } = render(<CustomDashboard />);
      expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
    });
  });

  describe('Special Events section', () => {
    it('does not render the Special Events section when no active tournaments', () => {
      render(<CustomDashboard />);
      expect(screen.queryByText('Special Events')).not.toBeInTheDocument();
    });

    it('does not render the Modern Rock Madness tile when no active tournaments', () => {
      render(<CustomDashboard />);
      expect(screen.queryByText('Modern Rock Madness')).not.toBeInTheDocument();
    });

    it('renders the Special Events section when a tournament is active', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'active',
              startDate: '2025-03-10T00:00:00.000Z',
              updatedAt: '2025-03-11T00:00:00.000Z',
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Special Events')).toBeInTheDocument();
      });
    });

    it('renders the Modern Rock Madness tile when a tournament is active', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'active',
              startDate: '2025-03-10T00:00:00.000Z',
              updatedAt: '2025-03-11T00:00:00.000Z',
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Modern Rock Madness')).toBeInTheDocument();
        expect(screen.getByText('🏆')).toBeInTheDocument();
        expect(
          screen.getByText('Annual tournament - manage brackets, matches, and results'),
        ).toBeInTheDocument();
      });
    });

    it('renders correct links for the Modern Rock Madness tile', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'active',
              startDate: '2025-03-10T00:00:00.000Z',
              updatedAt: '2025-03-11T00:00:00.000Z',
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        const viewAllLinks = screen.getAllByText('View All');
        const mrmViewAll = viewAllLinks.find((link) => {
          const href = link.closest('a')?.getAttribute('href');
          return href?.includes('modern-rock-madness-tournaments');
        });
        expect(mrmViewAll?.closest('a')).toHaveAttribute(
          'href',
          '/admin/collections/modern-rock-madness-tournaments',
        );

        expect(screen.getByText('Matches').closest('a')).toHaveAttribute(
          'href',
          '/admin/collections/modern-rock-madness-matches',
        );
      });
    });

    it('shows Special Events for an upcoming tournament', async () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'draft',
              startDate: future,
              updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Special Events')).toBeInTheDocument();
      });
    });

    it('shows Special Events for a tournament completed within 30 days', async () => {
      const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'complete',
              startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: recent,
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Special Events')).toBeInTheDocument();
      });
    });

    it('hides Special Events for a tournament completed more than 30 days ago', async () => {
      const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          makePayloadResponse([
            {
              status: 'complete',
              startDate: old,
              updatedAt: old,
            },
          ]),
        ),
      );

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Special Events')).not.toBeInTheDocument();
      });
    });

    it('hides Special Events when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await act(async () => {
        render(<CustomDashboard />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Special Events')).not.toBeInTheDocument();
      });
    });
  });
});
