import type { Meta, StoryObj } from '@storybook/react';
// Resolved to the mock via the @payloadcms/ui alias in .storybook/main.ts
import { setMockDocuments, resetMocks } from '@payloadcms/ui';
import { ThumbnailCell } from './ThumbnailCell';

/**
 * ThumbnailCell uses Payload's useListRelationships hook to fetch media
 * data by ID. In Storybook we pre-populate the mock document cache so
 * the component can look up the media object for the given cellData ID.
 */
const meta: Meta<typeof ThumbnailCell> = {
  title: 'Components/Cells/ThumbnailCell',
  component: ThumbnailCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      resetMocks();
      setMockDocuments({
        media: {
          'media-1': {
            id: 'media-1',
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            filename: 'sample-photo.jpg',
            alt: 'Sample photo',
          },
          'media-2': {
            id: 'media-2',
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            alt: 'Photo without filename',
          },
          'media-3': {
            id: 'media-3',
            filename: 'https://res.cloudinary.com/demo/image/upload/coffee.jpg',
          },
          'media-4': {
            id: 'media-4',
            alt: 'Image without URL',
          },
          'media-5': {
            id: 'media-5',
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            filename: 'very-long-filename-that-might-cause-layout-issues-in-table-cells.jpg',
            alt: 'Image with long filename',
          },
          'media-6': {
            id: 'media-6',
            url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_600,c_fill/sample.jpg',
            filename: 'portrait.jpg',
            alt: 'Portrait orientation',
          },
          'media-7': {
            id: 'media-7',
            url: 'https://res.cloudinary.com/demo/image/upload/w_800,h_400,c_fill/sample.jpg',
            filename: 'landscape.jpg',
            alt: 'Landscape orientation',
          },
        },
      });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ThumbnailCell>;

// Shared field stub — the component reads field.relationTo for the document lookup
const uploadField = { relationTo: 'media' } as any;

/**
 * Default state showing a thumbnail with image and filename
 */
export const Default: Story = {
  args: {
    cellData: 'media-1',
    field: uploadField,
  },
};

/**
 * Thumbnail with only URL, no filename displayed
 */
export const WithoutFilename: Story = {
  args: {
    cellData: 'media-2',
    field: uploadField,
  },
};

/**
 * Using filename as URL (local file path)
 */
export const LocalFile: Story = {
  args: {
    cellData: 'media-3',
    field: uploadField,
  },
};

/**
 * Empty state when no data is provided
 */
export const Empty: Story = {
  args: {
    cellData: null,
    field: uploadField,
  },
};

/**
 * Invalid data (not an object / no matching document)
 */
export const InvalidData: Story = {
  args: {
    cellData: 'nonexistent-id',
    field: uploadField,
  },
};

/**
 * Missing URL/filename in the media document
 */
export const MissingUrl: Story = {
  args: {
    cellData: 'media-4',
    field: uploadField,
  },
};

/**
 * Long filename to test text overflow
 */
export const LongFilename: Story = {
  args: {
    cellData: 'media-5',
    field: uploadField,
  },
};

/**
 * Square image (portrait orientation)
 */
export const PortraitImage: Story = {
  args: {
    cellData: 'media-6',
    field: uploadField,
  },
};

/**
 * Wide image (landscape orientation)
 */
export const LandscapeImage: Story = {
  args: {
    cellData: 'media-7',
    field: uploadField,
  },
};
