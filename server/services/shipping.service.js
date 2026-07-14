const correoProvider = require('./providers/correo/correo.provider');
const { getOrderBundle, updateOrderShippingFields } = require('./shipping.data');
const { buildAddressFromOrder } = require('./providers/correo/correo.mapper');

/**
 * Construye un mensaje legible con el detalle REAL de Correo (cuando existe),
 * para persistirlo en la orden y mostrárselo al admin.
 */
function buildCorreoErrorMessage(error) {
    const base = error?.message || 'Error al despachar con Correo Argentino';
    const body = error?.details ?? error?.cause?.response?.data ?? null;
    if (!body) return base;
    let detail;
    if (typeof body === 'string') {
        detail = body;
    } else {
        detail = body.message || body.error || body.detail
            || (Array.isArray(body.errors) ? body.errors.map((e) => e?.message || e).join('; ') : null)
            || JSON.stringify(body);
    }
    detail = detail ? String(detail).trim() : '';
    if (!detail) return base;
    return base.includes(detail) ? base : `${base} — ${detail}`;
}

async function quoteShipping({ items, address }) {
    return correoProvider.quote({ items, address });
}

async function quoteShippingFromOrder(orderId) {
    const bundle = await getOrderBundle(orderId);
    const address = buildAddressFromOrder(bundle.order);
    return quoteShipping({ items: bundle.enrichedItems, address });
}

async function createCorreoShipmentFromOrderId({
    orderId,
    deliveryType,
    agencyCode,
    agencyName,
    serviceType,
}) {
    const bundle = await getOrderBundle(orderId);
    const { order, enrichedItems } = bundle;
    const address = buildAddressFromOrder(order);

    let result;
    try {
        result = await correoProvider.createShipment({
            order,
            items: enrichedItems,
            address,
            agencyCode,
            deliveryType,
        });
    } catch (error) {
        // Trazabilidad: SIEMPRE persistir el fallo en la orden para no quedar
        // ciegos ante el error intermitente de Correo. Luego re-lanzamos para
        // que la ruta devuelva el detalle real al admin.
        const statusCode = error?.statusCode ?? error?.cause?.response?.status ?? null;
        const body = error?.details ?? error?.cause?.response?.data ?? null;
        try {
            await updateOrderShippingFields(orderId, {
                shipping_status: 'error',
                shipping_error_message: buildCorreoErrorMessage(error),
                // Payload EXACTO enviado a Correo (si llegó a construirse), para
                // ver qué dimensiones/datos se mandaron cuando falla el import.
                shipping_import_payload: error?.correoPayload || null,
                shipping_import_response: {
                    ok: false,
                    statusCode,
                    code: error?.code || null,
                    body,
                    at: new Date().toISOString(),
                },
            });
        } catch (persistErr) {
            console.error(
                '[shipping] no se pudo persistir el error de despacho de la orden',
                orderId, ':', persistErr?.message || persistErr,
            );
        }
        throw error;
    }

    const raw = result.raw || {};
    const shippingExternalId =
        raw.shippingId || raw.id || raw.shipmentId || null;
    const trackingNumber =
        raw.trackingNumber || raw.tracking_number || raw.code || null;

    const updatedOrder = await updateOrderShippingFields(orderId, {
        shipping_provider: 'correo_argentino',
        shipping_mode: deliveryType === 'S' ? 'branch' : 'home',
        shipping_service_type: serviceType || null,
        shipping_is_free: Number(order.shipping_cost || 0) === 0,
        shipping_recipient_name: address.name || null,
        shipping_recipient_phone: address.phone || null,
        shipping_recipient_email: address.email || null,
        shipping_street: address.street || null,
        shipping_number: address.number || null,
        shipping_floor: address.floor || null,
        shipping_apartment: address.apartment || null,
        shipping_agency_code: agencyCode || null,
        shipping_agency_name: agencyName || null,
        shipping_customer_id: result.customerId || null,
        shipping_external_id: shippingExternalId,
        shipping_tracking_number: trackingNumber,
        shipping_status: 'imported',
        shipping_error_message: null,
        shipping_import_payload: result.payload,
        shipping_import_response: result.raw,
    });

    return { order: updatedOrder, shipment: result };
}

async function saveQuoteOnOrder({ orderId, quoteResult, selectedOption, agencyCode, agencyName }) {
    const bundle = await getOrderBundle(orderId);
    const address = buildAddressFromOrder(bundle.order);

    const updatedOrder = await updateOrderShippingFields(orderId, {
        shipping_provider: quoteResult?.provider || 'correo_argentino',
        shipping_mode: selectedOption?.mode || null,
        shipping_service_type: selectedOption?.serviceType || null,
        shipping_is_free: !!quoteResult?.freeShipping,
        shipping_original_price: selectedOption?.originalPrice || null,
        shipping_recipient_name: address.name || null,
        shipping_recipient_phone: address.phone || null,
        shipping_recipient_email: address.email || null,
        shipping_street: address.street || null,
        shipping_number: address.number || null,
        shipping_floor: address.floor || null,
        shipping_apartment: address.apartment || null,
        shipping_agency_code: agencyCode || null,
        shipping_agency_name: agencyName || null,
        shipping_customer_id: quoteResult?.customerId || null,
        shipping_quote_payload: {
            parcel: quoteResult?.parcel || null,
            selectedOption: selectedOption || null,
        },
        shipping_quote_response: quoteResult?.raw || null,
    });

    return updatedOrder;
}

module.exports = {
    quoteShipping,
    quoteShippingFromOrder,
    createCorreoShipmentFromOrderId,
    saveQuoteOnOrder,
};