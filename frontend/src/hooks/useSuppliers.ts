import { useState, useEffect, useCallback } from 'react';
import {
    suppliersAdminService,
    type AdminSupplier,
} from '../features/admin/suppliers/suppliersAdminService';

export interface SupplierFormData {
    name: string;
    url: string;
    phone: string;
    address: string;
    products: string;
}

const EMPTY_FORM: SupplierFormData = {
    name: '',
    url: '',
    phone: '',
    address: '',
    products: '',
};

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SupplierFormData>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Partial<SupplierFormData>>({});

    // Delete confirmation state
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await suppliersAdminService.getAllSuppliers();
            setSuppliers(data);
        } catch {
            setError('No se pudieron cargar los proveedores.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    function validate(form: SupplierFormData): Partial<SupplierFormData> {
        const errors: Partial<SupplierFormData> = {};
        if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
        if (!form.url.trim()) errors.url = 'La URL es obligatoria';
        if (!form.phone.trim()) errors.phone = 'El teléfono es obligatorio';
        if (!form.address.trim()) errors.address = 'La dirección es obligatoria';
        if (!form.products.trim()) errors.products = 'Este campo es obligatorio';
        return errors;
    }

    function openCreate() {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setFieldErrors({});
        setShowForm(true);
    }

    function openEdit(supplier: AdminSupplier) {
        setFormData({
            name: supplier.name,
            url: supplier.url ?? '',
            phone: supplier.phone,
            address: supplier.address,
            products: supplier.products,
        });
        setEditingId(supplier.id);
        setFieldErrors({});
        setShowForm(true);
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setFieldErrors({});
    }

    async function submitForm(): Promise<boolean> {
        const errors = validate(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return false;
        }
        try {
            if (editingId) {
                await suppliersAdminService.updateSupplier(editingId, formData);
            } else {
                await suppliersAdminService.createSupplier(formData);
            }
            await loadSuppliers();
            cancelForm();
            return true;
        } catch {
            setError('No se pudo guardar el proveedor.');
            return false;
        }
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await suppliersAdminService.deleteSupplier(deleteId);
            await loadSuppliers();
        } catch {
            setError('No se pudo eliminar el proveedor.');
        } finally {
            setDeleteId(null);
        }
    }

    return {
        // Data
        suppliers,
        loading,
        error,
        // Form
        showForm,
        editingId,
        formData,
        setFormData,
        fieldErrors,
        openCreate,
        openEdit,
        cancelForm,
        submitForm,
        // Delete
        deleteId,
        setDeleteId,
        confirmDelete,
    };
}