import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  publicDir: command === 'build' ? false : 'public',
  build: {
    outDir: 'dist',
    license: { fileName: 'third-party-licenses.md' },
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about/index.html',
        robotData: 'training/robot-data/index.html',
        robotDataSources: 'training/robot-data/sources/index.html',
        qualityDelivery: 'quality/delivery/index.html',
        qualityDeliveryRecords: 'quality/delivery/records/index.html',
      },
    },
  },
}))
