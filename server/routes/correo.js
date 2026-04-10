const express = require('express');
const router = express.Router();

const { getCorreoConfig } = require('../services/providers/correo/correo.config');
const { getToken } = require('../services/providers/correo/correo.auth');
const correoProvider = require('../services/providers/correo/correo.provider');
const shippingService = require('../services/shipping.service');
const { sendDispatchEmail } = require('../services/email');
const { CorreoError } = require('../services/providers/correo/correo.errors');

function handleError(res, error) {
    console.error('Correo route error:', error);

    if (error instanceof CorreoError) {
        return res.status(error.statusCode || 500).json({
            error: error.message,
            code: error.code,
            details: error.details || null,
        });
    }

    return res.status(500).json({
        error: error.message || 'Error interno',
        code: 'INTERNAL_ERROR',
    });
}

router.get('/health', async (req, res) => {
    try {
        const config = getCorreoConfig();
        return res.json({ ok: true, provider: config.mode, env: config.env, baseUrl: config.baseUrl });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/test-auth', async (req, res) => {
    try {
        const token = await getToken();
        return res.json({ ok: true, tokenReceived: !!token, tokenPreview: token ? `${token.slice(0, 12)}...` : null });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/customer', async (req, res) => {
    try {
        const customerId = await correoProvider.resolveCustomerId();
        return res.json({ ok: true, customerId });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/agencies', async (req, res) => {
    try {
        const { province } = req.query;
        if (!province) {
            return res.status(400).json({ error: 'province es obligatorio', code: 'MISSING_PROVINCE' });
        }
        const agencies = await correoProvider.listAgencies({ province });
        return res.json({ ok: true, agencies });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/quote', async (req, res) => {
    try {
        const { items, address } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items es obligatorio y debe ser un array no vacío', code: 'MISSING_ITEMS' });
        }
        if (!address || typeof address !== 'object') {
            return res.status(400).json({ error: 'address es obligatorio', code: 'MISSING_ADDRESS' });
        }
        const result = await shippingService.quoteShipping({ items, address });
        return res.json({ ok: true, ...result });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/quote-from-order', async (req, res) => {
    try {
        const { orderId } = req.body || {};
        if (!orderId) {
            return res.status(400).json({ error: 'orderId es obligatorio', code: 'MISSING_ORDER_ID' });
        }
        const result = await shippingService.quoteShippingFromOrder(orderId);
        return res.json({ ok: true, ...result });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/create-shipment', async (req, res) => {
    try {
        const { order, items, address, agencyCode, deliveryType } = req.body || {};
        if (!order || !order.id) return res.status(400).json({ error: 'order con id es obligatorio', code: 'MISSING_ORDER' });
        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items es obligatorio y debe ser un array no vacío', code: 'MISSING_ITEMS' });
        if (!address || typeof address !== 'object') return res.status(400).json({ error: 'address es obligatorio', code: 'MISSING_ADDRESS' });
        if (!deliveryType || !['D', 'S'].includes(deliveryType)) return res.status(400).json({ error: 'deliveryType debe ser D o S', code: 'INVALID_DELIVERY_TYPE' });

        const result = await correoProvider.createShipment({ order, items, address, agencyCode, deliveryType });
        return res.json({ ok: true, ...result });
    } catch (error) {
        return handleError(res, error);
    }
});

/**
 * POST /api/correo/create-shipment-from-order
 * Despacha una orden pagada con Correo Argentino y notifica al cliente por email.
 */
router.post('/create-shipment-from-order', async (req, res) => {
    try {
        const { orderId, deliveryType, agencyCode, agencyName, serviceType } = req.body || {};

        if (!orderId) return res.status(400).json({ error: 'orderId es obligatorio', code: 'MISSING_ORDER_ID' });
        if (!deliveryType || !['D', 'S'].includes(deliveryType)) return res.status(400).json({ error: 'deliveryType debe ser D o S', code: 'INVALID_DELIVERY_TYPE' });

        const result = await shippingService.createCorreoShipmentFromOrderId({
            orderId, deliveryType, agencyCode, agencyName, serviceType,
        });

        // ── Enviar email de despacho al cliente (best-effort) ──
        const updatedOrder = result.order || {};
        const to = updatedOrder.customer_email || updatedOrder.shipping_recipient_email || null;
        const trackingNumber = updatedOrder.shipping_tracking_number
            || result.shipment?.raw?.trackingNumber
            || null;

        if (to) {
            sendDispatchEmail({
                to,
                order: updatedOrder,
                trackingNumber,
                deliveryType,
                agencyName: agencyName || updatedOrder.shipping_agency_name || null,
            }).catch((err) => {
                console.error('[correo] sendDispatchEmail error:', err?.message || err);
            });
        }

        return res.json({ ok: true, ...result });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/tracking/:shippingId', async (req, res) => {
    try {
        const { shippingId } = req.params;
        const result = await correoProvider.tracking({ shippingId });
        return res.json({ ok: true, tracking: result });
    } catch (error) {
        return handleError(res, error);
    }
});

/**
 * POST /api/correo/save-tracking
 * Admin carga tracking number manualmente y se envía email al cliente.
 */
router.post('/save-tracking', async (req, res) => {
    const { supabase } = require('../lib/supabase');
    const { sendTrackingEmail } = require('../services/email');

    try {
        const { orderId, trackingNumber } = req.body || {};

        if (!orderId) return res.status(400).json({ error: 'orderId es obligatorio', code: 'MISSING_ORDER_ID' });
        if (!trackingNumber || !trackingNumber.trim()) {
            return res.status(400).json({ error: 'trackingNumber es obligatorio', code: 'MISSING_TRACKING' });
        }

        const tracking = trackingNumber.trim();

        // Actualizar tracking en la orden
        const { data: order, error: updateErr } = await supabase
            .from('orders')
            .update({ shipping_tracking_number: tracking })
            .eq('id', orderId)
            .select('id, customer_name, customer_email, shipping_address_line1, shipping_city, shipping_state, shipping_mode, shipping_agency_name, total, currency')
            .single();

        if (updateErr || !order) {
            console.error('[correo] save-tracking update error:', updateErr);
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        // Enviar email de seguimiento
        const to = (order.customer_email || '').trim();
        if (to) {
            const deliveryType = order.shipping_mode === 'branch' ? 'S' : 'D';
            sendTrackingEmail({
                to,
                order,
                trackingNumber: tracking,
                deliveryType,
                agencyName: order.shipping_agency_name || null,
            }).catch((err) => {
                console.error('[correo] sendTrackingEmail error:', err?.message || err);
            });
        }

        return res.json({ ok: true, tracking, emailSent: !!to });
    } catch (error) {
        return handleError(res, error);
    }
});

module.exports = router;