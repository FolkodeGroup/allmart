const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    try {
        const has = Object.keys(p).includes('productSku');
        console.log(has ? 'HAS productSku' : 'NO productSku');
    } finally {
        await p.$disconnect().catch(() => { });
    }
})();
