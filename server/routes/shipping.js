const express = require('express');
const router = express.Router();
const shippingService = require('../services/shipping.service');

function handleError(res, error) {
    console.error('[shipping/quote]', error?.message || error);
    return res.status(500).json({
        error: error?.message || 'Error al cotizar envío',
        code: error?.code || 'QUOTE_ERROR',
    });
}

/**
 * POST /api/shipping/quote
 * Body: {
 *   items: [{ product_id, quantity, unit_price }],
 *   address: { postalCode (o zip), province (o state), city? }
 * }
 */
router.post('/quote', async (req, res) => {
    try {
        const { items, address } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items requerido', code: 'MISSING_ITEMS' });
        }
        if (!address || typeof address !== 'object') {
            return res.status(400).json({ error: 'address requerido', code: 'MISSING_ADDRESS' });
        }

        // Normalizar: el form del checkout usa 'zip'/'state'; el shipping service usa 'postalCode'/'province'
        const normalizedAddress = {
            postalCode: String(address.postalCode || address.zip || '').trim(),
            province: String(address.province || address.state || '').trim(),
            city: String(address.city || '').trim(),
            street: String(address.street || address.address || '').trim(),
            number: String(address.number || '').trim(),
        };

        if (!normalizedAddress.postalCode) {
            return res.status(400).json({ error: 'postalCode requerido para cotizar', code: 'MISSING_POSTAL_CODE' });
        }
        if (!normalizedAddress.province) {
            return res.status(400).json({ error: 'province requerido para cotizar', code: 'MISSING_PROVINCE' });
        }

        const result = await shippingService.quoteShipping({ items, address: normalizedAddress });
        return res.json({ ok: true, ...result });
    } catch (error) {
        return handleError(res, error);
    }
});

module.exports = router;