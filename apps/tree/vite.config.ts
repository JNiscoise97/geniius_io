import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: '../../data',  // geniius_io/data/ → servi sous /data/
          dest: '.'
        }
      ]
    })
  ],
  server: { port: 5177 }
})