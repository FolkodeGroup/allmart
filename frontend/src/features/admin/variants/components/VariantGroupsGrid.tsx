import React from 'react';
import { Box } from 'lucide-react';
import { VariantGroupCard } from './VariantGroupCard';
import { EmptyState } from '../../../../components/ui/EmptyState';
import styles from '../AdminVariants.module.css';

interface VariantGroup {
  id: string;
  name: string;
  values: string[];
  isActive: boolean;
}

interface VariantGroupsGridProps {
  groups: VariantGroup[];
  onEditName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (group: VariantGroup) => void;
  onEditValue: (groupId: string, oldValue: string, newValue: string) => void;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onAddValue: (groupId: string, value: string) => void;
  onRemoveValue: (groupId: string, value: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  newValues: Record<string, string>;
  setNewValue: (groupId: string, value: string) => void;
  errors: Record<string, string>;
  isPendingNavigation: boolean;
  setIsDirty?: (value: boolean) => void;
  onOpenEditModal: (groupId: string) => void;
}

/**
 * VariantGroupsGrid - Contenedor para la lista de grupos de variantes.
 *
 * Responsabilidades:
 * - Renderizar cada grupo como tarjeta.
 * - Mostrar estado vacío si no hay grupos.
 * - Gestionar inputs y errores por grupo.
 */
export const VariantGroupsGrid: React.FC<VariantGroupsGridProps> = ({
  groups,
  onEditName,
  onDelete,
  onEditValue,
  onToggleStatus,
  onAddValue,
  onRemoveValue,
  canEdit,
  canDelete,
  newValues,
  setNewValue,
  errors,
  isPendingNavigation,
  setIsDirty,
}) => {

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<Box size={40} />}
        title="Sin variantes"
        description="Este producto no tiene variantes aún. Podés crear el primer grupo arriba."
      />
    );
  }

  return (
    <div className={styles.groupsGrid}>
      {groups.map(group => (
        <div
          key={group.id}
          className={`fadeIn slideUpIn microHover`}
          style={{ willChange: 'opacity, transform' }}
        >
          <VariantGroupCard
            group={group}
            onEditName={onEditName}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEditValue={onEditValue}
            onToggleStatus={onToggleStatus}
            onAddValue={onAddValue}
            onRemoveValue={onRemoveValue}
            canEdit={canEdit}
            canDelete={canDelete}
            newValue={newValues[group.id] || ''}
            setNewValue={(value) => setNewValue(group.id, value)}
            error={errors[`value-${group.id}`] || ''}
            isPendingNavigation={isPendingNavigation}
            setIsDirty={setIsDirty}
            onOpenEditModal={onOpenEditModal}
          />
        </div>
      ))}
    </div>
  );
};