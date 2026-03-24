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
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="sticky-note"
                        style={{
                            background: '#fffbe7',
                            border: '1px solid #f7e07e',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px #0001',
                            width: 220,
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
                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>{note.content}</div>
                                <div style={{ fontSize: 12, color: '#b59d2b', marginTop: 8 }}>
                                    <span>
                                        {note.user.firstName} {note.user.lastName} • {formatDate(note.updatedAt)}
                                    </span>
                                </div>
                                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                                    <button
                                        className="edit-btn"
                                        title="Editar"
                                        onClick={() => {
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
                                        onClick={async () => {
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
                ))}
            </div>
            <style>{`
        .staff-notes-widget { max-width: 100%; }
        .sticky-note { transition: box-shadow 0.2s; }
        .sticky-note.skeleton { background: #f7e07e33; animation: pulse 1.2s infinite alternate; }
        @keyframes pulse { 0% { opacity: 0.7; } 100% { opacity: 1; } }
        .add-btn, .save-btn, .cancel-btn, .edit-btn, .delete-btn {
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
        .add-note-form { margin-bottom: 12px; }
        @media (max-width: 600px) {
          .notes-list { flex-direction: column; gap: 8px; }
          .sticky-note { width: 100%; min-width: 0; }
        }
      `}</style>
        </div>
    );
}