import { getPayloadClient } from './shared/payloadClient'
import { importImageFromUrl } from './shared/mediaImporter'
import { createLogger } from './shared/logger'

const logger = createLogger('FixDJPhoto')

async function fixMissingPhoto() {
  const payload = await getPayloadClient('dev')
  
  // Get DJ 75 from Payload
  const result = await payload.find({
    collection: 'djs',
    where: {
      legacyId: { equals: 75 }
    },
    limit: 1,
  })
  
  if (result.totalDocs === 0) {
    console.log('DJ 75 not found')
    process.exit(1)
  }
  
  const dj = result.docs[0]
  const photoUrl = 'https://i.imgur.com/MARUqpa.jpg'
  
  console.log(`\nImporting photo for DJ 75 (Judy G.): ${photoUrl}`)
  
  // Import the photo
  const photoResult = await importImageFromUrl(payload, photoUrl, {
    alt: 'Photo of Judy G.',
    caption: 'DJ photo',
    legacyUrl: photoUrl,
    legacyId: 75,
  })
  
  if (photoResult.success && photoResult.mediaId) {
    console.log(`\n✅ Photo imported successfully!`)
    console.log(`   Media ID: ${photoResult.mediaId}`)
    console.log(`   Cloudinary URL: ${photoResult.cloudinaryUrl}`)
    
    // Update DJ record
    await payload.update({
      collection: 'djs',
      id: dj.id,
      data: {
        photo: photoResult.mediaId,
      },
    })
    
    console.log(`\n✅ DJ ${dj.id} photo updated!`)
  } else {
    console.log(`\n❌ Failed to import photo: ${photoResult.error}`)
  }
  
  process.exit(0)
}

fixMissingPhoto()
