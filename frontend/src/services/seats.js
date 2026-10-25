/**
 * ============================================================================
 * #18BUG — ARCHIVO HUÉRFANO: ninguna pantalla importa este servicio.
 * ============================================================================
 *
 * Las tres funciones que exporta (`getAvailableSeats`, `holdSeat`,
 * `confirmReservation`) no se usan en ningún sitio. La selección de asientos
 * real la resuelven `components/BusSeatSelector.jsx` y `pages/SeatBooking.jsx`,
 * que llaman a `/api/asientos/...` por su cuenta.
 *
 * Verificado: 0 importaciones de `services/seats` en `pages/` y `components/`.
 *
 * Además apunta a un prefijo distinto del que usa el resto de la aplicación
 * (`/seat/...` en vez de `/api/asientos/...`), así que es una tercera forma de
 * hablar con la misma API externa: `seatProxy.routes.js` y `asientosRoutes.js`
 * en el backend ya duplicaban ese proxy.
 * ============================================================================
 */

import api from './api';

/**
 * Servicio para asientos conectando con backend proxy
 */

/**
 * Obtiene asientos disponibles
 * @param {string} rutaId 
 * @param {string} fecha YYYY-MM-DD
 */
export async function getAvailableSeats(rutaId, fecha) {
    try {
        const response = await api.get('/seat/disponibles', {
            params: { rutaId, fecha }
        });
        return response.data;
    } catch (err) {
        console.error('Error fetching seats:', err);
        throw err; // Propagar error para manejarlo en UI
    }
}

/**
 * Reserva un asiento (hold)
 */
export async function holdSeat(data) {
    try {
        const response = await api.post('/seat/reservar', data);
        return response.data;
    } catch (err) {
        console.error('Error holding seat:', err);
        throw err;
    }
}

/**
 * Obtiene todos los holds
 */
export async function getHolds() {
    try {
        const response = await api.get('/seat/holds');
        return response.data;
    } catch (err) {
        console.error('Error getting holds:', err);
        throw err;
    }
}

/**
 * Libera/Cancela un hold
 */
export async function deleteHold(data) {
    try {
        const response = await api.delete('/seat/holds', { data }); // Axios delete body
        return response.data;
    } catch (err) {
        console.error('Error deleting hold:', err);
        throw err;
    }
}

/**
 * Confirma reserva definitiva
 */
export async function confirmReservation(data) {
    try {
        const response = await api.post('/seat/reservar-definitivo', data);
        return response.data;
    } catch (err) {
        console.error('Error confirming reservation:', err);
        throw err;
    }
}
