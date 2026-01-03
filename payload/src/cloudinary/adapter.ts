import type { Adapter } from '@payloadcms/plugin-cloud-storage/types';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folder = process.env.NODE_ENV === 'production' ? 'prod/uploads' : 'dev/uploads';

export const cloudinaryAdapter: Adapter = ({ collection, prefix }) => {
  const collectionPrefix = prefix || folder;

  return {
    name: 'cloudinary',
    
    handleUpload: async ({ data, file }) => {
      try {
        const result: UploadApiResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: collectionPrefix,
              public_id: path.parse(file.filename).name,
              resource_type: 'image',
              overwrite: false,
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error('Upload failed without error'));
            }
          );
          uploadStream.end(file.buffer);
        });

        // Store Cloudinary public_id for deletion and reference
        data.cloudinaryPublicId = result.public_id;
        
        // Important: The filename field should contain just the public_id
        // The plugin's generateFileURL will construct the full URL
        data.filename = result.public_id;
        
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    },

    handleDelete: async ({ doc, filename }) => {
      try {
        // Use the stored cloudinaryPublicId if available, otherwise derive from filename
        const publicId = (doc as any).cloudinaryPublicId || filename;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Cloudinary delete error:', error);
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
