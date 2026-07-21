import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign } from 'lucide-react';
import styles from './PriceUpdateModal.module.css';
interface PriceUpdateModalProps {
    productName: string;
    currentPrice: number;
    currentCost?: number | null;
    onClose: () => void;
    onSave: (data: { cost: number; changeReason: string }) => Promise<void>;
}
const REASON_OPTIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'market_adjustment', label: 'Ajuste de mercado' },
    { value: 'promotion', label: 'Promocin' },
    { value: 'negotiation', label: 'Negociacin' },
    { value: 'adjustment', label: 'Ajuste' },
];
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
export function PriceUpdateModal({ productName, currentPrice, currentCost, onClose, onSave }: PriceUpdateModalProps) {
    const [cost, setCost] = useState(currentCost != null ? String(currentCost) : '');
    const [reason, setReason] = useState('market_adjustment');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const costNum = cost ? parseFloat(cost) : 0;

    useEffect(() => {
        setCost(currentCost != null ? String(currentCost) : '');
        setReason('market_adjustment');
        setErrors({});
    }, [currentCost, currentPrice, productName]);
    const priceNum = currentPrice;
    const margin = priceNum > 0 && costNum > 0
        ? ((priceNum - costNum) / costNum) * 100
        : null;
    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!cost || isNaN(costNum) || costNum <= 0) errs.cost = 'El costo debe ser mayor a 0';
        if (costNum > priceNum) errs.cost = 'El costo no puede ser mayor al precio de venta';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }
    async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
        e?.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({ cost: costNum, changeReason: reason });
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al actualizar costo';
            setErrors({ cost: message });
        } finally {
            setSaving(false);
        }
    }

    const modalContent = (
        <div className={styles.backdrop} role="presentation">
            <button
                type="button"
                className={styles.backdropOverlay}
                onClick={onClose}
                aria-label="Cerrar modal"
                tabIndex={-1}
            />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="price-update-modal-title">
                <div className={styles.header}>
                    <div id="price-update-modal-title" className={styles.headerTitle}><DollarSign size={16} /> Actualizar Costo</div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className={styles.productName}>{productName}</div>
                <div className={styles.formContainer}>
                    <div className={styles.infoRow}>
                        <div className={styles.infoField}>
                            <label htmlFor="precio">Precio de Venta</label>
                            <div className={styles.infoValue}>{fmt.format(currentPrice)}</div>
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="price-update-cost-input">Costo *</label>
                            <input
                                id="price-update-cost-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={cost}
                                onChange={e => setCost(e.target.value)}
                                className={errors.cost ? styles.inputError : ''}
                            />
                            {errors.cost && <span className={styles.errorMsg}>{errors.cost}</span>}
                            {!errors.cost && currentCost !== costNum && costNum > 0 && (
                                <span className={styles.hint}>
                                    Antes: {fmt.format(currentCost ?? 0)} →
                                    {' '}{costNum > (currentCost ?? 0) ? '+' : ''}{(((costNum - (currentCost ?? 0)) / (currentCost ?? 1)) * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
                    {margin !== null && (
                        <div className={`${styles.marginBadge} ${margin < 10 ? styles.low : margin < 15 ? styles.mid : styles.ok}`}>
                            Margen estimado: {margin.toFixed(1)}%
                        </div>
                    )}
                    <div className={styles.field}>
                        <label htmlFor="price-update-reason-select">Razón del cambio</label>
                        <select id="price-update-reason-select" value={reason} onChange={e => setReason(e.target.value)}>
                            {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div className={styles.actions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                        <button
                            type="button"
                            className={styles.btnSave}
                            disabled={saving}
                            onClick={handleSubmit}
                        >
                            {saving ? 'Guardando...' : 'Actualizar Costo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') {
        return modalContent;
    }

    return createPortal(modalContent, document.body);
}
