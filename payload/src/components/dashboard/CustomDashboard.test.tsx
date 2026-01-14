// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders the dashboard title', () => {
    render(<CustomDashboard />);
    expect(screen.getByText('Y-Not Radio CMS')).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<CustomDashboard />);
    expect(
      screen.getByText('Welcome to the Y-Not Radio content management system'),
    ).toBeInTheDocument();
  });

  it('renders all primary collection cards', () => {
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
    expect(screen.getByText('Radio show schedule and information')).toBeInTheDocument();
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

  it('renders all secondary collection cards', () => {
    render(<CustomDashboard />);

    expect(screen.getByText('Records')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    // "People" appears as both label and group, use more specific query
    const peopleElements = screen.getAllByText('People');
    expect(peopleElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Venues')).toBeInTheDocument();
    expect(screen.getByText('Advertisements')).toBeInTheDocument();
    expect(screen.getByText('Year End Polls')).toBeInTheDocument();
    expect(screen.getByText('Media Files')).toBeInTheDocument();
  });

  it('renders secondary collection groups', () => {
    render(<CustomDashboard />);

    // There are multiple "Music" groups, check for at least one
    const musicGroups = screen.getAllByText('Music');
    expect(musicGroups.length).toBeGreaterThan(0);

    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Polls & Contests')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders section headings', () => {
    render(<CustomDashboard />);

    expect(screen.getByText('Main Content Areas')).toBeInTheDocument();
    expect(screen.getByText('Supporting Content')).toBeInTheDocument();
  });

  it('generates correct links for primary collections', () => {
    render(<CustomDashboard />);

    const postsLink = screen.getByText('Posts').closest('a');
    expect(postsLink).toHaveAttribute('href', '/admin/collections/posts');

    const songsLink = screen.getByText('New Music').closest('a');
    expect(songsLink).toHaveAttribute('href', '/admin/collections/songs');
  });

  it('generates correct links for secondary collections', () => {
    render(<CustomDashboard />);

    const recordsLink = screen.getByText('Records').closest('a');
    expect(recordsLink).toHaveAttribute('href', '/admin/collections/records');

    const artistsLink = screen.getByText('Artists').closest('a');
    expect(artistsLink).toHaveAttribute('href', '/admin/collections/artists');
  });

  it('uses custom admin route from config', () => {
    vi.mocked(useConfig).mockReturnValue({
      config: {
        routes: {
          admin: '/custom-admin',
        },
      },
    } as any);

    render(<CustomDashboard />);

    const postsLink = screen.getByText('Posts').closest('a');
    expect(postsLink).toHaveAttribute('href', '/custom-admin/collections/posts');
  });

  it('falls back to /admin when config is missing', () => {
    vi.mocked(useConfig).mockReturnValue({
      config: undefined,
    } as any);

    render(<CustomDashboard />);

    const postsLink = screen.getByText('Posts').closest('a');
    expect(postsLink).toHaveAttribute('href', '/admin/collections/posts');
  });

  it('applies correct CSS classes to primary cards', () => {
    const { container } = render(<CustomDashboard />);

    const primaryCards = container.querySelectorAll('.primary-card');
    expect(primaryCards.length).toBe(7); // 7 primary collections
  });

  it('applies correct CSS classes to secondary cards', () => {
    const { container } = render(<CustomDashboard />);

    const secondaryCards = container.querySelectorAll('.secondary-card');
    expect(secondaryCards.length).toBe(7); // 7 secondary collections (Shows moved to primary)
  });

  it('applies dashboard container class', () => {
    const { container } = render(<CustomDashboard />);

    expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
  });
});
