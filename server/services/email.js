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
      to: finalTo,
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

/**
 * Legacy retail checkout: pedido recibido (sin pago online).
 */
async function sendOrderEmail(to, order, items, customerName) {
  try {
    const safeTo = (to || '').trim();
    if (!safeTo) return;

    const subjectBase = '¡Recibimos tu pedido!';
    const formattedTotal = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: order.currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(order.total) || 0);

    const linesHtml = items
      .map((i) => {
        const itemTotal = i.quantity * i.unit_price;
        const formattedItemTotal = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: order.currency || 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(itemTotal);

        return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea;">
            <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">
              ${i.product_name || 'Producto ' + i.product_id}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
              Cant: ${i.quantity}
            </p>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 15px; color: #111827; font-weight: 500;">
            ${formattedItemTotal}
          </td>
        </tr>
      `;
      })
      .join('');

    const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="es">
      <head>
        <meta content="width=device-width" name="viewport" />
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta content="IE=edge" http-equiv="X-UA-Compatible" />
        <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
      </head>
      <body style="background-color: #f9fafb; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
        <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
          <tbody>
            <tr>
              <td>
                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; overflow: hidden;">
                  <tbody>
                    <tr>
                      <td style="padding: 32px 40px; text-align: center; background-color: #111827;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 2px;">SOLUTION</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827; font-weight: 600;">¡Hola ${customerName || ''}!</h2>
                        <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                          Gracias por tu compra. Recibimos tu pedido y ya estamos preparándolo. Nos pondremos en contacto con vos a la brevedad para coordinar el envío y el pago.
                        </p>
                        <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 32px; border: 1px solid #eaeaea;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Orden de compra</p>
                          <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600; word-break: break-all;">#${order.id}</p>
                        </div>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <thead>
                            <tr>
                              <th style="padding-bottom: 12px; border-bottom: 2px solid #eaeaea; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Producto</th>
                              <th style="padding-bottom: 12px; border-bottom: 2px solid #eaeaea; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>${linesHtml}</tbody>
                          <tfoot>
                            <tr>
                              <td style="padding-top: 24px; text-align: right; font-size: 16px; font-weight: 600; color: #111827;">Total:</td>
                              <td style="padding-top: 24px; text-align: right; font-size: 18px; font-weight: 700; color: #111827;">${formattedTotal}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #eaeaea;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          Si tenés alguna duda, respondé a este correo.<br />
                          © ${new Date().getFullYear()} LÜMA. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

    await postResendEmail({ to: safeTo, subject: subjectBase, html });
  } catch (e) {
    console.error('[email] sendOrderEmail:', e?.response?.data || e.message || e);
  }
}

function formatMoneyArs(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/**
 * Nave: pago aprobado — confirma compra con resumen y datos de tarjeta (enmascarados).
 */
async function sendPaymentConfirmationEmail({ to, order, items, payment }) {
  try {
    const safeTo = (to || '').trim();
    if (!safeTo) return;

    const pm = payment?.payment_method || {};
    const inst = pm?.installment_plan || {};
    const cardLine = [pm.card_brand, pm.card_type, pm.card_last4 ? `···${pm.card_last4}` : null]
      .filter(Boolean)
      .join(' · ');
    const issuerLine = pm.issuer ? `Emisor: ${pm.issuer}` : '';
    const cuotasLine =
      inst.installments != null
        ? `${inst.installments} cuota${Number(inst.installments) !== 1 ? 's' : ''}${inst.name ? ` (${inst.name})` : ''}`
        : '';

    const linesHtml = (items || [])
      .map((i) => {
        const itemTotal = i.quantity * i.unit_price;
        return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea;">
            <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">${i.product_name || 'Producto'}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">Cant: ${i.quantity}</p>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 15px; color: #111827; font-weight: 500;">
            ${formatMoneyArs(itemTotal, order.currency)}
          </td>
        </tr>`;
      })
      .join('');

    const paymentCode = payment?.payment_code ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">Código de operación: <strong>${payment.payment_code}</strong></p>` : '';

    const html = `
    <!DOCTYPE html>
    <html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
    <body style="background:#f9fafb;margin:0;padding:40px 0;font-family:system-ui,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <table width="100%" style="max-width:600px;background:#fff;border:1px solid #eaeaea;border-radius:8px;">
          <tr><td style="padding:32px 40px;text-align:center;background:#111827;">
            <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px;">SOLUTION</h1>
          </td></tr>
          <tr><td style="padding:40px;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Pago confirmado</h2>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563;">
              Hola <strong>${(order.customer_name || '').trim() || 'cliente'}</strong>, tu pago con Nave se acreditó correctamente. Estamos preparando tu pedido.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#166534;">Orden <strong>#${order.id}</strong></p>
              ${paymentCode}
              ${cardLine ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;"><strong>Pago:</strong> ${cardLine}</p>` : ''}
              ${issuerLine ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${issuerLine}</p>` : ''}
              ${cuotasLine ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${cuotasLine}</p>` : ''}
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead><tr>
                <th style="text-align:left;padding-bottom:12px;border-bottom:2px solid #eaeaea;font-size:12px;color:#6b7280;">Producto</th>
                <th style="text-align:right;padding-bottom:12px;border-bottom:2px solid #eaeaea;font-size:12px;color:#6b7280;">Subtotal</th>
              </tr></thead>
              <tbody>${linesHtml}</tbody>
              <tfoot><tr>
                <td style="padding-top:24px;text-align:right;font-weight:600;">Total</td>
                <td style="padding-top:24px;text-align:right;font-size:18px;font-weight:700;">${formatMoneyArs(order.total, order.currency)}</td>
              </tr></tfoot>
            </table>
          </td></tr>
          <tr><td style="padding:24px 40px;background:#f9fafb;text-align:center;border-top:1px solid #eaeaea;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Te avisaremos cuando despachemos. Dudas: respondé este correo.</p>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;

    await postResendEmail({ to: safeTo, subject: 'Pago confirmado — tu pedido en SOLUTION', html });
  } catch (e) {
    console.error('[email] sendPaymentConfirmationEmail:', e?.response?.data || e.message || e);
  }
}

/**
 * Admin inició reembolso vía Nave — aviso al cliente (best-effort).
 */
async function sendRefundInitiatedEmail({ to, orderId }) {
  try {
    const safeTo = (to || '').trim();
    if (!safeTo) return;
    const html = `
    <!DOCTYPE html><html lang="es"><body style="font-family:system-ui,sans-serif;padding:24px;background:#f9fafb;">
      <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;border:1px solid #eaeaea;">
        <h2 style="margin:0 0 12px;">Reembolso en proceso</h2>
        <p style="color:#4b5563;line-height:1.6;">Solicitamos el reembolso de tu pago para el pedido <strong>#${orderId}</strong>. 
        Cuando Nave lo procese, verás el crédito según los plazos de tu banco o tarjeta.</p>
      </div>
    </body></html>`;
    await postResendEmail({ to: safeTo, subject: 'Reembolso en proceso — SOLUTION', html });
  } catch (e) {
    console.error('[email] sendRefundInitiatedEmail:', e?.response?.data || e.message || e);
  }
}

module.exports = {
  sendOrderEmail,
  sendPaymentConfirmationEmail,
  sendRefundInitiatedEmail,
};
