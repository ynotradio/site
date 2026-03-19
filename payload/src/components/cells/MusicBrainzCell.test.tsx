import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MusicBrainzArtistCell,
  MusicBrainzReleaseCell,
  MusicBrainzRecordingCell,
} from './MusicBrainzCell';

/**
 * NOTE: These tests are currently skipped due to CSS import issues with
 * @payloadcms/ui in the Vitest environment — matching the pattern established
 * by ThumbnailCell.test.tsx.
 */
describe.skip('MusicBrainzCell', () => {
  const field = { name: 'musicbrainzId', type: 'text' as const };
  const rowData = {};

  describe('MusicBrainzArtistCell', () => {
    it('renders a link to the MusicBrainz artist page when cellData is present', () => {
      const mbid = 'f27ec8db-af05-4f36-916e-3d57f91ecf5e';
      render(
        <MusicBrainzArtistCell
          cellData={mbid}
          field={field}
          collectionSlug="artists"
          rowData={rowData}
        />,
      );
      const link = screen.getByRole('link', { name: /view on musicbrainz/i });
      expect(link).toHaveAttribute('href', `https://musicbrainz.org/artist/${mbid}`);
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders a dash when cellData is null', () => {
      render(
        <MusicBrainzArtistCell
          cellData={null}
          field={field}
          collectionSlug="artists"
          rowData={rowData}
        />,
      );
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders a dash when cellData is an empty string', () => {
      render(
        <MusicBrainzArtistCell
          cellData=""
          field={field}
          collectionSlug="artists"
          rowData={rowData}
        />,
      );
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('MusicBrainzReleaseCell', () => {
    it('renders a link to the MusicBrainz release page when cellData is present', () => {
      const mbid = 'b84ee12a-09ef-421b-82de-0441a926375b';
      render(
        <MusicBrainzReleaseCell
          cellData={mbid}
          field={field}
          collectionSlug="records"
          rowData={rowData}
        />,
      );
      const link = screen.getByRole('link', { name: /view on musicbrainz/i });
      expect(link).toHaveAttribute('href', `https://musicbrainz.org/release/${mbid}`);
    });
  });

  describe('MusicBrainzRecordingCell', () => {
    it('renders a link to the MusicBrainz recording page when cellData is present', () => {
      const mbid = '5465ca86-3881-4349-81b2-6efbd3a59451';
      render(
        <MusicBrainzRecordingCell
          cellData={mbid}
          field={field}
          collectionSlug="songs"
          rowData={rowData}
        />,
      );
      const link = screen.getByRole('link', { name: /view on musicbrainz/i });
      expect(link).toHaveAttribute('href', `https://musicbrainz.org/recording/${mbid}`);
    });
  });
});
