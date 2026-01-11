import { connectToDatabase } from './database'

async function checkPhotos() {
  const mysql = await connectToDatabase()
  
  // Check what values deleted column has
  const [deletedValues] = await mysql.query(`
    SELECT DISTINCT deleted, COUNT(*) as count
    FROM deejays 
    GROUP BY deleted
  `) as any[]
  
  console.log('\nDeleted column values:')
  for (const row of deletedValues) {
    console.log(`  "${row.deleted}": ${row.count} DJs`)
  }
  
  // Get all DJs (not filtering by deleted)
  const [djs] = await mysql.query(`
    SELECT id, name, pic, deleted
    FROM deejays 
    ORDER BY id
  `) as any[]
  
  console.log(`\n📸 DJ Photos Analysis`)
  console.log('================================================================================')
  console.log(`Total DJs: ${djs.length}\n`)
  
  const withPhotos = djs.filter(dj => dj.pic && dj.pic.trim() !== '')
  const withoutPhotos = djs.filter(dj => !dj.pic || dj.pic.trim() === '')
  
  console.log(`DJs with photos: ${withPhotos.length}`)
  console.log(`DJs without photos: ${withoutPhotos.length}\n`)
  
  // Categorize photo URLs
  const imgur = withPhotos.filter(dj => dj.pic.includes('imgur'))
  const box = withPhotos.filter(dj => dj.pic.includes('box.com'))
  const local = withPhotos.filter(dj => dj.pic.startsWith('images/'))
  const other = withPhotos.filter(dj => 
    !dj.pic.includes('imgur') && 
    !dj.pic.includes('box.com') && 
    !dj.pic.startsWith('images/')
  )
  
  console.log('Photo URL Types:')
  console.log(`  Imgur: ${imgur.length}`)
  console.log(`  Box.com: ${box.length}`)
  console.log(`  Local (images/): ${local.length}`)
  console.log(`  Other: ${other.length}\n`)
  
  console.log('Sample Photos:')
  console.log('================================================================================')
  for (let i = 0; i < Math.min(10, withPhotos.length); i++) {
    const dj = withPhotos[i]
    console.log(`ID ${dj.id}: ${dj.name} (deleted: ${dj.deleted})`)
    console.log(`  ${dj.pic}\n`)
  }
  
  await mysql.end()
}

checkPhotos()
