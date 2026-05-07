-- Una orden con N SKUs en Gestionar genera N paquetes (uno por fila del Excel
-- que se pushea a /package/not-linked-register). La columna existente
-- orders.gestionar_package_id es escalar y solo guarda el primer ID — no
-- alcanza para trackear todos los paquetes asociados a una orden multi-item.
--
-- Esta tabla guarda la lista completa: 1 fila por (orden, paquete_gestionar)
-- con el detalle del SKU y la URL de tracking que devuelve la API.

CREATE TABLE IF NOT EXISTS order_gestionar_packages (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    package_id BIGINT NOT NULL,
    qr_code_id TEXT,
    tracking_url TEXT,
    sku TEXT,
    sale_date DATE,
    raw JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (package_id)
);

CREATE INDEX IF NOT EXISTS order_gestionar_packages_order_idx
    ON order_gestionar_packages (order_id);

COMMENT ON TABLE order_gestionar_packages IS
    'Paquetes creados en Gestionar al pushear una orden. 1 fila por SKU pusheado (Gestionar genera 1 paquete por fila del Excel).';
COMMENT ON COLUMN order_gestionar_packages.package_id IS 'package.id devuelto por POST /api/external-client/package/not-linked-register.';
COMMENT ON COLUMN order_gestionar_packages.qr_code_id IS 'qr_code_id del paquete (formato NV-{client_id}-{hash}).';
COMMENT ON COLUMN order_gestionar_packages.tracking_url IS 'URL pública firmada que muestra el historial del paquete.';
COMMENT ON COLUMN order_gestionar_packages.raw IS 'Payload completo del paquete devuelto por Gestionar (debug / forensics).';

-- RLS: la tabla la escribe el server con service_role (bypass de RLS) y la lee
-- via /api/admin que también usa service_role. Anon/authenticated no deben
-- tocarla. Habilitamos RLS sin policies = lockdown total para esas keys.
ALTER TABLE order_gestionar_packages ENABLE ROW LEVEL SECURITY;
