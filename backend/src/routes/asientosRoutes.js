const express = require("express");
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');
const Hold = require('../models/holdModel');
const Ruta = require('../models/rutaModel');
const { EXTERNAL_API_URL, DEFAULT_PRECIO_UNITARIO_USD } = require('../config/externalApis');
const { calcularPrecioLocal } = require('../utils/discountUtils');

/**
 * @swagger
 * tags:
 *   name: Asientos
 *   description: API de Asientos (local + proxy a API externa). Holds persistidos en Mongo con TTL.
 */

const EXTERNAL_SEAT_API = EXTERNAL_API_URL;
const HOLD_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos
const TOTAL_ASIENTOS = 40;

// Devuelve los holds activos (no expirados) de una ruta/fecha desde Mongo.
async function getActiveHolds(rutaId, fecha) {
  try {
    return await Hold.find({
      rutaId: String(rutaId),
      fecha: String(fecha),
      expiresAt: { $gt: new Date() }
    }).lean();
  } catch (err) {
    console.error('[AsientosRoutes] Error consultando holds en Mongo:', err.message);
    return [];
  }
}

// Lista de asientos disponibles (1..N) que no tienen hold activo.
function computeAvailable(activeHolds, total = TOTAL_ASIENTOS) {
  const heldSet = new Set(activeHolds.map(h => Number(h.asiento)));
  const available = [];
  for (let i = 1; i <= total; i++) {
    if (!heldSet.has(i)) available.push(i);
  }
  return available;
}

/**
 * GET /api/asientos/view-model
 * View Model completo del mapa de asientos.
 */
router.get("/view-model", asyncHandler(async (req, res) => {
  const { rutaId, fecha, userId } = req.query;
  if (!rutaId || !fecha) {
    return res.status(400).json({ ok: false, error: "rutaId y fecha son requeridos" });
  }

  try {
    const response = await axios.get(`${EXTERNAL_SEAT_API}/view-model`, {
      params: { rutaId, fecha, userId },
      timeout: 10000,
    });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    const activeHolds = await getActiveHolds(rutaId, fecha);
    const holdBySeat = new Map(activeHolds.map(h => [Number(h.asiento), h]));
    const available = computeAvailable(activeHolds);
    const availableSet = new Set(available);
    const now = Date.now();

    const asientos = Array.from({ length: TOTAL_ASIENTOS }, (_, i) => {
      const num = i + 1;
      const hold = holdBySeat.get(num);
      let estado;
      if (availableSet.has(num)) {
        estado = 'disponible';
      } else if (hold) {
        estado = (userId && hold.userId === userId) ? 'miHold' : 'en_hold';
      } else {
        estado = 'ocupado';
      }
      return {
        numero: num,
        estado,
        holdId: hold ? hold.holdId : null,
        expiresAt: hold ? hold.expiresAt : null,
        remainingMs: hold ? Math.max(0, new Date(hold.expiresAt).getTime() - now) : null,
      };
    });

    return res.json({
      ok: true,
      rutaId,
      fecha,
      totalAsientos: TOTAL_ASIENTOS,
      asientos,
      available,
      total: available.length,
      resumen: {
        disponibles: available.length,
        enHold: asientos.filter(a => a.estado === 'en_hold').length,
        miHold: asientos.filter(a => a.estado === 'miHold').length,
        ocupados: asientos.filter(a => a.estado === 'ocupado').length,
      },
      _isFallback: true,
    });
  }
}));

/**
 * GET /api/asientos/disponibles
 */
router.get("/disponibles", asyncHandler(async (req, res) => {
  const { rutaId, fecha } = req.query;
  if (!rutaId || !fecha) {
    return res.status(400).json({ ok: false, error: "rutaId y fecha son requeridos" });
  }

  try {
    const response = await axios.get(`${EXTERNAL_SEAT_API}/disponibles`, {
      params: { rutaId, fecha },
      timeout: 4000
    });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    const activeHolds = await getActiveHolds(rutaId, fecha);
    const available = computeAvailable(activeHolds);
    return res.json({ ok: true, rutaId, fecha, available, total: TOTAL_ASIENTOS, _isFallback: true });
  }
}));

/**
 * GET /api/asientos/holds
 */
router.get("/holds", asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${EXTERNAL_SEAT_API}/holds`, { timeout: 4000 });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    const holds = await Hold.find({ expiresAt: { $gt: new Date() } }).lean();
    return res.json({ ok: true, holds, count: holds.length, _isFallback: true });
  }
}));

/**
 * POST /api/asientos/reservar
 * Crea un hold temporal. La unicidad (rutaId+fecha+asiento) la garantiza Mongo.
 */
router.post("/reservar", asyncHandler(async (req, res) => {
  const { rutaId, fecha, asiento, userId, clientId } = req.body;
  if (!rutaId || !fecha || !asiento) {
    return res.status(400).json({ ok: false, error: "rutaId, fecha y asiento son requeridos" });
  }

  const owner = userId || clientId || 'guest';

  // Conflicto: ¿ya hay un hold activo de otro usuario sobre este asiento?
  const existing = await Hold.findOne({
    rutaId: String(rutaId),
    fecha: String(fecha),
    asiento: Number(asiento),
    expiresAt: { $gt: new Date() }
  }).lean();

  if (existing && existing.userId !== owner) {
    return res.status(409).json({ ok: false, error: "Este asiento ya está reservado por otro usuario" });
  }

  try {
    const response = await axios.post(`${EXTERNAL_SEAT_API}/reservar`, {
      rutaId, fecha, asiento, userId: owner
    }, { timeout: 4000 });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    const holdId = `hold_${Date.now()}_${asiento}`;
    const expiresAt = new Date(Date.now() + HOLD_EXPIRY_MS);

    try {
      const hold = await Hold.findOneAndUpdate(
        { rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) },
        { $set: { userId: owner, holdId, expiresAt }, $setOnInsert: { rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return res.json({
        ok: true,
        holdId: hold.holdId,
        rutaId: hold.rutaId,
        fecha: hold.fecha,
        asiento: hold.asiento,
        userId: hold.userId,
        expiresAt: hold.expiresAt,
        remainingMs: Math.max(0, new Date(hold.expiresAt).getTime() - Date.now()),
        createdAt: hold.createdAt,
        _isFallback: true
      });
    } catch (dbErr) {
      if (dbErr && dbErr.code === 11000) {
        return res.status(409).json({ ok: false, error: "Este asiento ya está reservado por otro usuario" });
      }
      throw dbErr;
    }
  }
}));

/**
 * DELETE /api/asientos/holds
 * Libera un hold (cancela la reserva temporal).
 */
router.delete("/holds", asyncHandler(async (req, res) => {
  const { holdId, rutaId, fecha, asiento } = req.body;

  try {
    const response = await axios.delete(`${EXTERNAL_SEAT_API}/holds`, {
      data: { holdId, rutaId, fecha, asiento },
      timeout: 4000
    });
    if (holdId) await Hold.deleteOne({ holdId });
    else if (rutaId && fecha && asiento) await Hold.deleteOne({ rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    if (holdId) await Hold.deleteOne({ holdId });
    else if (rutaId && fecha && asiento) await Hold.deleteOne({ rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) });
    return res.json({ ok: true, released: true, _isFallback: true });
  }
}));

/**
 * POST /api/asientos/reservar-definitivo
 * Confirma un hold como reserva definitiva y libera el hold temporal.
 */
router.post("/reservar-definitivo", asyncHandler(async (req, res) => {
  const { holdId, rutaId, fecha, asiento } = req.body;
  if (!holdId || !rutaId || !fecha || !asiento) {
    return res.status(400).json({ ok: false, error: "holdId, rutaId, fecha y asiento son requeridos" });
  }

  try {
    const response = await axios.post(`${EXTERNAL_SEAT_API}/reservar-definitivo`, {
      holdId, rutaId, fecha, asiento
    }, { timeout: 4000 });
    await Hold.deleteOne({ rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) });
    return res.json({ ok: true, ...response.data });
  } catch (error) {
    await Hold.deleteOne({ rutaId: String(rutaId), fecha: String(fecha), asiento: Number(asiento) });
    return res.json({ ok: true, reservedAt: new Date().toISOString(), asiento, rutaId, fecha, _isFallback: true });
  }
}));

/**
 * POST /api/asientos/calcular-precio
 * Proxy de pricing (USD). Usa el precio real de la ruta si se envía rutaId.
 */
router.post("/calcular-precio", asyncHandler(async (req, res) => {
  const { cantidad, rutaId, fecha } = req.body;

  let precioUnitario = DEFAULT_PRECIO_UNITARIO_USD;
  if (rutaId) {
    try {
      const ruta = await Ruta.findById(rutaId).lean();
      if (ruta && ruta.price) precioUnitario = ruta.price;
    } catch (err) {
      // se mantiene el precio por defecto
    }
  }

  if (cantidad && cantidad > 0) {
    try {
      const response = await axios.post(`${EXTERNAL_SEAT_API}/calcular-precio`, {
        cantidad: Number(cantidad)
      }, { timeout: 4000 });

      const porcentajeDescuento = response.data.porcentajeDescuento || 0;
      const subtotal = cantidad * precioUnitario;
      const montoDescuento = Math.round(subtotal * (porcentajeDescuento / 100) * 100) / 100;
      const total = subtotal - montoDescuento;
      return res.json({
        ok: true, cantidad, precioUnitario, subtotal,
        porcentajeDescuento, montoDescuento, total, ahorros: montoDescuento,
        _source: 'local_price_external_discount'
      });
    } catch (error) {
      const desglose = calcularPrecioLocal(cantidad, precioUnitario);
      return res.json({ ok: true, ...desglose, _isFallback: true });
    }
  }

  if (!rutaId || !fecha) {
    return res.status(400).json({ ok: false, error: "cantidad o (rutaId y fecha) son requeridos" });
  }

  return res.json({
    ok: true,
    precioBase: precioUnitario,
    descuento: 0,
    recargo: 0,
    totalPagar: precioUnitario,
    _isFallback: true
  });
}));

module.exports = router;
