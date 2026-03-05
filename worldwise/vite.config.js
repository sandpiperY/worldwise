import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteImagemin from 'vite-plugin-imagemin'


export default defineConfig({
  plugins: [
    react(),
     viteImagemin({
      webp: {
        quality: 70   // 类似“压缩 30%”
      },
      mozjpeg: {
        quality: 70
      },
      pngquant: {
        quality: [0.6, 0.7]
      }
    })
  ],
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        }
      }
    }
  }
})
