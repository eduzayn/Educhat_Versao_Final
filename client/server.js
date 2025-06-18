import { createServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'

async function createDevServer() {
  const server = await createServer({
    configFile: './vite.config.ts',
    root: '.',
    server: {
      port: 3001,
      host: '0.0.0.0'
    }
  })
  
  await server.listen()
  server.printUrls()
}

createDevServer().catch(console.error)