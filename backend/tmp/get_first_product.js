const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    try {
        const rows = await p.product.findMany({ take: 1 });
        console.log(rows.length ? rows[0].slug : 'NO_PRODUCTS');
    } catch (e) {
        console.error(e);
    } finally {
        await p.$disconnect();
    }
})();
