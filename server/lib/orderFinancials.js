const { supabase } = require('./supabase');

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Extrae el desglose financiero de un payment de Mercado Pago (respuesta de
 * GET /v1/payments/{id}). Devuelve montos en ARS, redondeados a 2 decimales.
 *
 *  gross  = transaction_amount
 *  fee    = suma de fee_details[].amount donde fee_payer = 'collector'
 *  taxes  = suma de taxes[].value (retenciones aplicadas por MP: IVA, IIBB, etc.)
 *  net    = gross − fee − taxes (cross-validado contra payment.net_amount si está)
 */
function extractFinancialsFromMpPayment(payment) {
  if (!payment || typeof payment !== 'object') return null;
  const gross = toNumber(payment.transaction_amount);

  let fee = 0;
  if (Array.isArray(payment.fee_details)) {
    for (const fd of payment.fee_details) {
      if (!fd) continue;
      const payer = String(fd.fee_payer || '').toLowerCase();
      if (payer === '' || payer === 'collector') {
        fee += toNumber(fd.amount);
      }
    }
  }

  let taxes = 0;
  if (Array.isArray(payment.taxes)) {
    for (const t of payment.taxes) {
      if (!t) continue;
      taxes += toNumber(t.value);
    }
  }

  const computedNet = gross - fee - taxes;
  const reportedNet = payment.net_amount != null ? toNumber(payment.net_amount) : null;
  const net = reportedNet != null ? reportedNet : computedNet;

  if (reportedNet != null && Math.abs(reportedNet - computedNet) > 0.5) {
    console.warn(
      `[orderFinancials] MP net_amount difiere del cálculo (reported=${reportedNet}, computed=${computedNet}) payment=${payment.id}`
    );
  }

  return {
    gross_amount: Number(gross.toFixed(2)),
    payment_fee: Number(fee.toFixed(2)),
    payment_taxes: Number(taxes.toFixed(2)),
    net_received: Number(net.toFixed(2)),
  };
}

/**
 * Extrae el desglose financiero de un payment de Nave. Estructura tentativa
 * basada en naveContext.MD: la API devuelve `transactionAmount` y `feeAmount`.
 * Si la respuesta no trae fees, se devuelve null en esos campos y se calcula
 * net = gross para no bloquear el upsert.
 */
function extractFinancialsFromNavePayment(payment) {
  if (!payment || typeof payment !== 'object') return null;
  const gross = toNumber(
    payment.transactionAmount ?? payment.transaction_amount ?? payment.amount?.value ?? payment.amount
  );

  // Nave puede devolver fee como objeto o como número plano.
  const feeRaw =
    payment.fee?.amount ??
    payment.feeAmount ??
    payment.fee_amount ??
    payment.commission?.amount ??
    null;
  const fee = feeRaw != null ? toNumber(feeRaw) : 0;

  // Retenciones (si Nave las separa).
  let taxes = 0;
  if (Array.isArray(payment.taxes)) {
    for (const t of payment.taxes) {
      if (!t) continue;
      taxes += toNumber(t.value ?? t.amount);
    }
  }

  const net = gross - fee - taxes;
  return {
    gross_amount: Number(gross.toFixed(2)),
    payment_fee: Number(fee.toFixed(2)),
    payment_taxes: Number(taxes.toFixed(2)),
    net_received: Number(net.toFixed(2)),
  };
}

/**
 * Upsert idempotente en order_financials. Falla silenciosa (no propaga): si
 * algo sale mal acá NO debe romper el flujo principal del webhook de cobro.
 */
async function upsertOrderFinancials(orderId, provider, financials, rawPayload) {
  if (!orderId || !provider) return false;
  if (!financials) return false;
  try {
    const { error } = await supabase
      .from('order_financials')
      .upsert(
        {
          order_id: orderId,
          provider,
          gross_amount: financials.gross_amount,
          payment_fee: financials.payment_fee,
          payment_taxes: financials.payment_taxes,
          net_received: financials.net_received,
          raw_payload: rawPayload || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id' }
      );
    if (error) {
      console.error('[orderFinancials] Error upsert:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[orderFinancials] Excepción upsert:', err);
    return false;
  }
}

module.exports = {
  extractFinancialsFromMpPayment,
  extractFinancialsFromNavePayment,
  upsertOrderFinancials,
};
