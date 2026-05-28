import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import styles from './PriceUpdateModal.module.css';

interface PriceUpdateModalProps {
    productName: string;
    currentPrice: number;
    currentCost?: number | null;
    onClose: () => void;
    onSave: (data: { price: number; cost?: number; changeReason: string }) => Promise<void>;
}

const REASON_OPTIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'market_adjustment', label: 'Ajuste de mercado' },
    { value: 'promotion', label: 'Promoción' },
    { value: 'negotiation', label: 'Negociación' },
    { value: 'adjustment', label: 'Ajuste' },
];

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function PriceUpdateModal({ productName, currentPrice, currentCost, onClose, onSave }: PriceUpdateModalProps) {
    const [price, setPrice] = useState(String(currentPrice));
    const [cost, setCost] = useState(currentCost != null ? String(currentCost) : '');
    const [reason, setReason] = useState('market_adjustment');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const priceNum = parseFloat(price);
    const costNum = cost ? parseFloat(cost) : undefined;
    const margin = priceNum > 0 && costNum != null && costNum > 0
        ? ((priceNum - costNum) / costNum) * 100
        : null;

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!price || isNaN(priceNum) || priceNum <= 0) errs.price = 'El precio debe ser mayor a 0';
        if (costNum != null && isNaN(costNum)) errs.cost = 'Costo inválido';
        if (costNum != null && costNum < 0) errs.cost = 'El costo no puede ser negativo';
        if (costNum != null && costNum > priceNum) errs.cost = 'El costo no puede ser mayor al precio';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({ price: priceNum, cost: costNum, changeReason: reason });
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al actualizar precio';
            setErrors({ price: message });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose} role="presentation" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-labelledby="price-update-title">
                <div className={styles.header}>
                    <div id="price-update-title" className={styles.headerTitle}><DollarSign size={16} /> Actualizar Precio</div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                <div className={styles.productName}>{productName}</div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="price-input">Precio de Venta *</label>
                            <input id="price-input" type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className={errors.price ? styles.inputError : ''} />
                            {errors.price && <span className={styles.errorMsg}>{errors.price}</span>}
                            {!errors.price && currentPrice !== priceNum && priceNum > 0 && (
                                <span className={styles.hint}>
                                    Antes: {fmt.format(currentPrice)} →
                                    {' '}{priceNum > currentPrice ? '+' : ''}{(((priceNum - currentPrice) / currentPrice) * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="cost-input">Costo (opcional)</label>
                            <input id="cost-input" type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className={errors.cost ? styles.inputError : ''} placeholder="Opcional" />
                            {errors.cost && <span className={styles.errorMsg}>{errors.cost}</span>}
                        </div>
                    </div>

                    {margin !== null && (
                        <div className={`${styles.marginBadge} ${margin < 10 ? styles.low : margin < 15 ? styles.mid : styles.ok}`}>
                            Margen estimado: {margin.toFixed(1)}%
                        </div>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="reason-select">Razón del cambio</label>
                        <select id="reason-select" value={reason} onChange={e => setReason(e.target.value)}>
                            {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.btnSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Actualizar Precio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
