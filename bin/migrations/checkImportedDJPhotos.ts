import { getPayloadClient } from './shared/payloadClient'

async function checkImported() {
  const payload = await getPayloadClient('dev')
  
  // Get all DJs
  const result = await payload.find({
    collection: 'djs',
    limit: 100,
    depth: 1,
  })
  
  console.log(`\n📸 Imported DJs Photo Status`)
  console.log('================================================================================')
  console.log(`Total DJs in Payload: ${result.totalDocs}\n`)
  
  const withPhotos = result.docs.filter(dj => dj.photo)
  const withoutPhotos = result.docs.filter(dj => !dj.photo)
  
  console.log(`DJs with photos: ${withPhotos.length}`)
  console.log(`DJs without photos: ${withoutPhotos.length}\n`)
  
  if (withoutPhotos.length > 0) {
    console.log('DJs missing photos:')
    console.log('================================================================================')
    for (const dj of withoutPhotos.slice(0, 20)) {
      const personNames = Array.isArray(dj.person) 
        ? dj.person.map((p: any) => typeof p === 'object' ? p.displayName : p).join(' & ')
        : 'Unknown'
      console.log(`  ID ${dj.id} (legacyId: ${dj.legacyId}): ${personNames}`)
    }
  }
  
  if (withPhotos.length > 0) {
    console.log('\nSample DJs with photos:')
    console.log('================================================================================')
    for (const dj of withPhotos.slice(0, 5)) {
      const personNames = Array.isArray(dj.person) 
        ? dj.person.map((p: any) => typeof p === 'object' ? p.displayName : p).join(' & ')
        : 'Unknown'
      const photoUrl = typeof dj.photo === 'object' ? (dj.photo as any).url : dj.photo
      console.log(`  ID ${dj.id} (legacyId: ${dj.legacyId}): ${personNames}`)
      console.log(`    Photo: ${photoUrl}\n`)
    }
  }
  
  process.exit(0)
}

checkImported()
