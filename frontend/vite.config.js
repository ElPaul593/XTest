import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true,
        port: 3000,
        proxy: {
            // Todas las rutas /api van al backend local (puerto 5000)
            // Vite evalúa las rutas en orden: las más específicas primero
            '/api/asientos': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            },
            '/api/auth': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            },
            '/api/users': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            },
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            }
        }
    }
})
