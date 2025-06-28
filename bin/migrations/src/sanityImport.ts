import { createClient } from '@sanity/client';
import { sanityConfig } from './config';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { fixImagePath } from './transform';
import { Deejay } from './database';

// Create Sanity client
const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  token: sanityConfig.token,
  apiVersion: sanityConfig.apiVersion,
  useCdn: false,
});

/**
 * Process a single deejay to create a Sanity document
 */
export async function processSingleDeejay(deejay: Deejay): Promise<any> {
  const { id, name, show, external_connect_text, external_connect_url, pic } = deejay;
  
  // Create slug
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  // Handle special case for "M.J. & Patria"
  if (name === "M.J. & Patria") {
    slug = "mj-and-patria";
  }
  
  // Format the show information, replacing <br> with commas
  const formattedShow = show?.replace(/<br>/g, ', ') || '';
  
  // Process image if exists
  let imageAssetId: string | null = null;
  if (pic) {
    const imageUrl = fixImagePath(pic);
    if (imageUrl) {
      try {
        // Create a temporary file from the URL
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const tempFilePath = path.join(process.cwd(), `temp-deejay-${id}.jpg`);
        
        try {
          // Write the buffer to a temporary file
          await fsPromises.writeFile(tempFilePath, imageBuffer);
          
          // Upload the file to Sanity
          const asset = await client.assets.upload('image', fs.createReadStream(tempFilePath), {
            filename: `deejay-${id}.jpg`
          });
          
          // Save the asset ID
          imageAssetId = asset._id;
          console.log(`Uploaded image for ${name}`);
          
          // Clean up the temporary file
          await fsPromises.unlink(tempFilePath);
        } catch (fileError) {
          console.error(`File operation error for ${name}:`, fileError);
          
          // Try to clean up the temp file if it exists
          try {
            await fsPromises.access(tempFilePath);
            await fsPromises.unlink(tempFilePath);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        console.error(`Failed to upload image for ${name}:`, error);
      }
    }
  }
  
  // Create the bio blocks
  const bioBlocks: any[] = [];
  
  // Add the show information if it exists
  if (formattedShow) {
    bioBlocks.push({
      _type: 'block',
      _key: `bio-${id}`,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: `bio-${id}-span-1`,
          text: `Show: ${formattedShow}`,
          marks: ['strong']
        }
      ]
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
          text: '',
          marks: []
        }
      ]
    });
  }
  
  // Add social link if available
  if (external_connect_text && external_connect_url) {
    const socialText = external_connect_text.replace(/<br>/g, ' ');
    bioBlocks.push({
      _type: 'block',
      _key: `bio-${id}-social`,
      style: 'normal',
      markDefs: [
        {
          _key: `link-${id}`,
          _type: 'link',
          href: external_connect_url
        }
      ],
      children: [
        {
          _type: 'span',
          _key: `bio-${id}-social-span-1`,
          text: socialText,
          marks: [`link-${id}`]
        }
      ]
    });
  }
  
  // Create the person document
  const doc: any = {
    _id: `deejay-${id}`,
    _type: 'person',
    name,
    slug: {
      _type: 'slug',
      current: slug
    },
    bio: bioBlocks,
    _createdAt: new Date().toISOString().split('T')[0] + 'T00:00:00Z'
  };
  
  // Add image if we were able to upload it
  if (imageAssetId) {
    doc.photo = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAssetId
      }
    };
  }
  
  return doc;
}

/**
 * Import all deejays directly to Sanity
 */
export async function importDeejaysDirectly(deejays: Deejay[]): Promise<boolean> {
  try {
    console.log(`Processing ${deejays.length} deejays for direct import to Sanity...`);
    
    // First check if we need to delete existing person documents
    const query = "*[_type == 'person']";
    const existingDocs = await client.fetch(query);
    
    if (existingDocs.length > 0) {
      console.log(`Found ${existingDocs.length} existing person documents. Deleting...`);
      
      // Delete existing documents one by one
      for (const doc of existingDocs) {
        await client.delete(doc._id);
      }
      
      console.log('Deleted existing documents.');
    }
    
    // Process and create each deejay document
    let successCount = 0;
    for (const deejay of deejays) {
      try {
        const doc = await processSingleDeejay(deejay);
        await client.createOrReplace(doc);
        console.log(`Imported deejay: ${deejay.name}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to import deejay ${deejay.name}:`, error);
      }
    }
    
    console.log(`Successfully imported ${successCount} of ${deejays.length} deejays.`);
    return successCount > 0;
  } catch (error) {
    console.error('Error during direct import:', error);
    return false;
  }
}
