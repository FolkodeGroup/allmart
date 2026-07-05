import React, { useState, useEffect, useRef } from 'react';
import { suppliersAdminService } from '../features/admin/suppliers/suppliersAdminService';

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

interface UseSupplierFormOptions {
    id?: string;
    onSuccess: () => void;
}

export function useSupplierForm({ id, onSuccess }: UseSupplierFormOptions) {
    const [formData, setFormData] = useState<SupplierFormData>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Partial<SupplierFormData>>({});
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const savedSuccessfully = useRef(false);
    // Guardamos el estado inicial para calcular isDirty
    const initialFormRef = useRef<SupplierFormData>(EMPTY_FORM);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        suppliersAdminService
            .getSupplier(id)
            .then((supplier) => {
                if (!supplier) { setError('Proveedor no encontrado.'); return; }
                const loaded: SupplierFormData = {
                    name: supplier.name ?? '',
                    url: supplier.url ?? '',
                    phone: supplier.phone ?? '',
                    address: supplier.address ?? '',
                    products: supplier.products ?? '',
                };
                setFormData(loaded);
                initialFormRef.current = loaded;
            })
            .catch(() => setError('No se pudo cargar el proveedor.'))
            .finally(() => setLoading(false));
    }, [id]);

    const isDirty =
        JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);

    function validate(form: SupplierFormData): Partial<SupplierFormData> {
        const errors: Partial<SupplierFormData> = {};
        if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
        if (!form.phone.trim()) errors.phone = 'El teléfono es obligatorio';
        if (!form.address.trim()) errors.address = 'La dirección es obligatoria';
        if (!form.products.trim()) errors.products = 'Este campo es obligatorio';
        return errors;
    }

    function handleField<K extends keyof SupplierFormData>(key: K) {
        return (e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: SupplierFormData) => ({ ...prev, [key]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errors = validate(formData);
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        setSaving(true);
        setError(null);
        try {
            if (id) {
                await suppliersAdminService.updateSupplier(id, formData);
            } else {
                await suppliersAdminService.createSupplier(formData);
            }
            savedSuccessfully.current = true;
            initialFormRef.current = formData;
            onSuccess();
        } catch {
            setError('No se pudo guardar el proveedor.');
        } finally {
            setSaving(false);
        }
    }

    return {
        formData,
        fieldErrors,
        loading,
        saving,
        error,
        isDirty,
        handleField,
        handleSubmit,
    };
}