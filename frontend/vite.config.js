import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true,
        // 3001 y no 3000: es el origen que ya esta autorizado en Google Cloud

        // Console. Google compara el origen EXACTO, puerto incluido; con 3000

        // el boton renderiza pero al pulsarlo devuelve origin_mismatch.

        port: 3001,
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
