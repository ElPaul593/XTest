import axios from './api';

/**
 * Los asientos siempre pasan por el backend propio: él consulta la API externa y
 * descuenta lo ya vendido, que solo queda registrado en Mongo.
 */
const SEAT_API_BASE_URL = '/asientos';

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
            timeout: 15000
        });
        return response.data;
    } catch (err) {
        console.error('Error fetching disponibles:', err);

        return { ok: false, error: err.response?.data?.error || err.message };
    }
}

/**
 * POST /api/asientos/reservar
 * Crea un hold temporal sobre un asiento
 * Con fallback para modo demo
 */
export async function createHold({ rutaId, fecha, seatNumber, seatNumbers, companyName }) {
    try {
        const userId = CLIENT_ID();
        // Varios asientos en UNA llamada: la API valida las reglas de volumen
        // (máximo y razón social desde 5) sobre el conjunto y es todo-o-nada.
        const asientos = Array.isArray(seatNumbers) && seatNumbers.length > 0
            ? seatNumbers
            : [seatNumber];
        const response = await axios.post(`${SEAT_API_BASE_URL}/reservar`, {
            rutaId,
            fecha,
            asientos,
            userId,
            ...(companyName ? { companyName } : {})
        }, { timeout: 15000 });
        return response.data;
    } catch (err) {
        console.error('Error creating hold:', err);
        return {
            ok: false,
            error: err.response?.data?.error || err.message,
            code: err.response?.data?.code || err.response?.data?.details?.code
        };
    }
}

/**
 * GET /api/asientos/holds
 * Obtiene lista de holds activos
 */
export async function getHolds() {
    try {
        const response = await axios.get(`${SEAT_API_BASE_URL}/holds`, { timeout: 15000 });
        return response.data;
    } catch (err) {
        console.error('Error fetching holds:', err);
        return { ok: false, holds: [], error: err.message };
    }
}

/**
 * DELETE /api/asientos/holds
 * Libera un hold (cancela reserva temporal)
 * La API externa requiere holdId en el body
 */
export async function deleteHold({ holdId, holdIds, rutaId, fecha, asiento }) {
    try {
        if (Array.isArray(holdIds) && holdIds.length > 0) {
            const response = await axios.delete(`${SEAT_API_BASE_URL}/holds`, {
                data: { holdIds },
                timeout: 15000
            });
            return response.data;
        }
        // Intentar primero con holdId (método preferido)
        if (holdId) {
            const response = await axios.delete(`${SEAT_API_BASE_URL}/holds`, {
                data: { holdId },
                timeout: 15000
            });
            return response.data;
        }
        // Fallback: usar rutaId, fecha, asiento si no hay holdId
        if (rutaId && fecha && asiento) {
            const response = await axios.delete(`${SEAT_API_BASE_URL}/holds`, {
                data: { rutaId, fecha, asiento },
                timeout: 15000
            });
            return response.data;
        }
        return { ok: false, error: 'Se requiere holdId o (rutaId, fecha, asiento)' };
    } catch (err) {
        console.error('Error deleting hold:', err);
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
        }, { timeout: 15000 });
        return response.data;
    } catch (err) {
        console.error('Error confirming reservation:', err);
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
