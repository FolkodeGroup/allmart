import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../../../types';
import styles from './AdminCategories.module.css';
import { Image as ImageIcon } from 'lucide-react';


interface CategoryCardProps {
  category: Category;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  productCount?: number;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

export const CategoryCard: FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  productCount,
  selected = false,
  onSelect,
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.cardWrapper} style={{ position: 'relative' }}>
      {/* Checkbox de selección múltiple */}
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(category.id, e.target.checked)}
          className={styles.cardCheckbox}
          style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}
          title="Seleccionar categoría"
          aria-label={`Seleccionar categoría ${category.name}`}
          onClick={e => e.stopPropagation()}
        />
      )}
      <div
        className={styles.card}
        onClick={() => navigate(`/admin/categorias/${category.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/admin/categorias/${category.id}`); } }}
        role="button"
        tabIndex={0}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
      >
        {category.image ? (
          <img src={category.image} alt={category.name} className={styles.cardImg} />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <ImageIcon size={48} />
          </div>
        )}
        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <span className={styles.cardName}>{category.name}</span>
            {productCount !== undefined && (
              <span className={styles.cardCount}>{productCount} prod.</span>
            )}
          </div>
          <span className={styles.cardSlug}>{category.slug}</span>
          {category.description && (
            <span className={styles.cardDesc} title={category.description} style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{category.description}</span>
          )}
          {(canEdit || canDelete) && (
            <div className={styles.cardActions}>
              {canEdit && (
                <button type="button" className={styles.editBtn} onClick={(e) => { e.stopPropagation(); onEdit?.(category.id); }} title="Editar">✏️</button>
              )}
              {canDelete && (
                <button type="button" className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete?.(category.id); }} title="Eliminar">🗑️</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
