const express = require('express');
const router = express.Router();

const { getCorreoConfig } = require('../services/providers/correo/correo.config');
const { getToken } = require('../services/providers/correo/correo.auth');
const correoProvider = require('../services/providers/correo/correo.provider');
const shippingService = require('../services/shipping.service');
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
        return res.json({
            ok: true,
            provider: config.mode,
            env: config.env,
            baseUrl: config.baseUrl,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/test-auth', async (req, res) => {
    try {
        const token = await getToken();
        return res.json({
            ok: true,
            tokenReceived: !!token,
            tokenPreview: token ? `${token.slice(0, 12)}...` : null,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/customer', async (req, res) => {
    try {
        const customerId = await correoProvider.resolveCustomerId();
        return res.json({
            ok: true,
            customerId,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/agencies', async (req, res) => {
    try {
        const { province } = req.query;

        if (!province) {
            return res.status(400).json({
                error: 'province es obligatorio',
                code: 'MISSING_PROVINCE',
            });
        }

        const agencies = await correoProvider.listAgencies({ province });

        return res.json({
            ok: true,
            agencies,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/quote', async (req, res) => {
    try {
        const { items, address } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'items es obligatorio y debe ser un array no vacío',
                code: 'MISSING_ITEMS',
            });
        }

        if (!address || typeof address !== 'object') {
            return res.status(400).json({
                error: 'address es obligatorio',
                code: 'MISSING_ADDRESS',
            });
        }

        const result = await shippingService.quoteShipping({ items, address });

        return res.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/quote-from-order', async (req, res) => {
    try {
        const { orderId } = req.body || {};

        if (!orderId) {
            return res.status(400).json({
                error: 'orderId es obligatorio',
                code: 'MISSING_ORDER_ID',
            });
        }

        const result = await shippingService.quoteShippingFromOrder(orderId);

        return res.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/create-shipment', async (req, res) => {
    try {
        const { order, items, address, agencyCode, deliveryType } = req.body || {};

        if (!order || !order.id) {
            return res.status(400).json({
                error: 'order con id es obligatorio',
                code: 'MISSING_ORDER',
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'items es obligatorio y debe ser un array no vacío',
                code: 'MISSING_ITEMS',
            });
        }

        if (!address || typeof address !== 'object') {
            return res.status(400).json({
                error: 'address es obligatorio',
                code: 'MISSING_ADDRESS',
            });
        }

        if (!deliveryType || !['D', 'S'].includes(deliveryType)) {
            return res.status(400).json({
                error: 'deliveryType debe ser D o S',
                code: 'INVALID_DELIVERY_TYPE',
            });
        }

        const result = await correoProvider.createShipment({
            order,
            items,
            address,
            agencyCode,
            deliveryType,
        });

        return res.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.post('/create-shipment-from-order', async (req, res) => {
    try {
        const {
            orderId,
            deliveryType,
            agencyCode,
            agencyName,
            serviceType,
        } = req.body || {};

        if (!orderId) {
            return res.status(400).json({
                error: 'orderId es obligatorio',
                code: 'MISSING_ORDER_ID',
            });
        }

        if (!deliveryType || !['D', 'S'].includes(deliveryType)) {
            return res.status(400).json({
                error: 'deliveryType debe ser D o S',
                code: 'INVALID_DELIVERY_TYPE',
            });
        }

        const result = await shippingService.createCorreoShipmentFromOrderId({
            orderId,
            deliveryType,
            agencyCode,
            agencyName,
            serviceType,
        });

        return res.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/tracking/:shippingId', async (req, res) => {
    try {
        const { shippingId } = req.params;
        const result = await correoProvider.tracking({ shippingId });

        return res.json({
            ok: true,
            tracking: result,
        });
    } catch (error) {
        return handleError(res, error);
    }
});

module.exports = router;