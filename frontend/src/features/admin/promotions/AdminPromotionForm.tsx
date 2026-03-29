/**
 * features/admin/promotions/AdminPromotionForm.tsx
 * Formulario para crear/editar promociones.
 */

import React, { useState, useEffect } from 'react';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import styles from './AdminPromotions.module.css';

interface Props {
  promotion?: Promotion | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const AdminPromotionForm: React.FC<Props> = ({ promotion, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: 'percentage' | 'fixed' | 'bogo';
    value: number;
    startDate: string;
    endDate: string;
    minPurchaseAmount: string;
    maxDiscount: string;
    isActive: boolean;
    priority: number;
    rules: { productIds: string[]; categoryIds: string[] };
  }>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    startDate: '',
    endDate: '',
    minPurchaseAmount: '',
    maxDiscount: '',
    isActive: true,
    priority: 0,
    rules: { productIds: [], categoryIds: [] },
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        type: promotion.type,
        value: promotion.value,
        startDate: promotion.startDate.split('T')[0],
        endDate: promotion.endDate.split('T')[0],
        minPurchaseAmount: promotion.minPurchaseAmount?.toString() || '',
        maxDiscount: promotion.maxDiscount?.toString() || '',
        isActive: promotion.isActive,
        priority: promotion.priority,
        rules: promotion.rules || { productIds: [], categoryIds: [] },
      });
    }
  }, [promotion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        setError('El nombre es requerido');
        return;
      }

      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('La fecha final debe ser posterior a la fecha inicial');
        return;
      }

      const payload = {
        ...formData,
        value: Number(formData.value),
        minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : undefined,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (promotion) {
        await promotionsService.update(promotion.id, payload);
      } else {
        await promotionsService.create(payload);
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando promoción');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>{promotion ? 'Editar Promoción' : 'Nueva Promoción'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nombre *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Descuento de verano"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalles adicionales"
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Tipo de Descuento *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto Fijo ($)</option>
              <option value="bogo">BOGO (Compra 1, Lleva 1 Gratis)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Valor *</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              placeholder="0"
              step={formData.type === 'percentage' ? '0.01' : '1'}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Fecha de Inicio *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Fecha de Fin *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Monto Mínimo de Compra</label>
            <input
              type="number"
              value={formData.minPurchaseAmount}
              onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
              placeholder="0"
              step="0.01"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Descuento Máximo</label>
            <input
              type="number"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
              placeholder="0"
              step="0.01"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Prioridad</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              placeholder="0"
            />
            <small>Mayor número = mayor prioridad</small>
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Activo
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Guardando...' : promotion ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPromotionForm;
