import type { Order } from '../../../../context/AdminOrdersContext';
import { formatDateLocal } from '../../../../utils/date';

const statuses = [
    'pendiente',
    'confirmado',
    'en-preparacion',
    'enviado',
    'entregado',
    'cancelado',
] as const;

const names = [
    ['Juan', 'Pérez'],
    ['María', 'Gómez'],
    ['Lucas', 'Fernández'],
    ['Sofía', 'Martínez'],
    ['Carlos', 'Ramírez'],
    ['Ana', 'López'],
    ['Diego', 'Torres'],
    ['Valentina', 'Suárez'],
];

// 🔥 Catálogo de productos (clave para el modal)
const productsCatalog = [
    'Hamburguesa',
    'Pizza',
    'Empanadas',
    'Milanesa',
    'Papas fritas',
    'Ensalada',
    'Tacos',
    'Sushi',
    'Helado',
    'Gaseosa',
    'Cerveza',
    'Agua',
    'Sandwich',
    'Wrap',
    'Pollo al horno',
];

export const generateMockOrders = (count: number): Order[] => {
    const orders: Order[] = [];

    for (let i = 0; i < count; i++) {
        const status = statuses[i % statuses.length];
        const [firstName, lastName] = names[i % names.length];

        // 🔥 MISMO DÍA para varios pedidos (agrupa cada 5 órdenes)
        const dayOffset = Math.floor(i / 5);
        const mockDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
        const createdAt = formatDateLocal(mockDate);

        // 🔥 cantidad de productos por orden (1 a 5)
        const itemsCount = Math.floor(Math.random() * 5) + 1;

        const items = Array.from({ length: itemsCount }).map(() => {
            const productName =
                productsCatalog[Math.floor(Math.random() * productsCatalog.length)];

            const quantity = Math.floor(Math.random() * 3) + 1;
            const unitPrice = Math.floor(1000 + Math.random() * 5000);

            return {
                productId: productName.toLowerCase().replace(/\s/g, '-'),
                productName,
                quantity,
                unitPrice,
            };
        });


        // 🔥 total calculado real
        const total = items.reduce(
            (acc, item) => acc + item.quantity * item.unitPrice,
            0
        );

        orders.push({
            id: `order-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt,
            status,
            total,
            paymentStatus: i % 2 === 0 ? 'abonado' : 'no-abonado',
            customer: {
                firstName,
                lastName,
                email: `${firstName.toLowerCase()}@mail.com`,
            },
            items,
        });
    }

    return orders;
};