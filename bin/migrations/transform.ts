import { Deejay } from './database';
import { migrationConfig } from './config';

// Sanity import format
export interface SanityImportData {
  imports: SanityPersonDocument[];
}

export interface SanityPersonDocument {
  _type: string;
  _id: string;
  name: string;
  slug: {
    _type: string;
    current: string;
  };
  photo?: {
    _type: string;
    asset: {
      _type: string;
      _ref: string;
    };
  };
  bio: any[];
  _createdAt: string;
}

// Create a slug from a name
export function createSlug(name: string): string {
  // Handle special case for "M.J. & Patria"
  if (name === 'M.J. & Patria') {
    return 'mj-and-patria';
  }

  let slug = name.toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

// Fix image paths
export function fixImagePath(path?: string): string | null {
  if (!path) return null;

  // If it's already a full URL, use it as is
  if (path.startsWith('http')) {
    return path;
  }

  // Handle Windows-style paths
  const normalizedPath = path.replace(/\\/g, '/');

  // If it's a local file path, convert to full URL
  if (normalizedPath.startsWith('images/') || normalizedPath.startsWith('images')) {
    return migrationConfig.baseUrl + normalizedPath;
  }

  return normalizedPath;
}

// Transform deejay data to Sanity format
export function transformDeejaysToSanityFormat(deejays: Deejay[]): SanityImportData {
  const imports = deejays.map((deejay) => {
    const { id } = deejay;
    const { name } = deejay;
    const slug = createSlug(name);

    // Format the show information, replacing <br> with commas
    const show = deejay.show?.replace(/<br>/g, ', ') || '';

    // Fix image path
    const imagePath = fixImagePath(deejay.pic);

    // Create the bio blocks
    const bioBlocks: any[] = [];

    // Add the show information if it exists
    if (show) {
      bioBlocks.push({
        _type: 'block',
        _key: `bio-${id}`,
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: `bio-${id}-span-1`,
            text: `Show: ${show}`,
            marks: ['strong'],
          },
        ],
      });
    } else {
      bioBlocks.push({
        _type: 'block',
        _key: `bio-${id}`,
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: `bio-${id}-span-1`,
            text: show,
            marks: [],
          },
        ],
      });
    }

    // Add social link if available
    if (deejay.external_connect_text && deejay.external_connect_url) {
      const socialText = deejay.external_connect_text.replace(/<br>/g, ' ');
      bioBlocks.push({
        _type: 'block',
        _key: `bio-${id}-social`,
        style: 'normal',
        markDefs: [
          {
            _key: `link-${id}`,
            _type: 'link',
            href: deejay.external_connect_url,
          },
        ],
        children: [
          {
            _type: 'span',
            _key: `bio-${id}-social-span-1`,
            text: socialText,
            marks: [`link-${id}`],
          },
        ],
      });
    }

    // Create the document
    const personDoc: SanityPersonDocument = {
      _type: 'person',
      _id: `deejay-${id}`,
      name,
      slug: {
        _type: 'slug',
        current: slug,
      },
      bio: bioBlocks,
      _createdAt: `${new Date().toISOString().split('T')[0]}T00:00:00Z`,
    };

    // Add photo if available
    if (imagePath) {
      // Sanity can't directly import with image@url format in the import document
      // Instead, we need to have a separate step to handle image import
      personDoc.photo = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: `image-placeholder-${id}`, // Placeholder, will be replaced by actual image reference later
        },
      };
    }

    return personDoc;
  });

  return { imports };
}
