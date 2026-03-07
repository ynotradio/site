// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDashboard } from './CustomDashboard';

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

describe('CustomDashboard', () => {
  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue({
      config: {
        routes: {
          admin: '/admin',
        },
      },
    } as any);
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

      expect(screen.getByText('Front page features and custom pages')).toBeInTheDocument();
      expect(screen.getByText('Songs featured on the New Music page')).toBeInTheDocument();
      expect(screen.getByText('Weekly album reviews')).toBeInTheDocument();
      expect(screen.getByText('Upcoming concert listings')).toBeInTheDocument();
      expect(screen.getByText('On-demand recordings and archives')).toBeInTheDocument();
      expect(screen.getByText('Radio show schedule and information')).toBeInTheDocument();
      expect(screen.getByText('DJ profiles and information')).toBeInTheDocument();
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
});
