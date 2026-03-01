-- =============================================================================
-- Allmart — Seed de datos iniciales para Docker
-- Se ejecuta AUTOMÁTICAMENTE cuando el contenedor PostgreSQL arranca
-- por primera vez (docker-entrypoint-initdb.d).
--
-- Usuarios por defecto:
--   admin@admin.com    / admin   (rol: admin)
--   editor@allmart.com / admin   (rol: editor)
-- =============================================================================

-- ─── Usuario Admin ───────────────────────────────────────────────────────────
-- Contraseña: admin (hash bcrypt con salt 10)
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
VALUES (
  'Admin',
  'Allmart',
  'admin@admin.com',
  '$2b$10$qUXEtlkZs4SUDmSSXUo3jOesLy0SL/h9TVykg0gl27wo78QsX8Odu',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- ─── Usuario Editor ──────────────────────────────────────────────────────────
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
VALUES (
  'Editor',
  'Allmart',
  'editor@allmart.com',
  '$2b$10$qUXEtlkZs4SUDmSSXUo3jOesLy0SL/h9TVykg0gl27wo78QsX8Odu',
  'editor',
  true
) ON CONFLICT (email) DO NOTHING;

\echo '✅  Usuarios admin y editor creados.'
