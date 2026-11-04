const redondear = (valor) => Math.round(valor * 100) / 100;

/**
 * Resume los movimientos de la cuenta de PayPal.
 *
 * Importes positivos: cobros. Importes negativos: dinero que sale de la cuenta
 * (retiros y transferencias). Las comisiones vienen aparte, en cada cobro.
 */
function resumirMovimientos(movimientos = []) {
  const totales = movimientos.reduce((acc, movimiento) => {
    const importe = Number(movimiento.importe) || 0;
    if (importe > 0) acc.ingresos += importe;
    else acc.retiros += Math.abs(importe);
    acc.comisiones += Math.abs(Number(movimiento.comision) || 0);
    return acc;
  }, { ingresos: 0, comisiones: 0, retiros: 0 });

  return {
    ingresos: redondear(totales.ingresos),
    comisiones: redondear(totales.comisiones),
    retiros: redondear(totales.retiros),
    egresos: redondear(totales.comisiones + totales.retiros)
  };
}

module.exports = { resumirMovimientos };
