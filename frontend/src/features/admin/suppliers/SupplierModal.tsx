import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { suppliersAdminService, type AdminSupplierV2, type SupplierV2Input } from './suppliersAdminService';
import styles from './SupplierModal.module.css';

interface SupplierModalProps {
    supplierId: string | null; // null = create mode
    onClose: () => void;
    onSaved: () => void;
}

const EMPTY: SupplierV2Input = { name: '', phone: '', address: '', email: '', url: '', description: '', isActive: true };

export function SupplierModal({ supplierId, onClose, onSaved }: SupplierModalProps) {
    const [form, setForm] = useState<SupplierV2Input>(EMPTY);
    const [errors, setErrors] = useState<Partial<Record<keyof SupplierV2Input, string>>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!supplierId) { setForm(EMPTY); return; }
        setLoading(true);
        suppliersAdminService.getSupplierV2(supplierId)
            .then((s: AdminSupplierV2) => setForm({
                name: s.name, phone: s.phone, address: s.address,
                email: s.email ?? '', url: s.url ?? '',
                description: s.description ?? '', isActive: s.isActive,
            }))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [supplierId]);

    function validate(): boolean {
        const errs: typeof errors = {};
        if (!form.name?.trim()) errs.name = 'El nombre es obligatorio';
        if (!form.email?.trim()) {
            errs.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errs.email = 'Email inválido';
        }
        if (!form.phone?.trim()) errs.phone = 'El teléfono es obligatorio';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            if (supplierId) {
                await suppliersAdminService.updateSupplierV2(supplierId, form);
            } else {
                await suppliersAdminService.createSupplierV2(form);
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar';
            setErrors({ name: message });
        } finally {
            setSaving(false);
        }
    }

    function field(key: keyof SupplierV2Input) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm(prev => ({ ...prev, [key]: e.target.value }));
            setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
        };
    }

    return (
        <div className={styles.overlay} onClick={onClose} role="presentation" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-supplier-title">
                <div className={styles.header}>
                    <h3 id="modal-supplier-title">{supplierId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal"><X size={18} /></button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Cargando...</div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="modal-supplier-name">Nombre *</label>
                                <input id="modal-supplier-name" name="modalSupplierName" value={form.name} onChange={field('name')} placeholder="Distribuidor ABC" className={errors.name ? styles.inputError : ''} />
                                {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="modal-supplier-email">Email *</label>
                                <input id="modal-supplier-email" name="modalSupplierEmail" type="email" value={form.email} onChange={field('email')} placeholder="ventas@proveedor.com" className={errors.email ? styles.inputError : ''} />
                                {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="modal-supplier-phone">Teléfono *</label>
                                <input id="modal-supplier-phone" name="modalSupplierPhone" value={form.phone} onChange={field('phone')} placeholder="+54 11 4000-0000" className={errors.phone ? styles.inputError : ''} />
                                {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="modal-supplier-url">Web / URL</label>
                                <input id="modal-supplier-url" name="modalSupplierUrl" value={form.url} onChange={field('url')} placeholder="https://proveedor.com" />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="modal-supplier-address">Dirección</label>
                            <input id="modal-supplier-address" name="modalSupplierAddress" value={form.address} onChange={field('address')} placeholder="Av. Corrientes 1234, CABA" />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="modal-supplier-description">Descripción</label>
                            <textarea id="modal-supplier-description" name="modalSupplierDescription" value={form.description} onChange={field('description')} rows={3} placeholder="Descripción del proveedor..." />
                        </div>

                        <label className={styles.checkboxRow} htmlFor="modal-supplier-active">
                            <input
                                id="modal-supplier-active"
                                name="modalSupplierActive"
                                type="checkbox"
                                checked={form.isActive}
                                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            />
                            Proveedor activo
                        </label>

                        <div className={styles.actions}>
                            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                            <button type="submit" className={styles.btnSave} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}