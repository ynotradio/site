#!/usr/bin/env tsx
/**
 * Re-import specific stories that are currently showing on the front page
 * This ensures they have proper images imported to Cloudinary
 */

import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { convertHtmlToLexical } from './shared/importUtils';
import { importImageFromUrl } from './shared/mediaImporter';
import { slugify, cleanHeadline } from './shared/slugify';

const STORY_IDS = [781]; // Testing HTML-to-Lexical anchor preservation

async function reimportStories() {
  console.log('🔄 Re-importing current front-page stories with images...');
  console.log(`Stories to import: ${STORY_IDS.join(', ')}\n`);
  
  const mysqlConnection = await connectToDatabase();
  const payload = await getPayloadClient('dev');
  
  // Delete existing posts with these legacyIds
  console.log('🗑️  Deleting existing posts...');
  for (const storyId of STORY_IDS) {
    try {
      const existing = await payload.find({
        collection: 'posts',
        where: { legacyId: { equals: storyId } },
        limit: 1,
      });
      if (existing.docs.length > 0) {
        await payload.delete({
          collection: 'posts',
          id: existing.docs[0].id,
        });
        console.log(`   ✅ Deleted post with legacyId ${storyId}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not delete legacyId ${storyId}:`, error);
    }
  }
  console.log('');
  
  const query = `
    SELECT id, headline, start_date, end_date, story as content, 
           pic as image_url, priority 
    FROM stories 
    WHERE id IN (${STORY_IDS.join(',')}) AND deleted = 'n'
    ORDER BY priority ASC
  `;
  
  const [rows] = await mysqlConnection.query(query);
  const stories = rows as any[];
  
  console.log(`Found ${stories.length} stories in MySQL\n`);
  
  let success = 0;
  let errors = 0;
  
  for (const story of stories) {
    try {
      console.log(`\n📝 Story ${story.id}: ${story.headline}`);
      console.log(`   Priority: ${story.priority}`);
      console.log(`   Image URL: ${story.image_url || '(none)'}`);
      
      const content = convertHtmlToLexical(story.content);
      
      // Clean headline and generate slug
      const cleanedHeadline = cleanHeadline(story.headline);
      const slug = slugify(story.headline);
      
      let imageId: string | undefined;
      if (story.image_url && story.image_url.trim() !== '') {
        console.log(`   ⬇️  Importing image to Cloudinary...`);
        const imageResult = await importImageFromUrl(payload, story.image_url, {
          alt: `Image for: ${story.headline}`,
          caption: story.headline,
          legacyUrl: story.image_url,
          legacyId: story.id,
        });
        
        if (imageResult.success && imageResult.mediaId) {
          imageId = imageResult.mediaId;
          console.log(`   ✅ Image uploaded: ${imageResult.cloudinaryUrl}`);
        } else {
          console.log(`   ⚠️  Image failed: ${imageResult.error}`);
        }
      }
      
      await payload.create({
        collection: 'posts',
        data: {
          headline: cleanedHeadline,
          slug,
          startDate: story.start_date,
          endDate: story.end_date,
          content,
          image: imageId,
          imageUrl: story.image_url,
          priority: story.priority || 0,
          legacyId: story.id,
          migratedAt: new Date().toISOString(),
          _status: 'published',
        },
      });
      
      console.log(`   ✅ Story created successfully`);
      console.log(`   📝 Headline: ${cleanedHeadline}`);
      console.log(`   🔗 Slug: ${slug}`);
      success++;
    } catch (error) {
      console.error(`   ❌ Failed to import story ${story.id}:`, error);
      errors++;
    }
  }
  
  await mysqlConnection.end();
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Re-import complete!`);
  console.log(`   Success: ${success}`);
  console.log(`   Errors: ${errors}`);
  console.log('='.repeat(60));
}

reimportStories().catch(console.error);
