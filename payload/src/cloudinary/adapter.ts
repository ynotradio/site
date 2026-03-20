import type { Adapter } from '@payloadcms/plugin-cloud-storage/types';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomBytes } from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folder = process.env.NODE_ENV === 'production' ? 'prod/uploads' : 'dev/uploads';

/**
 * Generate a random filename using timestamp and random bytes
 * Format: {timestamp}-{random} (e.g., 1704251928-a3f9c2d1)
 */
function generateRandomFilename(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

export const cloudinaryAdapter: Adapter = ({ prefix }) => {
  const collectionPrefix = prefix || folder;

  return {
    name: 'cloudinary',

    handleUpload: async ({ data, file }) => {
      // After the original image is uploaded, data.cloudinaryPublicId is set.
      // Subsequent calls are for sized variants (thumbnail, card, hero) —
      // skip them because we use Cloudinary's on-the-fly transformations.
      if (data.cloudinaryPublicId) {
        return {};
      }

      const randomFilename = generateRandomFilename();

      const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: collectionPrefix,
            public_id: randomFilename,
            resource_type: 'image',
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed without error'));
            }
          },
        );
        uploadStream.end(file.buffer);
      });

      const publicId = uploadResult.public_id;

      // eslint-disable-next-line no-param-reassign
      data.cloudinaryPublicId = publicId;
      // eslint-disable-next-line no-param-reassign
      data.filename = publicId;

      // Copy the public ID into each image-size filename so that
      // generateFileURL receives it when building transform URLs.
      if (data.sizes && typeof data.sizes === 'object') {
        Object.keys(data.sizes).forEach((sizeName) => {
          if (data.sizes[sizeName]) {
            // eslint-disable-next-line no-param-reassign
            data.sizes[sizeName].filename = publicId;
          }
        });
      }

      return {
        filename: publicId,
        cloudinaryPublicId: publicId,
      };
    },

    handleDelete: async ({ doc, filename }) => {
      try {
        // Use the stored cloudinaryPublicId if available, otherwise derive from filename
        const publicId = (doc as any).cloudinaryPublicId || filename;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        // Don't throw - file might already be deleted
      }
    },

    staticHandler: async (req, { params }) => {
      // This handles direct file access via /media/file/:filename
      // Redirect to the actual Cloudinary URL
      const { filename } = params;
      const publicId = filename.includes('/') ? filename : `${collectionPrefix}/${filename}`;

      const url = cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image',
        fetch_format: 'auto',
        quality: 'auto',
      });

      return Response.redirect(url, 302);
    },
  };
};

export default cloudinaryAdapter;
