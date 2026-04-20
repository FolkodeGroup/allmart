import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, FileText, Zap } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from './ProductHeader.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
  onWizard?: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ canCreate, onNew, onWizard }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerRow}>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>

        {canCreate && (
          <div className={styles.btnGroup} ref={menuRef}>
            <button
              className={styles.primaryBtn}
              onClick={() => { onNew(); setShowMenu(false); }}
              aria-label="Crear nuevo producto"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo producto
            </button>

            {onWizard && (
              <>
                <button
                  className={styles.splitBtn}
                  onClick={() => setShowMenu(prev => !prev)}
                  aria-label="Más opciones"
                  aria-expanded={showMenu}
                  aria-haspopup="menu"
                >
                  <ChevronDown size={15} strokeWidth={2} className={showMenu ? styles.chevronOpen : ''} />
                </button>

                {showMenu && (
                  <div className={styles.dropdown} role="menu">
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => { onNew(); setShowMenu(false); }}
                    >
                      <FileText size={15} />
                      <span>
                        <strong>Formulario completo</strong>
                        <small>Todos los campos de una vez</small>
                      </span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => { onWizard(); setShowMenu(false); }}
                    >
                      <Zap size={15} />
                      <span>
                        <strong>Alta rápida</strong>
                        <small>3 pasos guiados</small>
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
