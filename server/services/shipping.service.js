const correoProvider = require('./providers/correo/correo.provider');
const gestionarProvider = require('./providers/gestionar.provider');
const { isAmbaCoverage } = require('../data/amba-zones');
const { getOrderBundle, updateOrderShippingFields } = require('./shipping.data');
const { buildAddressFromOrder } = require('./providers/correo/correo.mapper');

async function quoteShipping({ items, address }) {
    // AMBA: Gestionar para domicilio + sucursales de Correo como alternativa. Fuera de AMBA: solo Correo.
    if (isAmbaCoverage(address?.postalCode)) {
        const [gestionarResult, correoResult] = await Promise.allSettled([
            gestionarProvider.quote({ items, address }),
            correoProvider.quote({ items, address }),
        ]);

        if (gestionarResult.status === 'fulfilled') {
            const merged = gestionarResult.value;
            if (correoResult.status === 'fulfilled') {
                const branchOptions = (correoResult.value.options || []).filter((o) => o.mode === 'branch');
                if (branchOptions.length > 0) {
                    merged.options = [...merged.options, ...branchOptions];
                    merged.parcel = correoResult.value.parcel || null;
                    merged.customerId = correoResult.value.customerId || null;
                }
            } else {
                console.warn(
                    '[shipping] Correo falló al ofrecer sucursales para CP AMBA:',
                    correoResult.reason?.message || correoResult.reason,
                );
            }
            return merged;
        }

        console.warn(
            '[shipping] Gestionar falló pese a CP AMBA, fallback a Correo:',
            gestionarResult.reason?.message || gestionarResult.reason,
        );
        if (correoResult.status === 'fulfilled') return correoResult.value;
        throw correoResult.reason;
    }
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

    const result = await correoProvider.createShipment({
        order,
        items: enrichedItems,
        address,
        agencyCode,
        deliveryType,
    });

    const raw = result.raw || {};
    console.log('[CORREO] importShipment raw response:', JSON.stringify(raw, null, 2));
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