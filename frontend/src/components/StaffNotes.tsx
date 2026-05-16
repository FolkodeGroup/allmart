import { useState, useCallback, useMemo, memo } from 'react';
import { useStaffNotes } from '../hooks/useStaffNotes';
import type { StaffNote } from '../types/staffNote';

import styles from './StaffNotes.module.css';

interface UIState {
    newContent: string;
    editingId: string | null;
    editContent: string;
    creating: boolean;
    deletingId: string | null;
    deletingConfirm: string | null;
    hoveredId: string | null;
    pinnedExpandedId: string | null;
    actionsHiddenFor: string | null;
}

const INITIAL_UI_STATE: UIState = {
    newContent: '',
    editingId: null,
    editContent: '',
    creating: false,
    deletingId: null,
    deletingConfirm: null,
    hoveredId: null,
    pinnedExpandedId: null,
    actionsHiddenFor: null,
};

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

interface NoteCardProps {
    note: StaffNote;
    isExpanded: boolean;
    isEditing: boolean;
    isDeleting: boolean;
    isConfirmingDelete: boolean;
    isActionsHidden: boolean;
    editContent: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onToggleExpanded: () => void;
    onToggleActionsVisibility: () => void;
    onStartEdit: () => void;
    onEditContentChange: (content: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onInitiateDelete: () => void;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
}

const NoteCard = memo(({
    note,
    isExpanded,
    isEditing,
    isDeleting,
    isConfirmingDelete,
    isActionsHidden,
    editContent,
    onMouseEnter,
    onMouseLeave,
    onToggleExpanded,
    onToggleActionsVisibility,
    onStartEdit,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onInitiateDelete,
    onConfirmDelete,
    onCancelDelete,
}: NoteCardProps) => {
    const handleCardClick = useCallback(() => {
        if (!isEditing) {
            onToggleExpanded();
            onToggleActionsVisibility();
        }
    }, [isEditing, onToggleExpanded, onToggleActionsVisibility]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isEditing) {
            e.preventDefault();
            onToggleExpanded();
        }
    }, [isEditing, onToggleExpanded]);

    const handleEditSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onSaveEdit();
    }, [onSaveEdit]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onInitiateDelete();
    }, [onInitiateDelete]);

    const handleConfirmDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onConfirmDelete();
    }, [onConfirmDelete]);

    const handleCancelDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onCancelDelete();
    }, [onCancelDelete]);

    return (
        <div
            className={`${styles['sticky-note']} ${isExpanded ? styles['expanded'] : ''}`}
            role="button"
            tabIndex={0}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
        >
            {isEditing ? (
                <form
                    onSubmit={handleEditSubmit}
                    className={styles['edit-form']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <textarea
                        value={editContent}
                        onChange={(e) => onEditContentChange(e.target.value)}
                        rows={3}
                        className={styles['edit-textarea']}
                        autoFocus
                        aria-label="Editar nota"
                    />
                    <div className={styles['edit-buttons']}>
                        <button type="submit" className={styles['save-btn']}>
                            Guardar
                        </button>
                        <button
                            type="button"
                            className={styles['cancel-btn']}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelEdit();
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <div className={styles['note-content']}>
                        {note.content}
                    </div>

                    <div className={styles['note-metadata']}>
                        <span>
                            {note.user.firstName} {note.user.lastName} • {formatDate(note.updatedAt)}
                        </span>
                    </div>

                    {isConfirmingDelete ? (
                        <div className={styles['delete-confirmation']}>
                            <p>¿Eliminar esta nota?</p>
                            <div className={styles['confirmation-buttons']}>
                                <button
                                    className={styles['confirm-delete-btn']}
                                    onClick={handleConfirmDeleteClick}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Eliminando...' : 'Sí'}
                                </button>
                                <button
                                    className={styles['cancel-btn']}
                                    onClick={handleCancelDeleteClick}
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : !isActionsHidden ? (
                        <div className={styles['note-actions']}>
                            <button
                                className={styles['edit-btn']}
                                title="Editar"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEdit();
                                }}
                            >
                                ✏️
                            </button>
                            <button
                                className={styles['delete-btn']}
                                title="Eliminar"
                                disabled={isDeleting}
                                onClick={handleDeleteClick}
                            >
                                🗑️
                            </button>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
});

NoteCard.displayName = 'NoteCard';

export default function StaffNotes() {
    const { notes, loading, error, createNote, updateNote, deleteNote } = useStaffNotes();
    const [uiState, setUiState] = useState<UIState>(INITIAL_UI_STATE);

    const displayedError = error;

    // Handler callbacks
    const updateUiState = useCallback((updates: Partial<UIState> | ((prev: UIState) => UIState)) => {
        setUiState(prev =>
            typeof updates === 'function'
                ? updates(prev)
                : { ...prev, ...updates }
        );
    }, []);

    const handleAddNote = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uiState.newContent.trim()) return;

        updateUiState({ creating: true });
        try {
            await createNote(uiState.newContent);
            updateUiState({ newContent: '', creating: false });
        } catch {
            updateUiState({ creating: false });
        }
    }, [uiState.newContent, createNote, updateUiState]);

    const handleStartEdit = useCallback((noteId: string, content: string) => {
        updateUiState({ editingId: noteId, editContent: content });
    }, [updateUiState]);

    const handleSaveEdit = useCallback(async (noteId: string) => {
        if (!uiState.editContent.trim()) return;

        try {
            await updateNote(noteId, uiState.editContent);
            updateUiState({ editingId: null, editContent: '' });
        } catch {
            // Error is handled by the hook
        }
    }, [uiState.editContent, updateNote, updateUiState]);

    const handleCancelEdit = useCallback(() => {
        updateUiState({ editingId: null, editContent: '' });
    }, [updateUiState]);

    const handleInitiateDelete = useCallback((noteId: string) => {
        updateUiState({ deletingConfirm: noteId });
    }, [updateUiState]);

    const handleConfirmDelete = useCallback(async (noteId: string) => {
        updateUiState({ deletingId: noteId });
        try {
            await deleteNote(noteId);
            updateUiState({ deletingId: null, deletingConfirm: null });
        } catch {
            updateUiState({ deletingId: null });
        }
    }, [deleteNote, updateUiState]);

    const handleCancelDelete = useCallback(() => {
        updateUiState({ deletingConfirm: null });
    }, [updateUiState]);

    const toggleExpanded = useCallback((noteId: string) => {
        updateUiState(prev => ({
            ...prev,
            pinnedExpandedId: prev.pinnedExpandedId === noteId ? null : noteId,
        }));
    }, [updateUiState]);

    const toggleActionsVisibility = useCallback((noteId: string) => {
        updateUiState(prev => ({
            ...prev,
            actionsHiddenFor: prev.actionsHiddenFor === noteId ? null : noteId,
        }));
    }, [updateUiState]);

    // notesList must be declared before any early returns (Rules of Hooks)
    const notesList = useMemo(() => {
        return notes.map((note) => {
            const isExpanded = uiState.hoveredId === note.id || uiState.pinnedExpandedId === note.id;
            const isEditing = uiState.editingId === note.id;
            const isDeleting = uiState.deletingId === note.id;
            const isConfirmingDelete = uiState.deletingConfirm === note.id;
            const isActionsHidden = uiState.actionsHiddenFor === note.id;

            return (
                <NoteCard
                    key={note.id}
                    note={note}
                    isExpanded={isExpanded}
                    isEditing={isEditing}
                    isDeleting={isDeleting}
                    isConfirmingDelete={isConfirmingDelete}
                    isActionsHidden={isActionsHidden}
                    editContent={uiState.editContent}
                    onMouseEnter={() => updateUiState({ hoveredId: note.id })}
                    onMouseLeave={() =>
                        updateUiState(prev => ({
                            ...prev,
                            hoveredId: prev.hoveredId === note.id ? null : prev.hoveredId,
                        }))
                    }
                    onToggleExpanded={() => toggleExpanded(note.id)}
                    onToggleActionsVisibility={() => toggleActionsVisibility(note.id)}
                    onStartEdit={() => handleStartEdit(note.id, note.content)}
                    onEditContentChange={(content) => updateUiState({ editContent: content })}
                    onSaveEdit={() => handleSaveEdit(note.id)}
                    onCancelEdit={handleCancelEdit}
                    onInitiateDelete={() => handleInitiateDelete(note.id)}
                    onConfirmDelete={() => handleConfirmDelete(note.id)}
                    onCancelDelete={handleCancelDelete}
                />
            );
        });
    }, [
        notes,
        uiState.hoveredId,
        uiState.pinnedExpandedId,
        uiState.editingId,
        uiState.deletingId,
        uiState.deletingConfirm,
        uiState.actionsHiddenFor,
        uiState.editContent,
        updateUiState,
        toggleExpanded,
        toggleActionsVisibility,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit,
        handleInitiateDelete,
        handleConfirmDelete,
        handleCancelDelete,
    ]);

    // Skeleton loading UI
    if (loading) {
        return (
            <div className={styles['staff-notes-widget']}>
                <div className={`${styles['sticky-note']} ${styles['skeleton']}`} />
                <div className={`${styles['sticky-note']} ${styles['skeleton']}`} />
            </div>
        );
    }

    // Error state
    if (displayedError) {
        return (
            <div className={`${styles['staff-notes-widget']} ${styles['error']}`}>
                <p>{displayedError}</p>
            </div>
        );
    }

    // Empty state
    if (!notes.length) {
        return (
            <div className={`${styles['staff-notes-widget']} ${styles['empty']}`}>
                <p>No hay notas del staff aún.</p>
                <form onSubmit={handleAddNote} className={styles['add-note-form']}>
                    <textarea
                        value={uiState.newContent}
                        className={styles['staff-notes-area']}
                        onChange={(e) => updateUiState({ newContent: e.target.value })}
                        placeholder="Escribe una nota..."
                        rows={3}
                        disabled={uiState.creating}
                        aria-label="Nueva nota"
                    />
                    <button
                        type="submit"
                        disabled={uiState.creating || !uiState.newContent.trim()}
                        className={styles['add-btn']}
                    >
                        {uiState.creating ? 'Agregando...' : 'Agregar nota'}
                    </button>
                </form>
            </div>
        );
    }

    // Main widget
    return (
        <div className={styles['staff-notes-widget']}>
            <form
                className={styles['add-note-form']}
                onSubmit={handleAddNote}
            >
                <textarea
                    value={uiState.newContent}
                    onChange={(e) => updateUiState({ newContent: e.target.value })}
                    placeholder="Escribe una nota..."
                    rows={2}
                    className={styles['staff-notes-area']}
                    disabled={uiState.creating}
                    aria-label="Nueva nota"
                />
                <button
                    type="submit"
                    disabled={uiState.creating || !uiState.newContent.trim()}
                    className={styles['add-btn']}
                >
                    {uiState.creating ? 'Agregando...' : 'Agregar nota'}
                </button>
            </form>
            <div className={styles['notes-list']}>
                {notesList}
            </div>
        </div>
    );
}