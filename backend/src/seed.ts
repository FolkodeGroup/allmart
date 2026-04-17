/**
 * seed.ts
 * Script para poblar la base de datos con:
 * - Usuarios admin/editor
 * - Categorías (6)
 * - Productos (del mock, primeros 5 como ejemplo)
 *
 * Uso: npm run seed
 * Variables de entorno:
 *   SEED_ADMIN_PASSWORD
 *   SEED_EDITOR_PASSWORD
 */

import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { categories, products } from './seeds/mock';
import { UserRole, ProductStatus, CategoryStatus } from './types';

dotenv.config();

async function seed() {
  try {
    console.log('Iniciando seed...');

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

    console.log('Usuarios insertados correctamente.');

    // ── Categorías ──
    const categoryIdBySlug = new Map<string, string>();
    for (const cat of categories) {
      const row = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          imageUrl: cat.image,
          itemCount: cat.itemCount || 0,
          parentId: null,
        },
      });
      categoryIdBySlug.set(cat.slug, row.id);
    }

    for (const cat of categories) {
      if (!cat.parentSlug) continue;
      const parentId = categoryIdBySlug.get(cat.parentSlug);
      const categoryId = categoryIdBySlug.get(cat.slug);
      if (!parentId || !categoryId) continue;
      await prisma.category.update({
        where: { id: categoryId },
        data: { parentId },
      });
    }

    console.log('Categorías insertadas correctamente.');

    // ── Productos ──
    const productsToInsert = products.slice(0, 5); // primeros 5 productos del mock

    for (const prod of productsToInsert) {
      const categorySlugs = Array.isArray(prod.categorySlugs)
        ? prod.categorySlugs
        : Array.isArray(prod.categories)
          ? prod.categories.map((cat: any) => cat.slug)
          : prod.category?.slug
            ? [prod.category.slug]
            : [];

      const categoryIds = categorySlugs
        .map((slug: string) => categoryIdBySlug.get(slug))
        .filter((id: string | undefined): id is string => Boolean(id));

      if (categoryIds.length === 0) {
        console.warn(`Categoría no encontrada para el producto: ${prod.name}`);
        continue;
      }

      const primaryCategoryId = categoryIds[0];

      const updateData = {
        images: prod.images,
        shortDescription: prod.shortDescription || null,
        description: prod.description || null,
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        discount: prod.discount || null,
        tags: prod.tags || [],
        features: prod.features || [],
        status: ProductStatus.ACTIVE,
        categoryId: primaryCategoryId,
      };

      const createData = {
        name: prod.name,
        slug: prod.slug,
        description: prod.description || null,
        shortDescription: prod.shortDescription || null,
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        discount: prod.discount || null,
        images: prod.images,
        categoryId: primaryCategoryId,
        tags: prod.tags || [],
        rating: prod.rating || 0,
        reviewCount: prod.reviewCount || 0,
        inStock: prod.inStock ?? true,
        stock: 0,
        sku: prod.sku || null,
        features: prod.features || [],
        status: ProductStatus.ACTIVE,
      };

      const existingBySlug = await prisma.product.findUnique({
        where: { slug: prod.slug },
        select: { id: true },
      });
      const existingBySku = prod.sku
        ? await prisma.product.findUnique({ where: { sku: prod.sku }, select: { id: true } })
        : null;

      const productRow = existingBySlug
        ? await prisma.product.update({ where: { id: existingBySlug.id }, data: updateData })
        : existingBySku
          ? await prisma.product.update({ where: { id: existingBySku.id }, data: updateData })
          : await prisma.product.create({ data: createData });

      await prisma.productCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          productId: productRow.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    console.log('Productos insertados correctamente.');
    console.log('Seed finalizado correctamente.');
  } catch (err) {
    console.error('Error en seed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
seed();