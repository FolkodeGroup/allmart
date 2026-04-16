import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
  onWizard?: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ canCreate, onNew, onWizard }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerTop}>
        <div>
          {/* <h1 className={sectionStyles.title}>
            <span className={sectionStyles.icon} aria-hidden="true">📦</span> Productos
          </h1> */}
          <p className={sectionStyles.subtitle}>
            Gestioná el catálogo de productos, precios y disponibilidad.
          </p>
        </div>
        {canCreate && (
          <div style={{ position: 'relative' }}>
            <button
              className={styles.newBtn}
              onClick={() => setShowMenu(!showMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              aria-label="Crear nuevo producto"
            >
              + Nuevo producto
              {onWizard && <ChevronDown size={18} />}
            </button>
            {onWizard && showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '200px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    onNew();
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Formulario Completo
                </button>
                <button
                  onClick={() => {
                    onWizard();
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  ✨ Wizard Rápido (3 pasos)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
