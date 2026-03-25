import React, { useState } from 'react';
import styles from './BulkEditCategoriesBar.module.css';

export interface BulkEditCategoriesBarProps {
  selectedCount: number;
  onBulkEdit: (data: { name?: string; description?: string; image?: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const BulkEditCategoriesBar: React.FC<BulkEditCategoriesBarProps> = ({
  selectedCount,
  onBulkEdit,
  onCancel,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name && !description && !image) {
      setError('Debes completar al menos un campo para editar.');
      return;
    }
    // Solo enviar campos editados
    const data: { name?: string; description?: string; image?: string } = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (image) data.image = image;
    onBulkEdit(data);
  };

  return (
    <form className={styles.bulkEditBar} onSubmit={handleSubmit} role="form" aria-labelledby="bulk-edit-bar-label">
      <span className={styles.label} id="bulk-edit-bar-label">{selectedCount} seleccionadas</span>
      <label style={{ display: 'none' }} htmlFor="bulk-edit-name">Nuevo nombre</label>
      <input
        id="bulk-edit-name"
        className={styles.input}
        type="text"
        placeholder="Nuevo nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={loading}
        aria-label="Nuevo nombre"
      />
      <label style={{ display: 'none' }} htmlFor="bulk-edit-description">Nueva descripción</label>
      <input
        id="bulk-edit-description"
        className={styles.input}
        type="text"
        placeholder="Nueva descripción"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={loading}
        aria-label="Nueva descripción"
      />
      <label style={{ display: 'none' }} htmlFor="bulk-edit-image">Nueva imagen (URL)</label>
      <input
        id="bulk-edit-image"
        className={styles.input}
        type="text"
        placeholder="Nueva imagen (URL)"
        value={image}
        onChange={e => setImage(e.target.value)}
        disabled={loading}
        aria-label="Nueva imagen"
      />
      <button type="submit" className={styles.editBtn} disabled={loading}>Editar</button>
      <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>Cancelar</button>
      {error && <span className={styles.error} style={{ color: '#ef4444' }} aria-live="assertive">{error}</span>}
    </form>
  );
};
