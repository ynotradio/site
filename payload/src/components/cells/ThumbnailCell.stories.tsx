import type { Meta, StoryObj } from '@storybook/react';
import { ThumbnailCell } from './ThumbnailCell';

const meta: Meta<typeof ThumbnailCell> = {
  title: 'Components/Cells/ThumbnailCell',
  component: ThumbnailCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThumbnailCell>;

/**
 * Default state showing a thumbnail with image and filename
 */
export const Default: Story = {
  args: {
    cellData: {
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      filename: 'sample-photo.jpg',
      alt: 'Sample photo',
    },
  },
};

/**
 * Thumbnail with only URL, no filename displayed
 */
export const WithoutFilename: Story = {
  args: {
    cellData: {
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      alt: 'Photo without filename',
    },
  },
};

/**
 * Using filename as URL (local file path)
 */
export const LocalFile: Story = {
  args: {
    cellData: {
      filename: 'https://res.cloudinary.com/demo/image/upload/coffee.jpg',
    },
  },
};

/**
 * Empty state when no data is provided
 */
export const Empty: Story = {
  args: {
    cellData: null,
  },
};

/**
 * Invalid data (not an object)
 */
export const InvalidData: Story = {
  args: {
    cellData: 'invalid-data' as any,
  },
};

/**
 * Missing URL/filename
 */
export const MissingUrl: Story = {
  args: {
    cellData: {
      alt: 'Image without URL',
    },
  },
};

/**
 * Long filename to test text overflow
 */
export const LongFilename: Story = {
  args: {
    cellData: {
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      filename: 'very-long-filename-that-might-cause-layout-issues-in-table-cells.jpg',
      alt: 'Image with long filename',
    },
  },
};

/**
 * Square image (portrait orientation)
 */
export const PortraitImage: Story = {
  args: {
    cellData: {
      url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_600,c_fill/sample.jpg',
      filename: 'portrait.jpg',
      alt: 'Portrait orientation',
    },
  },
};

/**
 * Wide image (landscape orientation)
 */
export const LandscapeImage: Story = {
  args: {
    cellData: {
      url: 'https://res.cloudinary.com/demo/image/upload/w_800,h_400,c_fill/sample.jpg',
      filename: 'landscape.jpg',
      alt: 'Landscape orientation',
    },
  },
};
