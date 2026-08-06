import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Clock } from 'lucide-react';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';
import styles from './PriceUpdateModal.module.css';

interface PriceUpdateModalProps {
    productName: string;
    currentPrice: number;
    currentCost?: number | null;
    currentLeadTimeValue?: number | null;
    currentLeadTimeUnit?: string | null;
    onClose: () => void;
    onSave: (data: { cost: number; leadTimeValue: number; leadTimeUnit: string; changeReason: string }) => Promise<void>;
}

const REASON_OPTIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'market_adjustment', label: 'Ajuste de mercado' },
    { value: 'promotion', label: 'Promoción' },
    { value: 'negotiation', label: 'Negociación' },
    { value: 'adjustment', label: 'Ajuste' },
];

const UNIT_OPTIONS = [
    { value: 'dias', label: 'Días' },
    { value: 'horas', label: 'Horas' },
];

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function PriceUpdateModal({
    productName,
    currentPrice,
    currentCost,
    currentLeadTimeValue,
    currentLeadTimeUnit,
    onClose,
    onSave,
}: PriceUpdateModalProps) {
    const [cost, setCost] = useState(currentCost != null ? String(currentCost) : '');
    const [leadTimeValue, setLeadTimeValue] = useState(currentLeadTimeValue != null ? String(currentLeadTimeValue) : '3');
    const [leadTimeUnit, setLeadTimeUnit] = useState(currentLeadTimeUnit ?? 'dias');
    const [reason, setReason] = useState('market_adjustment');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const costNum = cost ? parseFloat(cost) : 0;
    const leadTimeNum = leadTimeValue ? parseInt(leadTimeValue, 10) : 0;

    useEffect(() => {
        setCost(currentCost != null ? String(currentCost) : '');
        setLeadTimeValue(currentLeadTimeValue != null ? String(currentLeadTimeValue) : '3');
        setLeadTimeUnit(currentLeadTimeUnit ?? 'dias');
        setReason('market_adjustment');
        setErrors({});
    }, [currentCost, currentLeadTimeValue, currentLeadTimeUnit, currentPrice, productName]);

    const priceNum = currentPrice;
    const margin = priceNum > 0 && costNum > 0
        ? ((priceNum - costNum) / costNum) * 100
        : null;

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!cost || isNaN(costNum) || costNum <= 0) {
            errs.cost = 'El costo debe ser mayor a 0';
        }
        if (costNum > priceNum) {
            errs.cost = 'El costo no puede ser mayor al precio de venta';
        }
        if (isNaN(leadTimeNum) || leadTimeNum < 0) {
            errs.leadTime = 'El tiempo de entrega no puede ser negativo';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
        e?.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({
                cost: costNum,
                leadTimeValue: leadTimeNum,
                leadTimeUnit,
                changeReason: reason,
            });
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al actualizar condiciones';
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
                    <div id="price-update-modal-title" className={styles.headerTitle}>
                        <DollarSign size={16} />
                        <span>Condiciones Comerciales</span>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.productName}>{productName}</div>

                <div className={styles.formContainer}>
                    <div className={styles.infoRow}>
                        <div className={styles.infoField}>
                            <label htmlFor="precio-venta">PRECIO DE VENTA (PÚBLICO)</label>
                            <div className={styles.infoValue}>{fmt.format(currentPrice)}</div>
                        </div>
                    </div>

                    {/* Campo Costo */}
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
                                placeholder="Ej: 8500"
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

                    {/* Campo Tiempo de entrega (Lead Time) */}
                    <div className={styles.field}>
                        <label htmlFor="price-update-leadtime-input">
                            <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                            Tiempo de entrega (Lead Time)
                        </label>
                        <div className={styles.leadTimeGroup}>
                            <input
                                id="price-update-leadtime-input"
                                type="number"
                                min="0"
                                value={leadTimeValue}
                                onChange={e => setLeadTimeValue(e.target.value)}
                                className={`${styles.leadTimeInput} ${errors.leadTime ? styles.inputError : ''}`}
                                placeholder="Ej: 3"
                            />
                            <div className={styles.leadTimeDropdown}>
                                <Dropdown
                                    id="price-update-leadunit-select"
                                    options={UNIT_OPTIONS}
                                    value={leadTimeUnit}
                                    onChange={setLeadTimeUnit}
                                    placeholder="Unidad"
                                />
                            </div>
                        </div>
                        {errors.leadTime && <span className={styles.errorMsg}>{errors.leadTime}</span>}
                    </div>

                    {/* Margen estimado */}
                    {margin !== null && (
                        <div className={`${styles.marginBadge} ${margin < 10 ? styles.low : margin < 15 ? styles.mid : styles.ok}`}>
                            Margen estimado: {margin.toFixed(1)}%
                        </div>
                    )}

                    {/* Razón del cambio */}
                    <div className={styles.field}>
                        <label htmlFor="price-update-reason-select">Razón del cambio</label>
                        <Dropdown
                            id="price-update-reason-select"
                            options={REASON_OPTIONS}
                            value={reason}
                            onChange={setReason}
                            placeholder="Seleccionar razón..."
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className={styles.btnSave}
                            disabled={saving}
                            onClick={handleSubmit}
                        >
                            {saving ? 'Guardando...' : 'Actualizar Condiciones'}
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