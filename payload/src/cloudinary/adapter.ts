import type { Adapter } from '@payloadcms/plugin-cloud-storage/types';
import { v2 as cloudinary } from 'cloudinary';
import type { CollectionConfig } from 'payload';
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
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: collectionPrefix,
              public_id: path.parse(file.filename).name,
              resource_type: 'auto',
              overwrite: false,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        // Store Cloudinary public_id in the document
        data.cloudinaryPublicId = result.public_id;
        data.url = result.secure_url;
        
        return data;
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    },

    handleDelete: async ({ doc, filename }) => {
      try {
        const publicId = (doc as any).cloudinaryPublicId || `${collectionPrefix}/${path.parse(filename).name}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
      }
    },

    generateURL: ({ filename, prefix: urlPrefix }) => {
      // Return the Cloudinary URL directly
      const publicId = `${urlPrefix || collectionPrefix}/${path.parse(filename).name}`;
      return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'auto',
      });
    },

    staticHandler: async (req, { params }) => {
      // For direct file access, redirect to Cloudinary
      const { filename } = params;
      const publicId = `${collectionPrefix}/${path.parse(filename).name}`;
      const url = cloudinary.url(publicId, {
        secure: true,
        resource_type: 'auto',
      });

      return Response.redirect(url, 302);
    },
  };
};

export default cloudinaryAdapter;
