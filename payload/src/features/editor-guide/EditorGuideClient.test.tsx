/**
 * Unit tests for EditorGuideClient component
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorGuideClient } from './EditorGuideClient';

vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useStepNav: () => ({ setStepNav: vi.fn() }),
}));

describe('EditorGuideClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<EditorGuideClient />);
    expect(screen.getByText(/Editor Guide/i)).toBeInTheDocument();
  });

  it('renders both tab buttons', () => {
    render(<EditorGuideClient />);
    expect(screen.getByRole('tab', { name: /Daily Content/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Modern Rock Madness/i })).toBeInTheDocument();
  });

  it('shows Daily Content tab by default', () => {
    render(<EditorGuideClient />);
    const dailyTab = screen.getByRole('tab', { name: /Daily Content/i });
    expect(dailyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders daily content collection cards on default tab', () => {
    render(<EditorGuideClient />);
    expect(screen.getByText(/Posts \(Stories\)/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Songs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Concerts' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Recordings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All DJs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Shows' })).toBeInTheDocument();
  });

  it('links to correct collection URLs for daily content', () => {
    render(<EditorGuideClient />);
    const allPostsLink = screen.getByRole('link', { name: 'All Posts' });
    expect(allPostsLink).toHaveAttribute('href', '/admin/collections/posts');

    const newPostLink = screen.getByRole('link', { name: '+ New Post' });
    expect(newPostLink).toHaveAttribute('href', '/admin/collections/posts/create');
  });

  it('switches to MRM tab when clicked', () => {
    render(<EditorGuideClient />);
    const mrmTab = screen.getByRole('tab', { name: /Modern Rock Madness/i });
    fireEvent.click(mrmTab);
    expect(mrmTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Setup Workflow/i)).toBeInTheDocument();
  });

  it('renders MRM workflow steps', () => {
    render(<EditorGuideClient />);
    fireEvent.click(screen.getByRole('tab', { name: /Modern Rock Madness/i }));
    expect(screen.getByText(/Create Tournament/i)).toBeInTheDocument();
    expect(screen.getByText(/Add 64 Groups/i)).toBeInTheDocument();
    expect(screen.getByText(/Assign Seeds to Matches/i)).toBeInTheDocument();
    expect(screen.getByText(/Go Live/i)).toBeInTheDocument();
  });

  it('renders MRM quick links on MRM tab', () => {
    render(<EditorGuideClient />);
    fireEvent.click(screen.getByRole('tab', { name: /Modern Rock Madness/i }));
    expect(
      screen.getByRole('link', { name: /All Tournaments/i }),
    ).toHaveAttribute('href', '/admin/collections/modern-rock-madness-tournaments');
    expect(
      screen.getByRole('link', { name: /Live Match Dashboard/i }),
    ).toHaveAttribute('href', '/admin/mrm-live');
  });

  it('hides daily content when MRM tab is active', () => {
    render(<EditorGuideClient />);
    fireEvent.click(screen.getByRole('tab', { name: /Modern Rock Madness/i }));
    expect(screen.queryByText(/Posts \(Stories\)/i)).not.toBeInTheDocument();
  });

  it('returns to daily tab when clicked after MRM', () => {
    render(<EditorGuideClient />);
    fireEvent.click(screen.getByRole('tab', { name: /Modern Rock Madness/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Daily Content/i }));
    expect(screen.getByText(/Posts \(Stories\)/i)).toBeInTheDocument();
  });
});
