import { useState, useEffect, useCallback } from 'react';
import styles from './VariantEditModal.module.css';

interface VariantEditModalProps {
  open: boolean;
  initialName: string;
  initialValues: string[];
  onClose: () => void;
  onSave: (name: string, values: string[]) => void;
}

export function VariantEditModal({
  open,
  initialName,
  initialValues,
  onClose,
  onSave,
}: VariantEditModalProps) {
  const [name, setName] = useState(initialName);
  const [values, setValues] = useState<string[]>(initialValues);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialName);
      setValues(initialValues);
      setNewValue('');
      setError('');
    }
  }, [open, initialName, initialValues]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleAddValue = useCallback(() => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setError('Ese valor ya existe');
      return;
    }
    setValues(prev => [...prev, trimmed]);
    setNewValue('');
    setError('');
  }, [newValue, values]);

  const handleDeleteValue = useCallback((val: string) => {
    setValues(prev => prev.filter(v => v !== val));
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setError('El nombre del grupo es requerido');
      return;
    }
    if (values.length === 0) {
      setError('Agregá al menos un valor');
      return;
    }
    onSave(name.trim(), values);
    setError('');
  }, [name, values, onSave]);

  if (!open) return null;

  return (
    /* El backdrop es solo decorativo; el cierre por click fuera se delega
       a un botón invisible para cumplir con jsx-a11y. */
    <div className={styles.backdrop} role="presentation">
      {/* Área clickeable fuera del modal → cierra */}
      <button
        type="button"
        className={styles.backdropOverlay}
        onClick={onClose}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-modal-title"
      >

        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 id="variant-modal-title" className={styles.title}>
            Editar variante
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Nombre del grupo */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="variant-name">
              Nombre del grupo
            </label>
            <input
              id="variant-name"
              className={`${styles.input} ${error && !name.trim() ? styles.inputError : ''}`}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Color, Talle, Material…"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          {/* Agregar valor */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="variant-new-value">
              Valores
            </label>
            <div className={styles.addRow}>
              <input
                id="variant-new-value"
                className={styles.input}
                type="text"
                value={newValue}
                onChange={e => { setNewValue(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAddValue()}
                placeholder="Ej: Rojo, XL…"
              />
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddValue}
              >
                <i className="bi bi-plus-lg" />
                Agregar
              </button>
            </div>
          </div>

          {/* Chips de valores */}
          <div className={styles.chipList}>
            {values.length === 0 ? (
              <span className={styles.emptyChips}>
                Sin valores aún. Agregá al menos uno.
              </span>
            ) : (
              values.map(val => (
                <span key={val} className={styles.chip}>
                  {val}
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => handleDeleteValue(val)}
                    aria-label={`Eliminar ${val}`}
                  >
                    <i className="bi bi-x" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <p className={styles.errorText}>
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!name.trim() || values.length === 0}
          >
            Guardar cambios
          </button>
        </div>

      </div>
      {/* cierre .modal */}
    </div>
    /* cierre .backdrop */
  );
}