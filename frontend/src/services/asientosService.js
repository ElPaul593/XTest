import axios from 'axios';

/**
 * Servicio para la API de Asientos Externa
 * BaseURL: http://localhost:5000/api/asientos
 */

// Eliminar trailing slash para evitar doble slash en endpoints (/api/asientos//holds)
const SEAT_API_BASE_URL = (import.meta.env.VITE_SEAT_API_URL || '/api/asientos').replace(/\/$/, '');

const CLIENT_ID = () => {
    // Obtener userId del token o localStorage
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.userId || 'guest';
        } catch {
            return 'guest';
        }
    }
    return 'guest';
};

/**
 * GET /api/asientos/disponibles
 * Obtiene lista de asientos disponibles para una ruta y fecha
 * Con fallback para cuando la API externa está dormida
 */
export async function getDisponibles({ rutaId, fecha }) {
    try {
        const response = await axios.get(`${SEAT_API_BASE_URL}/disponibles`, {
            params: { rutaId, fecha },
            timeout: 8000
        });
        return response.data;
    } catch (err) {
        console.error('Error fetching disponibles:', err);

        // FALLBACK: Si la API externa falla (404, timeout, etc.), devolver datos de prueba
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.response?.status === 404) {
            console.warn('API no disponible (timeout/404) - usando datos de demostración');
            return {
                ok: true,
                rutaId,
                fecha,
                available: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 17, 18, 21, 22, 25, 26, 29, 30, 33, 34, 37, 38],
                total: 40,
                _isFallback: true
            };
        }
        return { ok: false, error: err.message };
    }
}

/**
 * POST /api/asientos/reservar
 * Crea un hold temporal sobre un asiento
 * Con fallback para modo demo
 */
export async function createHold({ rutaId, fecha, seatNumber }) {
    try {
        const userId = CLIENT_ID();
        const response = await axios.post(`${SEAT_API_BASE_URL}/reservar`, {
            rutaId,
            fecha,
            asiento: seatNumber,
            userId: userId // El proxy espera userId, no clientId
        }, { timeout: 8000 });
        return response.data;
    } catch (err) {
        console.error('Error creating hold:', err);
        const errorMsg = String(err.response?.data?.error || err.message || '');
        const errorDetails = err.response?.data;

        // FALLBACK: Usar demo si hay cualquier error de API externa (404, timeout, 400, etc.)
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.response?.status === 404 || err.response?.status === 400) {
            console.warn('API no disponible o error de validación (timeout/404/400) - usando modo demostración para hold');
            console.warn('Error details:', errorDetails);
            const demoHoldId = `demo_hold_${Date.now()}_${seatNumber}`;
            return {
                ok: true,
                holdId: demoHoldId,
                asiento: seatNumber,
                rutaId: String(rutaId),
                fecha: String(fecha),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                remainingMs: 300000,
                _isFallback: true,
                _originalError: errorMsg
            };
        }
        throw err; // Re-lanzar otros errores
    }
}

/**
 * GET /api/asientos/holds
 * Obtiene lista de holds activos
 */
export async function getHolds() {
    try {
        const response = await axios.get(`${SEAT_API_BASE_URL}/holds`, { timeout: 8000 });
        return response.data;
    } catch (err) {
        console.error('Error fetching holds:', err);
        // FALLBACK: Si la API falla (404, timeout, etc.), devolver lista vacía
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.response?.status === 404) {
            return { ok: true, holds: [], count: 0, _isFallback: true };
        }
        return { ok: false, holds: [], error: err.message };
    }
}

/**
 * DELETE /api/asientos/holds
 * Libera un hold (cancela reserva temporal)
 * La API externa requiere holdId en el body
 */
export async function deleteHold({ holdId, rutaId, fecha, asiento }) {
    try {
        // Intentar primero con holdId (método preferido)
        if (holdId) {
            const response = await axios.delete(`${SEAT_API_BASE_URL}/holds`, {
                data: { holdId },
                timeout: 8000
            });
            return response.data;
        }
        // Fallback: usar rutaId, fecha, asiento si no hay holdId
        if (rutaId && fecha && asiento) {
            const response = await axios.delete(`${SEAT_API_BASE_URL}/holds`, {
                data: { rutaId, fecha, asiento },
                timeout: 8000
            });
            return response.data;
        }
        return { ok: false, error: 'Se requiere holdId o (rutaId, fecha, asiento)' };
    } catch (err) {
        console.error('Error deleting hold:', err);
        // FALLBACK para demo (404, timeout, etc.)
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.response?.status === 404) {
            return { ok: true, released: true, _isFallback: true };
        }
        return { ok: false, error: err.response?.data?.error || err.message };
    }
}

/**
 * POST /api/asientos/reservar-definitivo
 * Confirma un hold como reserva definitiva
 * REQUIERE: rutaId, fecha, asiento, holdId
 */
export async function confirmReserva({ rutaId, fecha, asiento, holdId }) {
    // Validar que todos los campos requeridos estén presentes
    if (!rutaId || !fecha || !asiento || !holdId) {
        const missing = [];
        if (!rutaId) missing.push('rutaId');
        if (!fecha) missing.push('fecha');
        if (!asiento) missing.push('asiento');
        if (!holdId) missing.push('holdId');
        return {
            ok: false,
            error: `Campos requeridos faltantes: ${missing.join(', ')}`
        };
    }

    try {
        const response = await axios.post(`${SEAT_API_BASE_URL}/reservar-definitivo`, {
            rutaId,
            fecha,
            asiento,
            holdId
        }, { timeout: 8000 });
        return response.data;
    } catch (err) {
        console.error('Error confirming reservation:', err);
        // FALLBACK para demo (404, timeout, etc.)
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.response?.status === 404 || holdId?.startsWith('demo_')) {
            return { ok: true, reservedAt: new Date().toISOString(), _isFallback: true };
        }
        return { ok: false, error: err.response?.data?.error || err.message };
    }
}

/**
 * Combina disponibles + holds para determinar estado de cada asiento
 * @param {number[]} available - Lista de asientos disponibles
 * @param {object[]} holds - Lista de holds activos
 * @param {number} total - Total de asientos del bus
 * @param {string} myUserId - ID del usuario actual
 * @returns {object[]} - Array de asientos con estado
 */
export function buildSeatMap({ available, holds = [], total = 40, myUserId }) {
    // Asegurar que available sea un array
    let availableArray = [];
    if (Array.isArray(available)) {
        availableArray = available;
    } else if (available && typeof available === 'object') {
        // Si viene como objeto con estructura {numero: X, estado: Y}, extraer los números
        if (available.asientos && Array.isArray(available.asientos)) {
            availableArray = available.asientos.map(a => typeof a === 'object' ? a.numero : a);
        } else {
            // Intentar convertir a array si es posible
            availableArray = Object.values(available).filter(v => typeof v === 'number');
        }
    }

    const availableSet = new Set(availableArray);
    const holdMap = {};

    // Mapear holds por número de asiento
    (holds || []).forEach(h => {
        if (h && h.asiento) {
            holdMap[h.asiento] = h;
        }
    });

    const seats = [];
    const totalSeats = Math.max(1, Math.floor(total) || 40); // Asegurar que total sea un número válido

    for (let i = 1; i <= totalSeats; i++) {
        let status = 'reserved'; // Por defecto, reservado/ocupado
        let holdInfo = null;

        if (availableSet.has(i)) {
            status = 'available';
        } else if (holdMap[i]) {
            holdInfo = holdMap[i];
            if (holdMap[i].userId === myUserId || holdMap[i].clientId === myUserId) {
                status = 'heldByMe';
            } else {
                status = 'heldByOther';
            }
        }

        seats.push({
            number: i,
            status,
            holdInfo
        });
    }

    return seats;
}
