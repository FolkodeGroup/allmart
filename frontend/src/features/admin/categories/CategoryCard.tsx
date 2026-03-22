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
}

export const CategoryCard: FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  productCount,
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.card} tabIndex={0} role="button" onClick={() => navigate(`/admin/categorias/${category.id}`)}>
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
          <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
            {canEdit && (
              <button className={styles.editBtn} onClick={() => onEdit?.(category.id)} title="Editar">✏️</button>
            )}
            {canDelete && (
              <button className={styles.deleteBtn} onClick={() => onDelete?.(category.id)} title="Eliminar">🗑️</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
