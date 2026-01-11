import { connectToDatabase } from './database'

async function analyzeImages() {
  const mysql = await connectToDatabase()
  
  // Get all custom_texts with their HTML content
  const [customTexts] = await mysql.query(`
    SELECT id, title, html, permalink
    FROM custom_texts 
    WHERE status = 'active'
    ORDER BY id
  `) as any[]
  
  console.log(`\n📸 Custom Text Images Analysis`)
  console.log('================================================================================')
  console.log(`Total Custom Texts: ${customTexts.length}\n`)
  
  // Find images in HTML using regex
  const imageRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const textsWithImages: any[] = []
  const allImageUrls = new Set<string>()
  
  for (const text of customTexts) {
    const matches = Array.from(text.html.matchAll(imageRegex))
    if (matches.length > 0) {
      const urls = matches.map(m => m[1])
      textsWithImages.push({
        id: text.id,
        title: text.title,
        permalink: text.permalink,
        imageCount: urls.length,
        urls: urls
      })
      urls.forEach(url => allImageUrls.add(url))
    }
  }
  
  console.log(`Custom Texts with images: ${textsWithImages.length}`)
  console.log(`Total unique image URLs: ${allImageUrls.size}\n`)
  
  // Categorize image URLs
  const urlCategories = {
    imgur: Array.from(allImageUrls).filter(url => url.includes('imgur')),
    ynotradio: Array.from(allImageUrls).filter(url => url.includes('ynotradio.net')),
    box: Array.from(allImageUrls).filter(url => url.includes('box.com')),
    wordpress: Array.from(allImageUrls).filter(url => url.includes('wordpress')),
    relative: Array.from(allImageUrls).filter(url => url.startsWith('/')),
    other: Array.from(allImageUrls).filter(url => 
      !url.includes('imgur') && 
      !url.includes('ynotradio.net') && 
      !url.includes('box.com') &&
      !url.includes('wordpress') &&
      !url.startsWith('/')
    )
  }
  
  console.log('Image URL Categories:')
  console.log(`  Imgur: ${urlCategories.imgur.length}`)
  console.log(`  YNotRadio.net: ${urlCategories.ynotradio.length}`)
  console.log(`  Box.com: ${urlCategories.box.length}`)
  console.log(`  WordPress: ${urlCategories.wordpress.length}`)
  console.log(`  Relative paths: ${urlCategories.relative.length}`)
  console.log(`  Other: ${urlCategories.other.length}\n`)
  
  console.log('Custom Texts with Most Images:')
  console.log('================================================================================')
  const sorted = textsWithImages.sort((a, b) => b.imageCount - a.imageCount)
  for (let i = 0; i < Math.min(10, sorted.length); i++) {
    const text = sorted[i]
    console.log(`\nID ${text.id}: "${text.title}" (${text.imageCount} images)`)
    console.log(`  Permalink: ${text.permalink}`)
    text.urls.forEach((url: string) => console.log(`    - ${url}`))
  }
  
  if (textsWithImages.length === 0) {
    console.log('\n✅ No images found in custom_texts HTML content!')
    console.log('   All custom_texts are text-only or images were already stripped.')
  }
  
  await mysql.end()
}

analyzeImages()
