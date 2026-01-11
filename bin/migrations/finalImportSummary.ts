import { connectToDatabase } from './database'
import { getPayloadClient } from './shared/payloadClient'

async function summary() {
  const mysql = await connectToDatabase()
  const payload = await getPayloadClient('dev')
  
  // Count active stories in MySQL (not deleted)
  const [storiesResult] = await mysql.query(`
    SELECT COUNT(*) as count 
    FROM stories 
    WHERE deleted = 'n'
  `) as any[]
  const activeStories = storiesResult[0].count
  
  // Count all stories (including deleted)
  const [allStoriesResult] = await mysql.query(`
    SELECT COUNT(*) as count 
    FROM stories
  `) as any[]
  const totalStories = allStoriesResult[0].count
  
  // Count custom texts
  const [customTextsResult] = await mysql.query(`
    SELECT COUNT(*) as count 
    FROM custom_texts 
    WHERE status = 'active'
  `) as any[]
  const customTexts = customTextsResult[0].count
  
  // Count in Payload
  const payloadPosts = await payload.find({
    collection: 'posts',
    limit: 0,
  })
  
  const payloadStories = await payload.find({
    collection: 'posts',
    where: {
      legacyId: {
        less_than: 10000,
      },
    },
    limit: 0,
  })
  
  const payloadCustomTexts = await payload.find({
    collection: 'posts',
    where: {
      legacyId: {
        greater_than_equal: 10000,
      },
    },
    limit: 0,
  })
  
  console.log('\n📊 Final Import Summary')
  console.log('================================================================================')
  console.log(`MySQL Stories (all): ${totalStories}`)
  console.log(`MySQL Stories (active/not deleted): ${activeStories}`)
  console.log(`MySQL Custom Texts (active): ${customTexts}`)
  console.log(`MySQL Total Active Posts: ${activeStories + customTexts}`)
  console.log('')
  console.log(`Payload Posts (total): ${payloadPosts.totalDocs}`)
  console.log(`Payload Stories: ${payloadStories.totalDocs}`)
  console.log(`Payload Custom Texts: ${payloadCustomTexts.totalDocs}`)
  console.log('================================================================================')
  console.log(`\nStories Success Rate: ${payloadStories.totalDocs}/${activeStories} (${((payloadStories.totalDocs / activeStories) * 100).toFixed(1)}%)`)
  console.log(`Custom Texts Success Rate: ${payloadCustomTexts.totalDocs}/${customTexts} (${((payloadCustomTexts.totalDocs / customTexts) * 100).toFixed(1)}%)`)
  console.log(`Overall Success Rate: ${payloadPosts.totalDocs}/${activeStories + customTexts} (${((payloadPosts.totalDocs / (activeStories + customTexts)) * 100).toFixed(1)}%)`)
  console.log('================================================================================\n')
  
  await mysql.end()
  process.exit(0)
}

summary()
