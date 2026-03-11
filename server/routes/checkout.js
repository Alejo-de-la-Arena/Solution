const express = require('express');
const axios = require('axios');
const router = express.Router();
const { supabase } = require('../lib/supabase');

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const RESEND_FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || '').trim();
const RESEND_TEST_TO_EMAIL = (process.env.RESEND_TEST_TO_EMAIL || '').trim();

async function sendOrderEmail(to, order, items, customerName) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn('Resend envs not set – email not sent');
    return;
  }

  const safeTo = (to || '').trim();
  if (!safeTo) return;

  const finalTo = RESEND_TEST_TO_EMAIL || safeTo;
  const subjectBase = '¡Recibimos tu pedido!';
  const subject = RESEND_TEST_TO_EMAIL
    ? `[TEST to=${safeTo}] ${subjectBase}`
    : subjectBase;

  const formattedTotal = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: order.currency || 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(order.total) || 0);

  // 1. Armamos las filas de la tabla de productos con un diseño más limpio
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

  // 2. Inyectamos todo en la estructura HTML segura para emails
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
                          <tbody>
                            ${linesHtml}
                          </tbody>
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

  try {
    const res = await axios.post(
      'https://api.resend.com/emails',
      {
        from: RESEND_FROM_EMAIL,
        to: finalTo,
        subject,
        html,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
      }
    );

    if (RESEND_TEST_TO_EMAIL) {
      console.log('Email test enviado exitosamente a:', RESEND_TEST_TO_EMAIL);
    } else {
      console.log('Email enviado a cliente:', safeTo);
    }

    return res.data;
  } catch (e) {
    console.error('Error al enviar email con Resend:', e?.response?.data || e.message || e);
  }
}
/**
 * POST /api/checkout
 * Crea una orden retail (channel: 'retail') y sus order_items.
 * Body: customer_name, customer_email, customer_phone?, shipping_*, items: [{ product_id, quantity, unit_price }]
 */
router.post('/', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Checkout no configurado' });
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    shipping_notes,
    shipping_method,
    shipping_cost,
    items,
  } = req.body || {};

  const name = (customer_name || '').trim();
  const email = (customer_email || '').trim();
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  }

  const cleanItems = (Array.isArray(items) ? items : [])
    .filter((i) => i && i.product_id && Number(i.quantity) > 0)
    .map((i) => ({
      product_id: i.product_id,
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
      unit_price: Number(i.unit_price) || 0,
    }));

  if (cleanItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const total = cleanItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const shipping = shipping_cost != null ? Number(shipping_cost) : 0;
  const orderTotal = total + shipping;

  const orderPayload = {
    user_id: null,
    status: 'pending',
    currency: 'ARS',
    total: orderTotal,
    channel: 'retail',
    customer_name: name || null,
    customer_email: email || null,
    customer_phone: (customer_phone || '').trim() || null,
    shipping_address_line1: (shipping_address_line1 || '').trim() || null,
    shipping_address_line2: (shipping_address_line2 || '').trim() || null,
    shipping_city: (shipping_city || '').trim() || null,
    shipping_state: (shipping_state || '').trim() || null,
    shipping_postal_code: (shipping_postal_code || '').trim() || null,
    shipping_country: (shipping_country || '').trim() || 'AR',
    shipping_notes: (shipping_notes || '').trim() || null,
    shipping_method: (shipping_method || '').trim() || 'standard',
    shipping_cost: shipping,
  };

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id, status, total, currency, created_at, customer_name, customer_email')
    .single();

  if (orderErr) {
    console.error('Checkout order error:', orderErr);
    return res.status(500).json({ error: 'Error al crear la orden' });
  }

  const rows = cleanItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(rows);
  if (itemsErr) {
    console.error('Checkout order_items error:', itemsErr);
    return res.status(500).json({ error: 'Error al guardar los ítems de la orden' });
  }

  // Enriquecer ítems con metadata de producto para el email (nombre).
  let itemsWithMeta = cleanItems;
  try {
    const productIds = [...new Set(cleanItems.map((i) => i.product_id))];
    if (productIds.length > 0) {
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (!prodErr && products) {
        const nameById = Object.fromEntries(
          products.map((p) => [p.id, p.name])
        );
        itemsWithMeta = cleanItems.map((i) => ({
          ...i,
          product_name: nameById[i.product_id] || null,
        }));
      }
    }
  } catch (e) {
    console.warn('No se pudo enriquecer metadata de productos para el email:', e?.message || e);
  }

  // Enviar email de confirmación al cliente (best-effort; no rompe la respuesta si falla).
  if (email) {
    sendOrderEmail(email, order, itemsWithMeta, name).catch((err) => {
      console.error('Order email send error:', err?.message || err);
    });
  }

  return res.status(201).json({ order });
});

module.exports = router;
