/**
 * seed.ts
 * Script para poblar la base de datos con:
 * - Usuarios admin/editor SOLO
 *
 * ⚠️  IMPORTANTE: Este script NO crea categorías ni productos.
 * Las categorías deben ser creadas manualmente en el admin panel.
 * Usar 'npm run seed:demo' solo si se necesita datos de demostración completos.
 *
 * Uso: npm run seed
 * Variables de entorno:
 *   SEED_ADMIN_PASSWORD
 *   SEED_EDITOR_PASSWORD
 */

import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserRole } from './types';

dotenv.config();

async function seed() {
  try {
    console.log('Iniciando seed (solo usuarios)...');

    // ── Usuarios ──
    const adminPassword = process.env.SEED_ADMIN_PASSWORD!;
    const editorPassword = process.env.SEED_EDITOR_PASSWORD!;

    if (!adminPassword || !editorPassword) {
      throw new Error('Faltan variables SEED_ADMIN_PASSWORD o SEED_EDITOR_PASSWORD');
    }

    const hashedAdmin = await bcrypt.hash(adminPassword, 10);
    const hashedEditor = await bcrypt.hash(editorPassword, 10);

    // ADMIN — update: siempre sincroniza el hash con la variable de entorno
    await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {
        passwordHash: hashedAdmin,
        isActive: true,
      },
      create: {
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@admin.com',
        passwordHash: hashedAdmin,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    // EDITOR — update: siempre sincroniza el hash con la variable de entorno
    await prisma.user.upsert({
      where: { email: 'editor@admin.com' },
      update: {
        passwordHash: hashedEditor,
        isActive: true,
      },
      create: {
        firstName: 'Editor',
        lastName: 'Principal',
        email: 'editor@admin.com',
        passwordHash: hashedEditor,
        role: UserRole.EDITOR,
        isActive: true,
      },
    });

    console.log('✅ Usuarios insertados correctamente.');
    console.log('\n⚠️  Recordatorio: Las categorías NO se crean automáticamente.');
    console.log('   Las categorías deben crearse manualmente en el panel de admin.');
    console.log('\n   Si necesitas datos demo completos, ejecuta:');
    console.log('   npm run seed:demo\n');
    console.log('Seed finalizado correctamente.');
  } catch (err) {
    console.error('Error en seed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si se invoca directamente (npm run seed)
if (require.main === module) {
  seed();
}