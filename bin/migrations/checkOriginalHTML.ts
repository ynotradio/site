import { connectToDatabase } from './database'

async function checkHTML() {
  const mysql = await connectToDatabase()
  
  // Get custom_text 27 from MySQL
  const [texts] = await mysql.query(`
    SELECT id, title, html, permalink
    FROM custom_texts 
    WHERE id = 27
  `) as any[]
  
  if (texts.length === 0) {
    console.log('Custom text 27 not found')
    process.exit(1)
  }
  
  const text = texts[0]
  console.log(`\nCustom Text ID ${text.id}: ${text.title}`)
  console.log(`Permalink: ${text.permalink}`)
  console.log(`\nHTML (first 2000 chars):`)
  console.log(text.html.substring(0, 2000))
  console.log('\n...[truncated]')
  
  // Count images
  const imageMatches = text.html.match(/<img[^>]+>/g) || []
  console.log(`\nTotal <img> tags: ${imageMatches.length}`)
  
  await mysql.end()
}

checkHTML()
