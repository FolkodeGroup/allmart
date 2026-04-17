-- Seed de promociones para visualización en la aplicación

-- 1. Black Friday 50% (descuento por porcentaje)
INSERT INTO promotions (id, name, description, type, value, start_date, end_date, min_purchase_amount, max_discount, priority, is_active)
VALUES (
  gen_random_uuid(),
  'Black Friday 50%',
  'Gran descuento de Black Friday - 50% en productos seleccionados',
  'percentage'::promotion_type,
  50,
  '2026-04-17'::timestamptz,
  '2026-04-30'::timestamptz,
  NULL,
  NULL,
  10,
  true
);

-- 2. Descuento fijo $500 en compra mayor a $5000
INSERT INTO promotions (id, name, description, type, value, start_date, end_date, min_purchase_amount, max_discount, priority, is_active)
VALUES (
  gen_random_uuid(),
  'Descuento $500 en compras mayores a $5000',
  'Aplica descuento de $500 en cualquier compra mayor a $5000',
  'fixed'::promotion_type,
  500,
  '2026-04-10'::timestamptz,
  '2026-05-10'::timestamptz,
  5000,
  NULL,
  5,
  true
);

-- 3. BOGO - Lleva 1 Gratis
INSERT INTO promotions (id, name, description, type, value, start_date, end_date, min_purchase_amount, max_discount, priority, is_active)
VALUES (
  gen_random_uuid(),
  'BOGO: Compra 1 Electrónico, Lleva 1 Gratis',
  'En productos de electrónica: compra uno y lleva otro gratis',
  'bogo'::promotion_type,
  1,
  '2026-04-18'::timestamptz,
  '2026-04-25'::timestamptz,
  NULL,
  NULL,
  8,
  true
);

-- 4. Descuento futuro (próximo) - 30% en categoría
INSERT INTO promotions (id, name, description, type, value, start_date, end_date, min_purchase_amount, max_discount, priority, is_active)
VALUES (
  gen_random_uuid(),
  'Cyber Week 30% (próximamente)',
  'Descuento de 30% en electrónica durante Cyber Week',
  'percentage'::promotion_type,
  30,
  '2026-05-01'::timestamptz,
  '2026-05-07'::timestamptz,
  NULL,
  NULL,
  7,
  true
);

-- 5. Promoción inactiva (demostración)
INSERT INTO promotions (id, name, description, type, value, start_date, end_date, min_purchase_amount, max_discount, priority, is_active)
VALUES (
  gen_random_uuid(),
  'Liquidación de Verano (Inactiva)',
  'Esta promoción ya no está activa',
  'percentage'::promotion_type,
  40,
  '2026-02-01'::timestamptz,
  '2026-02-28'::timestamptz,
  NULL,
  1000,
  3,
  false
);

-- Asignar productos a las promociones
WITH promo_ids AS (
  SELECT id FROM promotions ORDER BY created_at ASC LIMIT 5
),
promo1 AS (SELECT id FROM promotions WHERE name LIKE 'Black Friday%' LIMIT 1),
promo2 AS (SELECT id FROM promotions WHERE name LIKE 'Descuento $500%' LIMIT 1),
promo3 AS (SELECT id FROM promotions WHERE name LIKE 'BOGO%' LIMIT 1),
promo4 AS (SELECT id FROM promotions WHERE name LIKE 'Cyber Week%' LIMIT 1)
INSERT INTO promotion_rules (id, promotion_id, product_id, category_id)
SELECT gen_random_uuid(), (SELECT id FROM promo1), p.id, NULL
FROM products p LIMIT 3
ON CONFLICT DO NOTHING;

-- Asignar categoría a Black Friday
WITH promo1 AS (SELECT id FROM promotions WHERE name LIKE 'Black Friday%' LIMIT 1)
INSERT INTO promotion_rules (id, promotion_id, product_id, category_id)
SELECT gen_random_uuid(), (SELECT id FROM promo1), NULL, c.id
FROM categories c LIMIT 1
ON CONFLICT DO NOTHING;

-- Asignar 2 productos al descuento fijo
WITH promo2 AS (SELECT id FROM promotions WHERE name LIKE 'Descuento $500%' LIMIT 1)
INSERT INTO promotion_rules (id, promotion_id, product_id, category_id)
SELECT gen_random_uuid(), (SELECT id FROM promo2), p.id, NULL
FROM products p LIMIT 2
ON CONFLICT DO NOTHING;

-- Asignar categoría al BOGO
WITH promo3 AS (SELECT id FROM promotions WHERE name LIKE 'BOGO%' LIMIT 1)
INSERT INTO promotion_rules (id, promotion_id, product_id, category_id)
SELECT gen_random_uuid(), (SELECT id FROM promo3), NULL, c.id
FROM categories c LIMIT 2
ON CONFLICT DO NOTHING;

-- Asignar productos a Cyber Week
WITH promo4 AS (SELECT id FROM promotions WHERE name LIKE 'Cyber Week%' LIMIT 1)
INSERT INTO promotion_rules (id, promotion_id, product_id, category_id)
SELECT gen_random_uuid(), (SELECT id FROM promo4), p.id, NULL
FROM products p LIMIT 2
ON CONFLICT DO NOTHING;

-- Verificar datos
SELECT '✅ Promociones creadas:' as resultado;
SELECT id, name, type, value, is_active, priority, start_date::date, end_date::date FROM promotions ORDER BY created_at DESC;

SELECT '';
SELECT '✅ Reglas asignadas:' as resultado;
SELECT p.name, COUNT(DISTINCT pr.product_id) as productos_directos, COUNT(DISTINCT pr.category_id) as categorias FROM promotions p
LEFT JOIN promotion_rules pr ON p.id = pr.promotion_id
GROUP BY p.id, p.name
ORDER BY p.created_at DESC;
