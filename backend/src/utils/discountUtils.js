/**
 * Lógica única de descuentos por cantidad (en USD).
 * Antes estaba duplicada en pricingRoutes y asientosRoutes, con una rama
 * redundante (>=5 y >=4 daban ambos 10%). Aquí queda centralizada y sin duplicar.
 */
function getDescuentoPorCantidad(cantidad) {
  const c = Number(cantidad) || 0;
  if (c >= 4) return 10;
  if (c >= 3) return 7;
  if (c >= 2) return 5;
  return 0;
}

/**
 * Calcula el desglose de precio local (fallback cuando la API externa no responde).
 * @param {number} cantidad
 * @param {number} precioUnitario - precio unitario en USD
 */
function calcularPrecioLocal(cantidad, precioUnitario) {
  const qty = Number(cantidad) || 0;
  const unit = Number(precioUnitario) || 0;
  const subtotal = qty * unit;
  const porcentajeDescuento = getDescuentoPorCantidad(qty);
  const montoDescuento = Math.round(subtotal * (porcentajeDescuento / 100) * 100) / 100;
  const total = subtotal - montoDescuento;

  return {
    cantidad: qty,
    precioUnitario: unit,
    subtotal,
    porcentajeDescuento,
    montoDescuento,
    total,
    ahorros: montoDescuento
  };
}

module.exports = { getDescuentoPorCantidad, calcularPrecioLocal };
