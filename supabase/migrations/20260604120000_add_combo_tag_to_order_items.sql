-- Marca qué ítems de una orden provienen de un combo (p. ej. "Combo Día del Padre").
-- NULL = comprado individualmente.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS combo_tag text NULL;
