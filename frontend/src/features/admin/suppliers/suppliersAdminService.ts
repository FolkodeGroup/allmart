// Servicio para gestionar proveedores desde el panel administrativo

// Simple local id generator
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface AdminSupplier {
    id: string;
    name: string;
    url: string;
    phone: string;
    address: string;
    products: string;
}

// Simulación de almacenamiento en memoria
let suppliers: AdminSupplier[] = [
    {
        id: uuidv4(),
        name: 'Proveedor Ejemplo',
        url: 'https://proveedor.com',
        phone: '+54 11 1234-5678',
        address: 'Calle Falsa 123, CABA',
        products: 'Papel, Cartón',
    },
];

export const suppliersAdminService = {
    async getAllSuppliers(): Promise<AdminSupplier[]> {
        return Promise.resolve([...suppliers]);
    },
    async getSupplier(id: string): Promise<AdminSupplier | undefined> {
        return Promise.resolve(suppliers.find(s => s.id === id));
    },
    async createSupplier(data: Omit<AdminSupplier, 'id'>): Promise<AdminSupplier> {
        const newSupplier = { ...data, id: uuidv4() };
        suppliers.push(newSupplier);
        return Promise.resolve(newSupplier);
    },
    async updateSupplier(id: string, data: Omit<AdminSupplier, 'id'>): Promise<AdminSupplier | undefined> {
        const idx = suppliers.findIndex(s => s.id === id);
        if (idx === -1) return undefined;
        suppliers[idx] = { ...suppliers[idx], ...data };
        return Promise.resolve(suppliers[idx]);
    },
    async deleteSupplier(id: string): Promise<void> {
        suppliers = suppliers.filter(s => s.id !== id);
        return Promise.resolve();
    },
};
