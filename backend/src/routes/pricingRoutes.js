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
            if (ruta && ruta.price) {
                precioUnitario = ruta.price;
            }
        } catch (err) {
            console.log('[PricingProxy] Error obteniendo ruta, usando precio por defecto');
        }
    }

    try {
        const response = await axios.post(`${EXTERNAL_API_URL}/calcular-precio`, {
            cantidad: Number(cantidad)
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        const porcentajeDescuento = response.data.porcentajeDescuento || 0;
        const subtotal = cantidad * precioUnitario;
        const montoDescuento = Math.round(subtotal * (porcentajeDescuento / 100) * 100) / 100;
        const total = subtotal - montoDescuento;

        return res.json({
            ok: true,
            cantidad,
            precioUnitario,
            subtotal,
            porcentajeDescuento,
            montoDescuento,
            total,
            ahorros: montoDescuento,
            _source: 'local_price_external_discount'
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
