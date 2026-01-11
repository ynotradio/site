import { connectToDatabase } from './database'
import { getPayloadClient } from './shared/payloadClient'
import { importImageFromUrl } from './shared/mediaImporter'
import { createLogger } from './shared/logger'
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical'

const logger = createLogger('CustomTextImages')

interface ImageMapping {
  originalUrl: string
  mediaId: string
  cloudinaryUrl: string
}

async function importImages() {
  const mysql = await connectToDatabase()
  const payload = await getPayloadClient('dev')
  
  logger.info('Starting custom text images import...')
  
  // Get all custom_texts with images
  const [customTexts] = await mysql.query(`
    SELECT id, title, html, permalink
    FROM custom_texts 
    WHERE status = 'active'
    ORDER BY id
  `) as any[]
  
  const imageRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let totalImages = 0
  let importedImages = 0
  let failedImages = 0
  
  for (const text of customTexts) {
    const matches = Array.from(text.html.matchAll(imageRegex))
    if (matches.length === 0) continue
    
    logger.info(`\nProcessing custom_text ${text.id}: "${text.title}" (${matches.length} images)`)
    
    const imageMappings: ImageMapping[] = []
    
    // Import each image
    for (const match of matches) {
      const imageUrl = match[1]
      totalImages++
      
      // Convert relative URLs to absolute
      let absoluteUrl = imageUrl
      if (imageUrl.startsWith('/')) {
        absoluteUrl = `https://www.ynotradio.net${imageUrl}`
      } else if (imageUrl.startsWith('images/') || imageUrl.startsWith('imgs/')) {
        absoluteUrl = `https://www.ynotradio.net/${imageUrl}`
      }
      
      logger.debug(`  Importing: ${absoluteUrl}`)
      
      const result = await importImageFromUrl(payload, absoluteUrl, {
        alt: `Image from ${text.title}`,
        caption: text.title,
        legacyUrl: imageUrl,
        legacyId: text.id,
      })
      
      if (result.success && result.mediaId) {
        imageMappings.push({
          originalUrl: imageUrl,
          mediaId: result.mediaId,
          cloudinaryUrl: result.cloudinaryUrl || ''
        })
        importedImages++
        logger.debug(`    ✓ Imported: ${result.mediaId}`)
      } else {
        failedImages++
        logger.warn(`    ✗ Failed: ${result.error}`)
      }
    }
    
    logger.info(`  Imported ${imageMappings.length}/${matches.length} images`)
    
    // Note: We're NOT updating the Lexical content here
    // The images are now in the Media collection and can be manually linked
    // or we can create a separate script to update the Lexical content
  }
  
  logger.info(`\n${'='.repeat(80)}`)
  logger.info(`Import Summary:`)
  logger.info(`  Total images found: ${totalImages}`)
  logger.info(`  Successfully imported: ${importedImages}`)
  logger.info(`  Failed: ${failedImages}`)
  logger.info(`  Success rate: ${((importedImages / totalImages) * 100).toFixed(1)}%`)
  logger.info(`${'='.repeat(80)}`)
  
  await mysql.end()
  process.exit(0)
}

importImages()
