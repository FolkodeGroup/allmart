import type { AdminActivityLog } from './adminActivityLogService';

const MOCK_ACTIONS = ['create', 'edit', 'delete', 'order', 'user', 'alert'];
const MOCK_ENTITIES = ['product', 'category', 'order', 'user', 'variant', 'image'];
const MOCK_USERS = [
    'admin@allmart.com',
    'manager@allmart.com',
    'maria@allmart.com',
    'juan@allmart.com',
    'soporte@allmart.com',
];

function generateMockId(): string {
    return Math.floor(Math.random() * 10000).toString();
}

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockActivity(minutesAgo: number = 0): AdminActivityLog {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

    return {
        timestamp: timestamp.toISOString(),
        user: getRandomElement(MOCK_USERS),
        action: getRandomElement(MOCK_ACTIONS),
        entity: getRandomElement(MOCK_ENTITIES),
        entityId: generateMockId(),
        details: {
            changes: {
                before: {},
                after: {},
            },
        },
    };
}

export function generateMockActivityLog(count: number = 15): AdminActivityLog[] {
    const activities: AdminActivityLog[] = [];
    for (let i = 0; i < count; i++) {
        activities.push(generateMockActivity(i * 3));
    }
    return activities.reverse();
}

export function simulateNewActivity(): AdminActivityLog {
    return generateMockActivity(0);
}
