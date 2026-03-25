import { useState } from 'react';
import { useStaffNotes } from '../hooks/useStaffNotes';


function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString();
}

export default function StaffNotes() {
    const { notes, loading, error, createNote, updateNote, deleteNote } = useStaffNotes();
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [pinnedExpandedId, setPinnedExpandedId] = useState<string | null>(null);

    // Skeleton loading
    if (loading) {
        return (
            <div className="staff-notes-widget">
                <div className="sticky-note skeleton" style={{ height: 100, width: 200, marginBottom: 12 }} />
                <div className="sticky-note skeleton" style={{ height: 100, width: 200 }} />
            </div>
        );
    }

    // Error state
    if (error) {
        return <div className="staff-notes-widget error">{error}</div>;
    }

    // Empty state
    if (!notes.length) {
        return (
            <div className="staff-notes-widget empty">
                <p>No hay notas del staff aún.</p>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newContent.trim()) return;
                        setCreating(true);
                        await createNote(newContent);
                        setNewContent('');
                        setCreating(false);
                    }}
                >
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Escribe una nota..."
                        rows={3}
                        style={{ width: '100%', resize: 'vertical' }}
                        disabled={creating}
                    />
                    <button type="submit" disabled={creating || !newContent.trim()} className="add-btn">
                        {creating ? 'Agregando...' : 'Agregar nota'}
                    </button>
                </form>
            </div>
        );
    }

    // Main widget
    return (
        <div className="staff-notes-widget">
            <form
                className="add-note-form"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newContent.trim()) return;
                    setCreating(true);
                    await createNote(newContent);
                    setNewContent('');
                    setCreating(false);
                }}
            >
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Escribe una nota..."
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                    disabled={creating}
                />
                <button type="submit" disabled={creating || !newContent.trim()} className="add-btn">
                    {creating ? 'Agregando...' : 'Agregar nota'}
                </button>
            </form>
            <div className="notes-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                {notes.map((note) => {
                    const isExpanded = hoveredId === note.id || pinnedExpandedId === note.id;
                    const toggleExpanded = () => {
                        setPinnedExpandedId((current) => (current === note.id ? null : note.id));
                    };

                    return (
                    <div
                        key={note.id}
                        className={`sticky-note ${isExpanded ? 'expanded' : ''}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredId(note.id)}
                        onMouseLeave={() => setHoveredId((current) => (current === note.id ? null : current))}
                        onClick={() => {
                            if (editingId !== note.id) toggleExpanded();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (editingId !== note.id) toggleExpanded();
                            }
                        }}
                        style={{
                            background: '#fffbe7',
                            border: '1px solid #f7e07e',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px #0001',
                            width: isExpanded ? 320 : 220,
                            minHeight: 120,
                            padding: 12,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        {editingId === note.id ? (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    await updateNote(note.id, editContent);
                                    setEditingId(null);
                                }}
                            >
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', resize: 'vertical' }}
                                // autoFocus intentionally omitted for accessibility
                                />
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    <button type="submit" className="save-btn">Guardar</button>
                                    <button type="button" className="cancel-btn" onClick={() => setEditingId(null)}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="note-content">{note.content}</div>
                                <button
                                    type="button"
                                    className="expand-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpanded();
                                    }}
                                >
                                    {isExpanded ? 'Ver menos' : 'Ver mas'}
                                </button>
                                <div style={{ fontSize: 12, color: '#b59d2b', marginTop: 8 }}>
                                    <span>
                                        {note.user.firstName} {note.user.lastName} • {formatDate(note.updatedAt)}
                                    </span>
                                </div>
                                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                                    <button
                                        className="edit-btn"
                                        title="Editar"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(note.id);
                                            setEditContent(note.content);
                                        }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="delete-btn"
                                        title="Eliminar"
                                        disabled={deletingId === note.id}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setDeletingId(note.id);
                                            await deleteNote(note.id);
                                            setDeletingId(null);
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                                        );
                                })}
            </div>
            <style>{`
        .staff-notes-widget { max-width: 100%; }
                .sticky-note {
                    transition: box-shadow 0.2s ease, transform 0.2s ease;
                    transform-origin: center;
                    z-index: 1;
                    cursor: pointer;
                }
                .sticky-note:hover,
                .sticky-note.expanded {
                    transform: translateY(-5px) scale(1.04);
                    box-shadow: 0 10px 22px #0002;
                    z-index: 5;
                }
        .sticky-note.skeleton { background: #f7e07e33; animation: pulse 1.2s infinite alternate; }
                .note-content {
                    white-space: pre-wrap;
                    word-break: break-word;
                    flex: 1;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    max-height: 3.2em;
                    transition: max-height 0.2s ease;
                }
                .sticky-note:hover .note-content,
                .sticky-note.expanded .note-content {
                    -webkit-line-clamp: unset;
                    display: block;
                    max-height: none;
                    overflow: visible;
                }
        @keyframes pulse { 0% { opacity: 0.7; } 100% { opacity: 1; } }
                .add-btn, .save-btn, .cancel-btn, .edit-btn, .delete-btn, .expand-btn {
          background: #f7e07e;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          margin-top: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .add-btn { background: #ffe066; color: #7c6f1c; }
        .save-btn { background: #b6e07e; color: #2d6a1c; }
        .cancel-btn { background: #eee; color: #888; }
        .edit-btn { background: #fffbe7; color: #b59d2b; }
        .delete-btn { background: #fffbe7; color: #b59d2b; }
                .expand-btn { background: #fff7c6; color: #7c6f1c; font-size: 12px; align-self: flex-start; }
        .add-note-form { margin-bottom: 12px; }
        @media (max-width: 600px) {
          .notes-list { flex-direction: column; gap: 8px; }
          .sticky-note { width: 100%; min-width: 0; }
        }
      `}</style>
        </div>
    );
}