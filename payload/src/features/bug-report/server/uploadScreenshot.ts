import { v2 as cloudinary } from 'cloudinary';

let configured = false;

const ensureConfigured = (): void => {
  if (configured) {
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
};

const isConfigured = (): boolean => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET,
);

const folder = process.env.NODE_ENV === 'production' ? 'prod/bug-reports' : 'dev/bug-reports';

/**
 * Upload a bug-report screenshot (a PNG data URL) to Cloudinary and return its
 * public URL, so it can be embedded in the GitHub issue body. GitHub's issues
 * API can't host binary attachments, so we reuse the Cloudinary account the site
 * already relies on for media.
 *
 * Returns null when Cloudinary isn't configured or the upload fails — a missing
 * screenshot must never block filing the report.
 */
export const uploadScreenshot = async (
  dataUrl: string | null,
  uploader: typeof cloudinary.uploader = cloudinary.uploader,
): Promise<string | null> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return null;
  }
  if (!isConfigured()) {
    return null;
  }

  try {
    ensureConfigured();
    const result = await uploader.upload(dataUrl, {
      folder,
      resource_type: 'image',
      overwrite: false,
    });
    return result.secure_url ?? null;
  } catch {
    return null;
  }
};
