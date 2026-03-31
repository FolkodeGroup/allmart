import type { FC } from 'react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../../../types';
import styles from './AdminCategories.module.css';
import { Image as ImageIcon, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { ProductImage } from '../../../components/ui/ProductImage';
import { Tooltip } from '../../../components/ui/Tooltip';

interface CategoryCardProps {
  category: Category;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  productCount?: number;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onToggleVisibility?: (id: string, newVisible: boolean) => void;
}

/**
 * Helper para determinar si una categoría está vacía
 */
const isEmptyCategory = (productCount?: number) => {
  return productCount === 0;
};

export const CategoryCard: FC<CategoryCardProps> = memo(({
  category,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  productCount,
  selected = false,
  onSelect,
  onToggleVisibility,
}) => {
  const navigate = useNavigate();

  const isEmpty = isEmptyCategory(productCount);

  return (
    <div className={styles.cardWrapper} style={{ position: 'relative', willChange: 'opacity, transform' }}>

      {/* Checkbox de selección múltiple */}
      {onSelect && (
        <Tooltip content={`Seleccionar categoría ${category.name}`}>
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(category.id, e.target.checked)}
            className={styles.cardCheckbox}
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}
            aria-label={`Seleccionar categoría ${category.name}`}
            tabIndex={0}
            onClick={e => e.stopPropagation()}
          />
        </Tooltip>
      )}

      <div
        className={`${styles.card}${isEmpty ? ` ${styles.emptyCard}` : ''}`}
        onClick={() => navigate(`/admin/categorias/${category.slug || category.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/admin/categorias/${category.slug || category.id}`);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalles de la categoría ${category.name}`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          outline: 'none'
        }}
      >
        {/* Imagen */}
        {category.image ? (
          <ProductImage
            src={category.image}
            alt={category.name}
            className={styles.cardImg}
            width={300}
            height={140}
            placeholder={'data:image/svg+xml,%3Csvg width="300" height="140" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="300" height="140" fill="%23f3f3f3"/%3E%3C/svg%3E'}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <ImageIcon size={48} aria-hidden="true" focusable="false" />
          </div>
        )}

        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <span className={styles.cardName}>{category.name}</span>

            {/* Indicador de productos */}
            {productCount !== undefined && (
              <Tooltip
                content={
                  isEmpty
                    ? "Esta categoría no tiene productos asociados. Considerá agregar productos para mejorar la visibilidad."
                    : undefined
                }
              >
                <span className={`${styles.cardCount}${isEmpty ? ` ${styles.emptyCount}` : ''}`}>
                  {isEmpty ? (
                    <>
                      <AlertTriangle
                        size={16}
                        className={styles.emptyIcon}
                        aria-hidden="true"
                      />
                      {' '}Sin productos
                    </>
                  ) : (
                    `${productCount} prod.`
                  )}
                </span>
              </Tooltip>
            )}
          </div>

          <span className={styles.cardSlug}>{category.slug}</span>

          {category.description && (
            <span
              className={styles.cardDesc}
              title={category.description}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {category.description}
            </span>
          )}

          {/* Acciones */}
          {(canEdit || canDelete) && (
            <div className={styles.cardActions}>

              {canEdit && (
                <Tooltip content="Editar categoría" placement="top">
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={e => {
                      e.stopPropagation();
                      onEdit?.(category.id);
                    }}
                    aria-label={`Editar categoría ${category.name}`}
                    tabIndex={0}
                  >
                    ✏️
                  </button>
                </Tooltip>
              )}

              {canEdit && onToggleVisibility && (
                <Tooltip
                  content={category.isVisible ? 'Ocultar categoría' : 'Mostrar categoría'}
                  placement="top"
                >
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleVisibility(category.id, !category.isVisible);
                    }}
                    aria-label={`${category.isVisible ? 'Ocultar' : 'Mostrar'} categoría ${category.name}`}
                    tabIndex={0}
                    title={category.isVisible ? 'Ocultar' : 'Mostrar'}
                  >
                    {category.isVisible ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}
                  </button>
                </Tooltip>
              )}

              {canDelete && (
                <Tooltip content="Eliminar categoría" placement="top">
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={e => {
                      e.stopPropagation();
                      onDelete?.(category.id);
                    }}
                    aria-label={`Eliminar categoría ${category.name}`}
                    tabIndex={0}
                  >
                    🗑️
                  </button>
                </Tooltip>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';