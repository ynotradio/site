import { register } from 'tsx/esm/api'
import { pathToFileURL } from 'url'

// Register tsx to handle TypeScript files
register()

// Import and re-export the config
const configPath = pathToFileURL('./payload/payload.config.ts').href
const config = await import(configPath)

export default config.default
