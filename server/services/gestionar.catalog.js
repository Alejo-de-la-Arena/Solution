const { supabase } = require('../lib/supabase');
const gestionarProvider = require('./providers/gestionar.provider');

/**
 * Concilia los productos de Solution (`products.sku`) con los productos cargados
 * en Gestionar y guarda el `id` interno de Gestionar en `products.gestionar_product_id`.
 *
 * No crea nada en Gestionar — los productos ya están cargados ahí con stock.
 * Sólo actualiza la columna de mapeo en Solution para que el dispatcher pueda
 * referenciar el ID correcto al armar el Excel.
 *
 * @returns {Promise<{ matched: Array, unmatched: Array }>}
 *  - matched: productos Solution que pudieron mapearse → { id, slug, sku, gestionar_product_id }
 *  - unmatched: productos Solution con SKU pero sin match en Gestionar (revisar manualmente)
 */
async function linkCatalog() {
    if (!supabase) throw new Error('Supabase no configurado');

    const [{ data: solutionProducts, error: dbErr }, gestionarProducts] = await Promise.all([
        supabase
            .from('products')
            .select('id, slug, sku, gestionar_product_id')
            .not('sku', 'is', null),
        gestionarProvider.getProducts(),
    ]);

    if (dbErr) {
        throw new Error(`Error leyendo products: ${dbErr.message}`);
    }

    // Index Gestionar por SKU para búsqueda O(1)
    const byGestionarSku = new Map();
    for (const gp of gestionarProducts || []) {
        for (const sku of gp.skus || []) {
            if (sku) byGestionarSku.set(String(sku).trim(), gp);
        }
    }

    const matched = [];
    const unmatched = [];

    for (const sp of solutionProducts || []) {
        const gp = byGestionarSku.get(String(sp.sku).trim());
        if (!gp) {
            unmatched.push({ id: sp.id, slug: sp.slug, sku: sp.sku });
            continue;
        }
        // Skip si ya está mapeado al mismo ID
        if (sp.gestionar_product_id === gp.id) {
            matched.push({
                id: sp.id,
                slug: sp.slug,
                sku: sp.sku,
                gestionar_product_id: gp.id,
                changed: false,
            });
            continue;
        }
        const { error: upErr } = await supabase
            .from('products')
            .update({ gestionar_product_id: gp.id })
            .eq('id', sp.id);
        if (upErr) {
            unmatched.push({
                id: sp.id,
                slug: sp.slug,
                sku: sp.sku,
                error: upErr.message,
            });
            continue;
        }
        matched.push({
            id: sp.id,
            slug: sp.slug,
            sku: sp.sku,
            gestionar_product_id: gp.id,
            changed: true,
        });
    }

    return { matched, unmatched };
}

module.exports = { linkCatalog };
