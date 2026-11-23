import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'server',
  // No image service and no sessions, so the Worker gets no IMAGES or SESSION
  // binding.
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  // Templates rely on HTML whitespace, where a newline between text and a tag
  // renders as a space.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
})
