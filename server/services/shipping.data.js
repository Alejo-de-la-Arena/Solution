const { supabase } = require('../lib/supabase');

function assertDb() {
    if (!supabase) {
        throw new Error('Supabase no está configurado en el server.');
    }
}

async function getOrderById(orderId) {
    assertDb();

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) {
        throw new Error(`No se pudo obtener la orden ${orderId}: ${error.message}`);
    }

    return data;
}

async function getOrderItems(orderId) {
    assertDb();

    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('id', { ascending: true });

    if (error) {
        throw new Error(`No se pudieron obtener los items de la orden ${orderId}: ${error.message}`);
    }

    return data || [];
}

async function getProductsByIds(productIds = []) {
    assertDb();

    const uniqueIds = [...new Set((productIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', uniqueIds);

    if (error) {
        throw new Error(`No se pudieron obtener productos: ${error.message}`);
    }

    return data || [];
}

async function getOrderBundle(orderId) {
    const order = await getOrderById(orderId);
    const orderItems = await getOrderItems(orderId);
    const productIds = orderItems.map((item) => item.product_id);
    const products = await getProductsByIds(productIds);

    const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

    const enrichedItems = orderItems.map((item) => {
        const product = productsById[item.product_id] || null;

        return {
            ...item,
            product,
            name: product?.name || null,
            slug: product?.slug || null,
            weight_grams: product?.weight_grams || null,
            width_cm: product?.width_cm || null,
            height_cm: product?.height_cm || null,
            length_cm: product?.length_cm || null,
            price: item.unit_price,
            unit_price: item.unit_price,
        };
    });

    return {
        order,
        orderItems,
        products,
        productsById,
        enrichedItems,
    };
}

async function updateOrderShippingFields(orderId, patch = {}) {
    assertDb();

    const { data, error } = await supabase
        .from('orders')
        .update(patch)
        .eq('id', orderId)
        .select('*')
        .single();

    if (error) {
        throw new Error(`No se pudo actualizar shipping de la orden ${orderId}: ${error.message}`);
    }

    return data;
}

module.exports = {
    getOrderById,
    getOrderItems,
    getProductsByIds,
    getOrderBundle,
    updateOrderShippingFields,
};