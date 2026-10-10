const express = require("express");
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');
const Hold = require('../models/holdModel');
const Ruta = require('../models/rutaModel');
const {
  seatApiUrl,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_PRECIO_UNITARIO_USD,
  FALLBACK_TOTAL_ASIENTOS,
  FALLBACK_HOLD_TTL_MS
} = require('../config/externalApis');
const { calcularPrecioLocal } = require('../utils/discountUtils');

/**
 * @swagger
 * tags:
 *   name: Asientos
 *   description: >
 *     API de asientos. Delega en la API externa (`apiconsumidorac/seat-api`) y,
 *     solo si esta no responde, usa un fallback local con holds persistidos en
 *     Mongo con índice TTL.
 */

/**
 * ## Qué se corrigió en el consumo de la API externa
 *
 * 1. **Los caminos estaban mal y nunca se consumía la API.** Este archivo pedía
 *    `{base}/view-model`, `{base}/disponibles`, `{base}/holds`… pero la API
 *    expone todo eso bajo `{base}/api/asientos/...`. Todas las llamadas daban
 *    404, el `catch` lo tragaba y SIEMPRE se respondía con el fallback local.
 *    Los caminos viven ahora en `config/externalApis.js`, verificados contra la
 *    API en marcha.
 *
 * 2. **Se reservaba asiento por asiento.** La API acepta `asientos: [5, 6]` y
 *    devuelve en una sola respuesta `holdIds`, el detalle por asiento y el
 *    `pricing` completo. Ahora se aprovecha: N asientos, una llamada.
 *
 * 3. **Se ignoraban datos que la API ya da.** El total de asientos y el TTL de
 *    los holds estaban escritos a mano (40 y 5 minutos). La API devuelve
 *    `totalAsientos` y `ttlMs` (10 minutos), así que el temporizador del
 *    frontend iba desfasado la mitad del tiempo. Ahora se respeta lo que diga la
 *    API y las constantes locales son solo respaldo.
 *
 * 4. **Se perdía la moneda.** La API cotiza en COP y adjunta el cobro
 *    equivalente en USD (`cobro`). Antes se asumía USD y se mezclaban importes
 *    de escalas distintas. Ahora la moneda y el bloque `cobro` se propagan tal
 *    cual.
 *
 * Toda respuesta que venga del fallback local lleva `_isFallback: true`, y las
 * que vienen de la API externa llevan `_source: 'external-api'`, para que el
 * frontend (y quien depure) sepa de dónde salió cada dato.
 */

const TIMEOUT = DEFAULT_REQUEST_TIMEOUT_MS;

/** Normaliza el cuerpo de entrada: acepta `asiento` suelto o `asientos` en lote. */
function normalizarAsientos({ asiento, asientos }) {
  const lista = Array.isArray(asientos) ? asientos : (asiento != null ? [asiento] : []);
  return [...new Set(lista.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}

// ---------------------------------------------------------------------------
// Fallback local (solo si la API externa no responde)
// ---------------------------------------------------------------------------

/** Holds activos (no expirados) de una ruta/fecha, desde Mongo. */
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

/** Asientos 1..N sin hold activo. */
function computeAvailable(activeHolds, total = FALLBACK_TOTAL_ASIENTOS) {
  const heldSet = new Set(activeHolds.map((h) => Number(h.asiento)));
  const available = [];
  for (let i = 1; i <= total; i++) {
    if (!heldSet.has(i)) available.push(i);
  }
  return available;
}

/**
 * Registra por qué se cayó al fallback. Sin esto el problema de los 404 pasó
 * inadvertido durante todo el desarrollo: conviene que deje rastro.
 */
function logFallback(operacion, error) {
  const status = error?.response?.status;
  const detalle = status ? `HTTP ${status}` : (error?.code || error?.message);
  console.warn(`[AsientosRoutes] ${operacion}: API externa no disponible (${detalle}). Usando fallback local.`);
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/asientos/view-model:
 *   get:
 *     summary: Mapa completo de asientos en una sola llamada
 *     tags: [Asientos]
 *     parameters:
 *       - in: query
 *         name: rutaId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Permite distinguir `miHold` de `en_hold`.
 *     responses:
 *       200:
 *         description: >
 *           Mapa de asientos. Incluye `totalAsientos`, `ttlMs`, `precios` y el
 *           estado de cada asiento. `_isFallback: true` indica que la API
 *           externa no respondió.
 */
router.get("/view-model", asyncHandler(async (req, res) => {
  const { rutaId, fecha, userId } = req.query;
  if (!rutaId || !fecha) {
    return res.status(400).json({ ok: false, error: "rutaId y fecha son requeridos" });
  }

  try {
    const response = await axios.get(seatApiUrl('viewModel'), {
      params: { rutaId, fecha, userId },
      timeout: TIMEOUT
    });
    // Se propaga tal cual: incluye `posicion` (Ventana/Pasillo), `precios` y
    // `ttlMs`, que el frontend necesita y antes se perdían.
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    logFallback('view-model', error);

    const activeHolds = await getActiveHolds(rutaId, fecha);
    const holdBySeat = new Map(activeHolds.map((h) => [Number(h.asiento), h]));
    const available = computeAvailable(activeHolds);
    const availableSet = new Set(available);
    const now = Date.now();

    const asientos = Array.from({ length: FALLBACK_TOTAL_ASIENTOS }, (_, i) => {
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
        remainingMs: hold ? Math.max(0, new Date(hold.expiresAt).getTime() - now) : null
      };
    });

    return res.json({
      ok: true,
      rutaId,
      fecha,
      totalAsientos: FALLBACK_TOTAL_ASIENTOS,
      ttlMs: FALLBACK_HOLD_TTL_MS,
      asientos,
      available,
      total: available.length,
      resumen: {
        disponibles: available.length,
        enHold: asientos.filter((a) => a.estado === 'en_hold').length,
        miHold: asientos.filter((a) => a.estado === 'miHold').length,
        ocupados: asientos.filter((a) => a.estado === 'ocupado').length
      },
      _isFallback: true
    });
  }
}));

/**
 * @swagger
 * /api/asientos/disponibles:
 *   get:
 *     summary: Lista de asientos disponibles (contrato original)
 *     tags: [Asientos]
 */
router.get("/disponibles", asyncHandler(async (req, res) => {
  const { rutaId, fecha } = req.query;
  if (!rutaId || !fecha) {
    return res.status(400).json({ ok: false, error: "rutaId y fecha son requeridos" });
  }

  try {
    const response = await axios.get(seatApiUrl('disponibles'), {
      params: { rutaId, fecha },
      timeout: TIMEOUT
    });
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    logFallback('disponibles', error);
    const activeHolds = await getActiveHolds(rutaId, fecha);
    const available = computeAvailable(activeHolds);
    return res.json({
      ok: true,
      rutaId,
      fecha,
      available,
      total: FALLBACK_TOTAL_ASIENTOS,
      _isFallback: true
    });
  }
}));

/**
 * @swagger
 * /api/asientos/holds:
 *   get:
 *     summary: Holds activos
 *     tags: [Asientos]
 */
router.get("/holds", asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(seatApiUrl('holds'), { timeout: TIMEOUT });
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    logFallback('holds', error);
    const holds = await Hold.find({ expiresAt: { $gt: new Date() } }).lean();
    return res.json({ ok: true, holds, count: holds.length, _isFallback: true });
  }
}));

/**
 * @swagger
 * /api/asientos/reservar:
 *   post:
 *     summary: Bloquear uno o varios asientos (hold temporal)
 *     description: >
 *       Acepta `asiento` (uno) o `asientos` (lote). Con la API externa, N asientos
 *       se bloquean en UNA sola llamada y la respuesta ya trae `holdIds` y el
 *       `pricing` calculado, sin necesidad de cotizar aparte.
 *     tags: [Asientos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rutaId, fecha]
 *             properties:
 *               rutaId: { type: string }
 *               fecha: { type: string, format: date }
 *               asiento: { type: integer, description: "Un solo asiento (compatibilidad)" }
 *               asientos:
 *                 type: array
 *                 items: { type: integer }
 *                 description: "Varios asientos en una sola operación"
 *               userId: { type: string }
 *     responses:
 *       200: { description: Hold(s) creados }
 *       409: { description: Alguno de los asientos ya está bloqueado por otro usuario }
 */
router.post("/reservar", asyncHandler(async (req, res) => {
  const { rutaId, fecha, userId, clientId } = req.body;
  const asientos = normalizarAsientos(req.body);

  if (!rutaId || !fecha || asientos.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "rutaId, fecha y al menos un asiento son requeridos"
    });
  }

  const owner = userId || clientId || 'guest';

  try {
    // Una sola llamada para todos los asientos. La API resuelve los conflictos
    // y devuelve 409 si alguno ya está tomado, así que no hace falta
    // comprobarlo antes por nuestra cuenta.
    const response = await axios.post(
      seatApiUrl('reservar'),
      { rutaId, fecha, asientos, userId: owner },
      { timeout: TIMEOUT }
    );
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    // Un 409 es una respuesta legítima del negocio, no una caída: se propaga
    // en lugar de disimularla con el fallback, que daría un resultado distinto.
    if (error?.response?.status === 409) {
      return res.status(409).json({
        ok: false,
        ...(error.response.data || {}),
        error: error.response.data?.error || "Alguno de los asientos ya está reservado"
      });
    }

    logFallback('reservar', error);

    // Fallback local: la unicidad (rutaId+fecha+asiento) la garantiza el índice
    // único de Mongo.
    const expiresAt = new Date(Date.now() + FALLBACK_HOLD_TTL_MS);
    const creados = [];

    for (const asiento of asientos) {
      const existente = await Hold.findOne({
        rutaId: String(rutaId),
        fecha: String(fecha),
        asiento,
        expiresAt: { $gt: new Date() }
      }).lean();

      if (existente && existente.userId !== owner) {
        return res.status(409).json({
          ok: false,
          error: `El asiento ${asiento} ya está reservado por otro usuario`,
          asientoEnConflicto: asiento
        });
      }

      try {
        const holdId = `hold_${Date.now()}_${asiento}`;
        const hold = await Hold.findOneAndUpdate(
          { rutaId: String(rutaId), fecha: String(fecha), asiento },
          {
            $set: { userId: owner, holdId, expiresAt },
            $setOnInsert: { rutaId: String(rutaId), fecha: String(fecha), asiento }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        creados.push({ holdId: hold.holdId, asiento: hold.asiento });
      } catch (dbErr) {
        if (dbErr && dbErr.code === 11000) {
          return res.status(409).json({
            ok: false,
            error: `El asiento ${asiento} ya está reservado por otro usuario`,
            asientoEnConflicto: asiento
          });
        }
        throw dbErr;
      }
    }

    return res.json({
      ok: true,
      holdId: creados[0]?.holdId || null,
      asiento: creados[0]?.asiento || null,
      holdIds: creados.map((h) => h.holdId),
      asientos: creados.map((h) => h.asiento),
      holds: creados,
      expiresAt: expiresAt.getTime(),
      remainingMs: FALLBACK_HOLD_TTL_MS,
      ttlMs: FALLBACK_HOLD_TTL_MS,
      _isFallback: true
    });
  }
}));

/**
 * @swagger
 * /api/asientos/holds:
 *   delete:
 *     summary: Liberar uno o varios holds (idempotente)
 *     tags: [Asientos]
 */
router.delete("/holds", asyncHandler(async (req, res) => {
  const { holdId, holdIds, rutaId, fecha } = req.body;
  const asientos = normalizarAsientos(req.body);
  const todosLosHolds = [...new Set([holdId, ...(Array.isArray(holdIds) ? holdIds : [])].filter(Boolean))];

  /** Limpia el espejo local, para que no queden holds huérfanos tras usar la API. */
  const limpiarLocal = async () => {
    if (todosLosHolds.length > 0) {
      await Hold.deleteMany({ holdId: { $in: todosLosHolds } });
    } else if (rutaId && fecha && asientos.length > 0) {
      await Hold.deleteMany({
        rutaId: String(rutaId),
        fecha: String(fecha),
        asiento: { $in: asientos }
      });
    }
  };

  try {
    const response = await axios.delete(seatApiUrl('holds'), {
      data: { holdId, holdIds: todosLosHolds, rutaId, fecha, asiento: asientos[0], asientos },
      timeout: TIMEOUT
    });
    await limpiarLocal();
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    logFallback('liberar holds', error);
    await limpiarLocal();
    return res.json({ ok: true, released: true, _isFallback: true });
  }
}));

/**
 * @swagger
 * /api/asientos/reservar-definitivo:
 *   post:
 *     summary: Confirmar el hold como reserva definitiva (sin pago en línea)
 *     tags: [Asientos]
 */
router.post("/reservar-definitivo", asyncHandler(async (req, res) => {
  const { holdId, holdIds, rutaId, fecha } = req.body;
  const asientos = normalizarAsientos(req.body);
  const todosLosHolds = [...new Set([holdId, ...(Array.isArray(holdIds) ? holdIds : [])].filter(Boolean))];

  if (todosLosHolds.length === 0 && (!rutaId || !fecha || asientos.length === 0)) {
    return res.status(400).json({
      ok: false,
      error: "Se requiere holdId/holdIds, o bien rutaId + fecha + asiento(s)"
    });
  }

  const limpiarLocal = async () => {
    if (rutaId && fecha && asientos.length > 0) {
      await Hold.deleteMany({
        rutaId: String(rutaId),
        fecha: String(fecha),
        asiento: { $in: asientos }
      });
    } else if (todosLosHolds.length > 0) {
      await Hold.deleteMany({ holdId: { $in: todosLosHolds } });
    }
  };

  try {
    const response = await axios.post(
      seatApiUrl('reservarDefinitivo'),
      { holdId, holdIds: todosLosHolds, rutaId, fecha, asiento: asientos[0], asientos },
      { timeout: TIMEOUT }
    );
    await limpiarLocal();
    return res.json({ ok: true, ...response.data, _source: 'external-api' });
  } catch (error) {
    logFallback('reservar-definitivo', error);
    await limpiarLocal();
    return res.json({
      ok: true,
      reservedAt: new Date().toISOString(),
      asientos,
      rutaId,
      fecha,
      _isFallback: true
    });
  }
}));

/**
 * @swagger
 * /api/asientos/calcular-precio:
 *   post:
 *     summary: Cotizar N asientos
 *     description: >
 *       Delega en la API externa, que cotiza en COP y adjunta el cobro equivalente
 *       en USD (`cobro`). Si se envía `rutaId`, el precio unitario del catálogo
 *       local se usa únicamente para el cálculo de respaldo.
 *     tags: [Asientos]
 */
router.post("/calcular-precio", asyncHandler(async (req, res) => {
  const { cantidad, rutaId, fecha } = req.body;

  try {
    if (cantidad && Number(cantidad) > 0) {
      const response = await axios.post(
        seatApiUrl('calcularPrecio'),
        { cantidad: Number(cantidad) },
        { timeout: TIMEOUT }
      );
      // Se devuelve íntegro: `moneda`, `porcentajeDescuento`, `cobro`…
      // Antes se descartaba todo salvo el descuento y se recalculaba en USD
      // mezclando escalas de moneda distintas.
      return res.json({ ok: true, ...response.data, _source: 'external-api' });
    }
  } catch (error) {
    logFallback('calcular-precio', error);
  }

  // ---- Respaldo local (API caída, o petición sin `cantidad`) ----
  let precioUnitario = DEFAULT_PRECIO_UNITARIO_USD;
  if (rutaId) {
    try {
      const ruta = await Ruta.findById(rutaId).lean();
      if (ruta && ruta.price) precioUnitario = ruta.price;
    } catch (err) {
      // Se mantiene el precio por defecto.
    }
  }

  if (cantidad && Number(cantidad) > 0) {
    const desglose = calcularPrecioLocal(Number(cantidad), precioUnitario);
    return res.json({ ok: true, moneda: 'USD', ...desglose, _isFallback: true });
  }

  if (!rutaId || !fecha) {
    return res.status(400).json({
      ok: false,
      error: "cantidad o (rutaId y fecha) son requeridos"
    });
  }

  return res.json({
    ok: true,
    moneda: 'USD',
    precioBase: precioUnitario,
    descuento: 0,
    recargo: 0,
    totalPagar: precioUnitario,
    _isFallback: true
  });
}));

/**
 * @swagger
 * /api/asientos/estado-api:
 *   get:
 *     summary: Diagnóstico de la conexión con la API externa de asientos
 *     description: >
 *       Dice si la API externa responde y a qué URL se está apuntando. Existe
 *       porque el fallo de los caminos equivocados era invisible: todo
 *       "funcionaba" con el fallback local y no había forma de saber si la API
 *       se estaba consumiendo de verdad.
 *     tags: [Asientos]
 */
router.get("/estado-api", asyncHandler(async (req, res) => {
  const url = seatApiUrl('viewModel');
  const inicio = Date.now();

  try {
    const response = await axios.get(url, {
      params: { rutaId: '__diagnostico__', fecha: '2026-01-01' },
      timeout: TIMEOUT
    });

    return res.json({
      ok: true,
      conectada: true,
      url,
      latenciaMs: Date.now() - inicio,
      totalAsientos: response.data?.totalAsientos ?? null,
      ttlMs: response.data?.ttlMs ?? null,
      precios: response.data?.precios ?? null
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      conectada: false,
      url,
      latenciaMs: Date.now() - inicio,
      motivo: error?.response?.status ? `HTTP ${error.response.status}` : (error.code || error.message),
      pista: 'Si es un 404, revisa SEAT_API_PATHS en src/config/externalApis.js. Si es ECONNREFUSED, la API no está arrancada o EXTERNAL_API_URL apunta a otro sitio.'
    });
  }
}));

module.exports = router;
