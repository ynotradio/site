import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, fireEvent } from '@testing-library/react';
import { ThumbnailCell } from './ThumbnailCell';

// Mock @payloadcms/ui BEFORE importing components
const mockGetRelationships = vi.fn();
const mockDocuments: Record<string, Record<string, unknown>> = {};

vi.mock('@payloadcms/ui', () => ({
  useListRelationships: () => ({
    documents: mockDocuments,
    getRelationships: mockGetRelationships,
  }),
}));

const field = { name: 'photo', type: 'upload' as const, relationTo: 'media' };

describe('ThumbnailCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any media entries added by previous tests
    delete mockDocuments.media;
  });

  it('renders placeholder when cellData (media ID) is null', () => {
    render(<ThumbnailCell cellData={null} field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders placeholder when media document is not found', () => {
    render(<ThumbnailCell cellData="123" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('requests relationship data when media ID is provided', () => {
    render(<ThumbnailCell cellData="456" field={field} collectionSlug="artists" rowData={{}} />);
    expect(mockGetRelationships).toHaveBeenCalledWith([{ relationTo: 'media', value: '456' }]);
  });

  it('renders an image when media document has a url', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg', filename: 'photo.jpg' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/uploads/photo.jpg');
  });

  it('prefers thumbnailURL over url', () => {
    mockDocuments.media = {
      789: { id: '789', url: '/uploads/photo.jpg', thumbnailURL: '/uploads/thumb.jpg' },
    };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/thumb.jpg');
  });

  it('uses alt text from media.alt when provided', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg', alt: 'A photo' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'A photo');
  });

  it('falls back to filename for alt when alt is absent', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg', filename: 'photo.jpg' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'photo.jpg');
  });

  it('falls back to "Thumbnail" for alt when both alt and filename are absent', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Thumbnail');
  });

  it('shows filename caption when filename is present', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg', filename: 'photo.jpg' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('renders placeholder when media has no url', () => {
    mockDocuments.media = { 789: { id: '789' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders placeholder after image load error', () => {
    mockDocuments.media = { 789: { id: '789', url: '/uploads/photo.jpg' } };
    render(<ThumbnailCell cellData="789" field={field} collectionSlug="artists" rowData={{}} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
