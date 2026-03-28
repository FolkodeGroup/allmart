import type { Order } from '../../../../context/AdminOrdersContext';

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

export const generateMockOrders = (count: number): Order[] => {
    return Array.from({ length: count }).map((_, i) => {
        const status = statuses[i % statuses.length];
        const [firstName, lastName] = names[i % names.length];
        const total = Math.floor(5000 + Math.random() * 70000);

        return {
            id: `order-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            status,
            total,
            paymentStatus: i % 2 === 0 ? 'abonado' : 'no-abonado',
            customer: {
                firstName,
                lastName,
                email: `${firstName.toLowerCase()}@mail.com`,
            },
            items: [
                {
                    productId: `p-${i}`,
                    productName: 'Producto Test',
                    quantity: 1,
                    unitPrice: total,
                },
            ],
        };
    });
};