const axios = require('axios');

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const RESEND_FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || '').trim();
const RESEND_TEST_TO_EMAIL = (process.env.RESEND_TEST_TO_EMAIL || '').trim();

async function postResendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn('[email] Resend envs not set – email not sent');
    return null;
  }
  const safeTo = (to || '').trim();
  if (!safeTo) return null;

  const finalTo = RESEND_TEST_TO_EMAIL || safeTo;
  const subjectFinal = RESEND_TEST_TO_EMAIL ? `[TEST to=${safeTo}] ${subject}` : subject;

  const res = await axios.post(
    'https://api.resend.com/emails',
    {
      from: RESEND_FROM_EMAIL,
      to: Array.isArray(finalTo) ? finalTo : [finalTo],
      subject: subjectFinal,
      html,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
    },
  );

  if (RESEND_TEST_TO_EMAIL) {
    console.log('[email] Test enviado a:', RESEND_TEST_TO_EMAIL);
  } else {
    console.log('[email] Enviado a:', safeTo);
  }
  return res.data;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatMoneyArs(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailWrapper(bodyContent) {
  return `
  <!DOCTYPE html>
  <html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
  <body style="background:#f9fafb;margin:0;padding:40px 0;font-family:system-ui,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table width="100%" style="max-width:600px;background:#fff;border:1px solid #eaeaea;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;background:#111827;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:600;letter-spacing:2px;">SOLUTION</h1>
        </td></tr>
        ${bodyContent}
        <tr><td style="padding:24px 40px;background:#f9fafb;text-align:center;border-top:1px solid #eaeaea;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Dudas: respondé este correo.<br/>
            © ${new Date().getFullYear()} SOLUTION. Todos los derechos reservados.
          </p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

// ── Email functions ───────────────────────────────────────────────────────

/**
 * Legacy retail checkout: pedido recibido (sin pago online).
 */
async function sendOrderEmail(to, order, items, customerName) {
  try {
    const safeTo = (to || '').trim();
    if (!safeTo) return;

    const formattedTotal = formatMoneyArs(Number(order.total) || 0, order.currency);

    const linesHtml = items.map((i) => {
      const itemTotal = i.quantity * i.unit_price;
      return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #eaeaea;">
          <p style="margin:0;font-size:15px;color:#111827;font-weight:500;">${i.product_name || 'Producto ' + i.product_id}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Cant: ${i.quantity}</p>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid #eaeaea;text-align:right;font-size:15px;color:#111827;font-weight:500;">
          ${formatMoneyArs(itemTotal, order.currency)}
        </td>
      </tr>`;
    }).join('');

    const body = `
    <tr><td style="padding:40px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:600;">¡Hola ${escapeHtml(customerName || '')}!</h2>
      <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563;">
        Gracias por tu compra. Recibimos tu pedido y ya estamos preparándolo.
      </p>
      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:32px;border:1px solid #eaeaea;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Orden de compra</p>
        <p style="margin:0;font-size:16px;color:#111827;font-weight:600;word-break:break-all;">#${escapeHtml(String(order.id))}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead><tr>
          <th style="padding-bottom:12px;border-bottom:2px solid #eaeaea;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Producto</th>
          <th style="padding-bottom:12px;border-bottom:2px solid #eaeaea;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Subtotal</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
        <tfoot><tr>
          <td style="padding-top:24px;text-align:right;font-weight:600;font-size:16px;color:#111827;">Total:</td>
          <td style="padding-top:24px;text-align:right;font-size:18px;font-weight:700;color:#111827;">${formattedTotal}</td>
        </tr></tfoot>
      </table>
    </td></tr>`;

    await postResendEmail({ to: safeTo, subject: '¡Recibimos tu pedido!', html: emailWrapper(body) });
  } catch (e) {
    console.error('[email] sendOrderEmail:', e?.response?.data || e.message || e);
  }
}

/**
 * Nave: pago aprobado — confirma compra con resumen y datos de tarjeta.
 * @returns {Promise<boolean>}
 */
async function sendPaymentConfirmationEmail({ to, order, items, payment }) {
  const safeTo = (to || '').trim();
  if (!safeTo) {
    console.warn('[email] sendPaymentConfirmationEmail: destinatario vacío');
    return false;
  }

  try {
    const pm = payment?.payment_method || {};
    const inst = pm?.installment_plan || {};

    const cardLine = [pm.card_brand, pm.card_type, pm.card_last4 ? `···${pm.card_last4}` : null].filter(Boolean).map(escapeHtml).join(' · ');
    const issuerLine = pm.issuer ? `Emisor: ${escapeHtml(pm.issuer)}` : '';
    const cuotasLine = inst.installments != null
      ? `${escapeHtml(String(inst.installments))} cuota${Number(inst.installments) !== 1 ? 's' : ''}${inst.name ? ` (${escapeHtml(inst.name)})` : ''}`
      : '';

    const paymentCode = payment?.payment_code
      ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Código de operación: <strong>${escapeHtml(payment.payment_code)}</strong></p>`
      : '';

    const linesHtml = (items || []).map((i) => {
      const itemTotal = i.quantity * i.unit_price;
      return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #eaeaea;">
          <p style="margin:0;font-size:15px;color:#111827;font-weight:500;">${escapeHtml(i.product_name || 'Producto')}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Cant: ${Number(i.quantity)}</p>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid #eaeaea;text-align:right;font-size:15px;color:#111827;font-weight:500;">
          ${formatMoneyArs(itemTotal, order.currency)}
        </td>
      </tr>`;
    }).join('');

    const body = `
    <tr><td style="padding:40px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Pago confirmado ✅</h2>
      <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563;">
        Hola <strong>${escapeHtml((order.customer_name || '').trim() || 'cliente')}</strong>, tu pago se acreditó correctamente. Estamos preparando tu pedido.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#166534;">Orden <strong>#${escapeHtml(String(order.id))}</strong></p>
        ${paymentCode}
        ${cardLine ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;"><strong>Pago:</strong> ${cardLine}</p>` : ''}
        ${issuerLine ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${issuerLine}</p>` : ''}
        ${cuotasLine ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${cuotasLine}</p>` : ''}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead><tr>
          <th style="text-align:left;padding-bottom:12px;border-bottom:2px solid #eaeaea;font-size:12px;color:#6b7280;text-transform:uppercase;">Producto</th>
          <th style="text-align:right;padding-bottom:12px;border-bottom:2px solid #eaeaea;font-size:12px;color:#6b7280;text-transform:uppercase;">Subtotal</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
        <tfoot><tr>
          <td style="padding-top:24px;text-align:right;font-weight:600;color:#111827;">Total</td>
          <td style="padding-top:24px;text-align:right;font-size:18px;font-weight:700;color:#111827;">${formatMoneyArs(order.total, order.currency)}</td>
        </tr></tfoot>
      </table>
      <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">Te avisaremos cuando despachemos tu pedido con el número de seguimiento.</p>
    </td></tr>`;

    const out = await postResendEmail({
      to: safeTo,
      subject: 'Pago confirmado — tu pedido en SOLUTION',
      html: emailWrapper(body),
    });

    if (!out) {
      console.warn('[email] sendPaymentConfirmationEmail: Resend no devolvió respuesta');
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] sendPaymentConfirmationEmail:', e?.response?.data || e.message || e);
    return false;
  }
}

/**
 * Admin despachó el pedido con Correo Argentino.
 * Se envía cuando shipping_status pasa a 'imported' y hay trackingNumber.
 *
 * @param {{ to: string, order: object, trackingNumber: string, deliveryType: 'D'|'S', agencyName?: string }} params
 * @returns {Promise<boolean>}
 */
async function sendDispatchEmail({ to, order, trackingNumber, deliveryType, agencyName }) {
  const safeTo = (to || '').trim();
  if (!safeTo) {
    console.warn('[email] sendDispatchEmail: destinatario vacío');
    return false;
  }

  try {
    const trackingUrl = trackingNumber
      ? `https://www.correoargentino.com.ar/MiCorreo/public/home#seguimiento?n=${encodeURIComponent(trackingNumber)}`
      : null;

    const isHomeDelivery = deliveryType !== 'S';
    const deliveryLabel = isHomeDelivery ? 'Entrega a domicilio' : 'Retiro en sucursal';
    const deliveryDetail = isHomeDelivery
      ? [order.shipping_address_line1, order.shipping_city, order.shipping_state].filter(Boolean).join(', ')
      : agencyName || 'Sucursal de Correo Argentino';

    const trackingBlock = trackingUrl
      ? `
        <div style="text-align:center;margin:32px 0;">
          <a href="${trackingUrl}"
             style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
            Rastrear mi pedido
          </a>
          <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
            También podés buscar el número <strong>${escapeHtml(trackingNumber)}</strong> directamente en 
            <a href="https://www.correoargentino.com.ar" style="color:#111827;">correoargentino.com.ar</a>
          </p>
        </div>`
      : `<p style="margin:24px 0;font-size:14px;color:#6b7280;">El número de seguimiento estará disponible en breve.</p>`;

    const body = `
    <tr><td style="padding:40px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">¡Tu pedido está en camino! 🚚</h2>
      <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563;">
        Hola <strong>${escapeHtml((order.customer_name || '').trim() || 'cliente')}</strong>, despachamos tu pedido con Correo Argentino.
      </p>

      <div style="background:#f9fafb;border:1px solid #eaeaea;border-radius:6px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Orden</p>
        <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">#${escapeHtml(String(order.id))}</p>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Modalidad</p>
        <p style="margin:0 0 16px;font-size:15px;color:#111827;">${deliveryLabel}</p>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${isHomeDelivery ? 'Dirección de entrega' : 'Sucursal de retiro'}</p>
        <p style="margin:0;font-size:15px;color:#111827;">${escapeHtml(deliveryDetail)}</p>
      </div>

      ${trackingBlock}

      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        Si tenés alguna consulta sobre tu envío, podés responder este email o contactarnos directamente.
      </p>
    </td></tr>`;

    const out = await postResendEmail({
      to: safeTo,
      subject: '¡Tu pedido fue despachado! 🚚 — SOLUTION',
      html: emailWrapper(body),
    });

    if (!out) {
      console.warn('[email] sendDispatchEmail: Resend no devolvió respuesta');
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] sendDispatchEmail:', e?.response?.data || e.message || e);
    return false;
  }
}

/**
 * Admin inició reembolso vía Nave — aviso al cliente (best-effort).
 */
async function sendRefundInitiatedEmail({ to, orderId }) {
  try {
    const safeTo = (to || '').trim();
    if (!safeTo) return;
    const body = `
    <tr><td style="padding:40px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Reembolso en proceso</h2>
      <p style="color:#4b5563;line-height:1.6;font-size:15px;">
        Solicitamos el reembolso de tu pago para el pedido <strong>#${escapeHtml(String(orderId))}</strong>.<br/>
        Cuando Nave lo procese, verás el crédito según los plazos de tu banco o tarjeta.
      </p>
    </td></tr>`;
    await postResendEmail({ to: safeTo, subject: 'Reembolso en proceso — SOLUTION', html: emailWrapper(body) });
  } catch (e) {
    console.error('[email] sendRefundInitiatedEmail:', e?.response?.data || e.message || e);
  }
}

/**
 * Email de seguimiento: se envía cuando el admin carga el tracking number
 * después del despacho con Correo Argentino.
 */
async function sendTrackingEmail({ to, order, trackingNumber, deliveryType, agencyName }) {
  const safeTo = (to || '').trim();
  if (!safeTo) {
    console.warn('[email] sendTrackingEmail: destinatario vacío');
    return false;
  }

  try {
    const trackingUrl = `https://www.correoargentino.com.ar/MiCorreo/public/home#seguimiento?n=${encodeURIComponent(trackingNumber)}`;
    const isHomeDelivery = deliveryType !== 'S';
    const deliveryLabel = isHomeDelivery ? 'Entrega a domicilio' : 'Retiro en sucursal';
    const deliveryDetail = isHomeDelivery
      ? [order.shipping_address_line1, order.shipping_city, order.shipping_state].filter(Boolean).join(', ')
      : agencyName || 'Sucursal de Correo Argentino';

    const body = `
    <tr><td style="padding:40px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Tu número de seguimiento está listo 📬</h2>
      <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563;">
        Hola <strong>${escapeHtml((order.customer_name || '').trim() || 'cliente')}</strong>, ya podés rastrear tu pedido de SOLUTION con Correo Argentino.
      </p>

      <div style="background:#f9fafb;border:1px solid #eaeaea;border-radius:6px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Orden</p>
        <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">#${escapeHtml(String(order.id))}</p>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Número de seguimiento</p>
        <p style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;font-family:monospace;">${escapeHtml(trackingNumber)}</p>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Modalidad</p>
        <p style="margin:0 0 16px;font-size:15px;color:#111827;">${deliveryLabel}</p>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${isHomeDelivery ? 'Dirección de entrega' : 'Sucursal de retiro'}</p>
        <p style="margin:0;font-size:15px;color:#111827;">${escapeHtml(deliveryDetail)}</p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${trackingUrl}"
           style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
          Rastrear mi pedido
        </a>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
          También podés buscar el número <strong>${escapeHtml(trackingNumber)}</strong> directamente en
          <a href="https://www.correoargentino.com.ar" style="color:#111827;">correoargentino.com.ar</a>
        </p>
      </div>

      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        Si tenés alguna consulta sobre tu envío, podés responder este email o contactarnos directamente.
      </p>
    </td></tr>`;

    const out = await postResendEmail({
      to: safeTo,
      subject: 'Seguimiento de tu pedido — SOLUTION',
      html: emailWrapper(body),
    });

    if (!out) {
      console.warn('[email] sendTrackingEmail: Resend no devolvió respuesta');
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] sendTrackingEmail:', e?.response?.data || e.message || e);
    return false;
  }
}

module.exports = {
  sendOrderEmail,
  sendPaymentConfirmationEmail,
  sendDispatchEmail,
  sendTrackingEmail,
  sendRefundInitiatedEmail,
};