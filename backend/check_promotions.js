const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n📊 === VERIFICACIÓN DE DATOS DE PROMOCIONES ===\n');

    const promotions = await prisma.promotion.findMany({
      include: {
        rules: true,
      },
    });

    console.log(`✅ Total de promociones: ${promotions.length}\n`);

    promotions.forEach((promo, idx) => {
      console.log(`${idx + 1}. ${promo.name}`);
      console.log(`   Tipo: ${promo.type} | Valor: ${promo.value}`);
      console.log(`   Activa: ${promo.isActive ? '✓' : '✗'} | Prioridad: ${promo.priority}`);
      console.log(`   Período: ${new Date(promo.startDate).toLocaleDateString()} - ${new Date(promo.endDate).toLocaleDateString()}`);
      console.log(`   Reglas asignadas: ${promo.rules.length}`);
      if (promo.rules.length > 0) {
        const productCount = promo.rules.filter(r => r.productId).length;
        const categoryCount = promo.rules.filter(r => r.categoryId).length;
        console.log(`     └─ ${productCount} productos + ${categoryCount} categorías`);
      }
      console.log('');
    });

    // Estadísticas
    const activeCount = promotions.filter(p => p.isActive).length;
    const futureCount = promotions.filter(p => new Date(p.startDate) > new Date()).length;
    const expiredCount = promotions.filter(p => new Date(p.endDate) < new Date()).length;

    console.log('📈 Estadísticas:');
    console.log(`   Activas ahora: ${activeCount}`);
    console.log(`   Próximas (futuras): ${futureCount}`);
    console.log(`   Vencidas: ${expiredCount}`);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
