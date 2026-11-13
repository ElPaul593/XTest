const express = require("express");
const router = express.Router();
const axios = require('axios');
const Ruta = require('../models/rutaModel');
const asyncHandler = require('../utils/asyncHandler');
const { EXTERNAL_API_URL, DEFAULT_REQUEST_TIMEOUT_MS, DEFAULT_PRECIO_UNITARIO_USD } = require('../config/externalApis');
const { calcularPrecioLocal } = require('../utils/discountUtils');

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Cálculo de precios usando lógica de descuentos de API externa pero precios locales (USD)
 */

/**
 * POST /api/pricing/calcular-precio
 * Precio base: de la ruta local (USD). Lógica de descuentos: API externa con fallback local.
 */
router.post("/calcular-precio", asyncHandler(async (req, res) => {
    const { cantidad, rutaId } = req.body;

    if (!cantidad || cantidad <= 0) {
        return res.status(400).json({
            ok: false,
            error: "cantidad es requerida y debe ser mayor a 0"
        });
    }

    let precioUnitario = DEFAULT_PRECIO_UNITARIO_USD;

    if (rutaId) {
        try {
            const ruta = await Ruta.findById(rutaId).lean();
            if (!ruta) {
                return res.status(404).json({
                    ok: false,
                    error: "No encontramos la ruta seleccionada"
                });
            }
            if (!Number.isFinite(ruta.price)) {
                return res.status(422).json({
                    ok: false,
                    error: "La ruta seleccionada no tiene un precio válido"
                });
            }
            precioUnitario = ruta.price;
        } catch (err) {
            if (err?.name === 'CastError') {
                return res.status(400).json({
                    ok: false,
                    error: "El identificador de ruta no es válido"
                });
            }
            console.error('[PricingProxy] Error obteniendo ruta:', err);
            return res.status(503).json({
                ok: false,
                error: "No se pudo consultar el precio de la ruta"
            });
        }
    }

    try {
        // Se envía el precio de la ruta local: la API externa cotiza con él y
        // devuelve el mismo desglose (subtotal, descuento, total, cobro PayPal)
        // que usará al crear la orden. Así el "Pagar $X con PayPal" del
        // frontend y el cargo real no pueden divergir.
        const response = await axios.post(`${EXTERNAL_API_URL}/calcular-precio`, {
            cantidad: Number(cantidad),
            precioUnitario
        }, {
            timeout: DEFAULT_REQUEST_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' }
        });

        const externo = response.data || {};
        const porcentajeDescuento = Number(externo.porcentajeDescuento) || 0;

        // Si la API externa respetó el precio enviado, se usa su desglose tal
        // cual. Si es una versión antigua que lo ignoró, se recalcula aquí con
        // el precio local y solo se aprovecha su porcentaje de descuento.
        const respetoPrecio = Number(externo.precioUnitario) === Number(precioUnitario);
        const subtotal = respetoPrecio ? Number(externo.subtotal) : Math.round(cantidad * precioUnitario * 100) / 100;
        const montoDescuento = respetoPrecio
            ? Number(externo.montoDescuento) || 0
            : Math.round(subtotal * (porcentajeDescuento / 100) * 100) / 100;
        const total = respetoPrecio ? Number(externo.total) : Math.round((subtotal - montoDescuento) * 100) / 100;

        return res.json({
            ok: true,
            cantidad: Number(cantidad),
            moneda: externo.moneda || 'USD',
            precioUnitario,
            subtotal,
            porcentajeDescuento,
            montoDescuento,
            total,
            ahorros: montoDescuento,
            requiereCompania: externo.requiereCompania ?? false,
            cobro: respetoPrecio ? externo.cobro : { moneda: 'USD', valor: total.toFixed(2), tasaConversion: 1 },
            _source: respetoPrecio ? 'external_api_route_price' : 'local_price_external_discount'
        });
    } catch (error) {
        console.error('[PricingProxy] API externa no disponible, usando cálculo local:', error.message);

        const desglose = calcularPrecioLocal(cantidad, precioUnitario);
        return res.json({
            ok: true,
            ...desglose,
            _isFallback: true,
            _source: 'local_only'
        });
    }
}));

module.exports = router;
