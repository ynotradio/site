import { getPayloadClient } from './shared/payloadClient';

async function checkImages() {
  const payload = await getPayloadClient('dev');

  // Get custom_texts from Payload (legacyId >= 10000)
  const result = await payload.find({
    collection: 'posts',
    where: {
      legacyId: { greater_than_equal: 10000 },
    },
    limit: 50,
    depth: 0,
  });

  console.log('\n📸 Imported Custom Text Images Check');
  console.log('================================================================================');
  console.log(`Total Custom Texts in Payload: ${result.totalDocs}\n`);

  // Check if content has image nodes or upload nodes
  let hasImages = 0;
  let hasUploadNodes = 0;
  const samples: any[] = [];

  for (const post of result.docs) {
    const contentStr = JSON.stringify(post.content);

    // Check for image-related content
    if (contentStr.includes('"type":"image"')
        || contentStr.includes('"type":"upload"')
        || contentStr.includes('imgur')
        || contentStr.includes('mixcloud')) {
      if (contentStr.includes('"type":"upload"')) hasUploadNodes++;
      if (contentStr.includes('imgur') || contentStr.includes('mixcloud')) hasImages++;

      samples.push({
        id: post.id,
        legacyId: post.legacyId,
        headline: post.headline,
        hasUpload: contentStr.includes('"type":"upload"'),
        hasImageRef: contentStr.includes('imgur') || contentStr.includes('mixcloud'),
      });
    }
  }

  console.log(`Posts with upload nodes: ${hasUploadNodes}`);
  console.log(`Posts with image URLs in content: ${hasImages}`);
  console.log(`Total posts with any images: ${samples.length}\n`);

  if (samples.length > 0) {
    console.log('Sample posts with images:');
    console.log('================================================================================');
    for (const sample of samples.slice(0, 5)) {
      console.log(`\nID ${sample.id} (legacyId: ${sample.legacyId}): ${sample.headline}`);
      console.log(`  Has upload nodes: ${sample.hasUpload}`);
      console.log(`  Has image URLs: ${sample.hasImageRef}`);
    }
  } else {
    console.log('✅ No images found in imported custom_texts content!');
    console.log('   Images were stripped during import as expected.');
  }

  process.exit(0);
}

checkImages();
