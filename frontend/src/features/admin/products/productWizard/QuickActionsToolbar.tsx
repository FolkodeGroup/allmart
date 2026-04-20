/**
 * Componente QuickActionsToolbar
 *
 * Barra flotante de acciones rápidas para acelerar el flujo de creación de productos.
 * Proporciona botones para:
 * - Guardar
 * - Duplicar
 * - Preview
 * - Publicar
 * - Descartar
 *
 * Incluye tooltips con información de atajos de teclado.
 */

import { motion } from 'framer-motion';
import {
  Save,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import styles from './QuickActionsToolbar.module.css';

interface QuickActionsToolbarProps {
  onSave: () => void;
  onDuplicate: () => void;
  onPreview?: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
  isPublishing?: boolean;
  canPublish?: boolean;
  canDuplicate?: boolean;
}

export function QuickActionsToolbar({
  onSave,
  onDuplicate,
  onPreview,
  onPublish,
  onDiscard,
  isLoading = false,
  isPublishing = false,
  canPublish = true,
  canDuplicate = true,
}: QuickActionsToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const actions = [
    {
      id: 'save',
      icon: Save,
      label: 'Guardar',
      shortcut: 'Ctrl+S',
      onClick: onSave,
      disabled: isLoading,
      color: '#f59e0b',
    },
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Duplicar',
      shortcut: 'Ctrl+D',
      onClick: onDuplicate,
      disabled: !canDuplicate || isLoading,
      color: '#8b5cf6',
    },
    {
      id: 'preview',
      icon: Eye,
      label: 'Preview',
      shortcut: 'N/A',
      onClick: onPreview,
      disabled: !onPreview || isLoading,
      color: '#06b6d4',
      hidden: !onPreview,
    },
    {
      id: 'publish',
      icon: CheckCircle2,
      label: 'Publicar',
      shortcut: 'Ctrl+P',
      onClick: onPublish,
      disabled: !canPublish || isPublishing,
      color: '#10b981',
    },
    {
      id: 'discard',
      icon: XCircle,
      label: 'Descartar',
      shortcut: 'Esc',
      onClick: onDiscard,
      disabled: isLoading,
      color: '#ef4444',
    },
  ];

  const visibleActions = actions.filter((a) => !a.hidden);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={styles.toolbar}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Acciones Rápidas</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleBtn}
          title={isExpanded ? 'Minimizar' : 'Expandir'}
          aria-label={isExpanded ? 'Minimizar acciones' : 'Expandir acciones'}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Actions Grid */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.actionsGrid}
        >
          {visibleActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={styles.actionBtn}
              title={`${action.label} (${action.shortcut})`}
              aria-label={`${action.label} - Atajo: ${action.shortcut}`}
              style={
                {
                  '--action-color': action.color,
                } as React.CSSProperties
              }
            >
              <action.icon size={18} />
              <span className={styles.actionLabel}>{action.label}</span>
              <span className={styles.actionShortcut}>{action.shortcut}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Info Footer */}
      <div className={styles.footer}>
        <span className={styles.info}>
          💡 Usa atajos para agilizar el proceso
        </span>
      </div>
    </motion.div>
  );
}
